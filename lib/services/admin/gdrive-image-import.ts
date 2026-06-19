import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';

const GOOGLE_DRIVE_API_KEY = process.env.GOOGLE_DRIVE_API_KEY;
const ENABLE_WEBP_CONVERSION = process.env.ENABLE_WEBP_CONVERSION === 'true';
const IMAGE_BUCKET = 'product-images';
const ALLOWED_MIME_PREFIXES = ['image/'];
const ALLOWED_EXTENSIONS = /\.(jpe?g|png|webp|gif)$/i;

export interface DriveImageResult {
  filename: string;
  storagePath: string;
  publicUrl: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface DriveImportResult {
  productId: string;
  sku: string | null;
  totalFiles: number;
  imported: number;
  skipped: number;
  failed: { name: string; error: string }[];
  primarySet: boolean;
  images: DriveImageResult[];
  error?: string;
}

// ── URL parsing ──────────────────────────────────────────────────────────────

/**
 * Extracts the Google Drive folder ID from various URL formats:
 *  - https://drive.google.com/drive/folders/{folderId}
 *  - https://drive.google.com/drive/u/0/folders/{folderId}
 *  - https://drive.google.com/open?id={folderId}
 */
export function extractDriveFolderId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // /folders/{id} pattern
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) return folderMatch[1];

  // ?id={id} pattern
  try {
    const parsed = new URL(trimmed);
    const id = parsed.searchParams.get('id');
    if (id) return id;
  } catch {
    // not a valid URL
  }

  return null;
}

// ── Drive API ────────────────────────────────────────────────────────────────

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

async function listDriveFiles(folderId: string): Promise<{ files?: DriveFile[]; error?: string }> {
  if (!GOOGLE_DRIVE_API_KEY) {
    return { error: 'GOOGLE_DRIVE_API_KEY chưa được cấu hình.' };
  }

  const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const fields = encodeURIComponent('files(id,name,mimeType)');
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&key=${GOOGLE_DRIVE_API_KEY}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });

    if (res.status === 404) {
      return { error: 'Thư mục Google Drive không tồn tại hoặc chưa chia sẻ công khai.' };
    }
    if (res.status === 403) {
      return { error: 'Thư mục Google Drive chưa được chia sẻ công khai. Vui lòng chia sẻ thư mục với "Bất kỳ ai có đường liên kết".' };
    }
    if (!res.ok) {
      return { error: `Lỗi Google Drive API: ${res.status} ${res.statusText}` };
    }

    const json = (await res.json()) as { files?: DriveFile[] };
    return { files: json.files ?? [] };
  } catch (err) {
    return { error: `Không thể kết nối Google Drive API: ${err instanceof Error ? err.message : String(err)}` };
  }
}

function isImageFile(file: DriveFile): boolean {
  return (
    ALLOWED_MIME_PREFIXES.some((prefix) => file.mimeType.startsWith(prefix)) ||
    ALLOWED_EXTENSIONS.test(file.name)
  );
}

function getDriveDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

async function downloadDriveFile(fileId: string): Promise<{ buffer: Buffer; contentType: string } | { error: string }> {
  try {
    const res = await fetch(getDriveDownloadUrl(fileId), { redirect: 'follow' });
    if (!res.ok) {
      return { error: `Tải ảnh thất bại (HTTP ${res.status})` };
    }

    const contentType = res.headers.get('content-type') ?? 'application/octet-stream';
    if (!ALLOWED_MIME_PREFIXES.some((prefix) => contentType.startsWith(prefix))) {
      return { error: `Định dạng file không được hỗ trợ: ${contentType}` };
    }

    const arrayBuffer = await res.arrayBuffer();
    return { buffer: Buffer.from(arrayBuffer), contentType };
  } catch (err) {
    return { error: `Lỗi tải ảnh: ${err instanceof Error ? err.message : String(err)}` };
  }
}

function sanitizeFilename(name: string): string {
  // Remove special chars, replace spaces with underscores, lowercase
  return name.replace(/[^\w.\-]/g, '_').toLowerCase();
}

function matchesPrimaryName(filename: string, primaryImageName: string | null): boolean {
  if (!primaryImageName) return false;
  const filenameBase = filename.replace(/\.[^.]+$/, '').toLowerCase();
  const primaryBase = primaryImageName.replace(/\.[^.]+$/, '').toLowerCase();
  return filenameBase === primaryBase || filename.toLowerCase() === primaryImageName.toLowerCase();
}

// ── Main import function ─────────────────────────────────────────────────────

/**
 * Downloads all images from a public Google Drive folder and uploads them
 * to Supabase Storage under products/{sku ?? productId}/.
 *
 * Images are processed serially to avoid Drive API rate limits.
 */
export async function importImagesFromDriveFolder(
  productId: string,
  productSku: string | null,
  folderUrl: string,
  primaryImageName: string | null,
): Promise<DriveImportResult> {
  const result: DriveImportResult = {
    productId,
    sku: productSku,
    totalFiles: 0,
    imported: 0,
    skipped: 0,
    failed: [],
    primarySet: false,
    images: [],
  };

  // 1. Extract folder ID
  const folderId = extractDriveFolderId(folderUrl);
  if (!folderId) {
    return { ...result, error: 'URL Google Drive không hợp lệ. Vui lòng kiểm tra lại link thư mục.' };
  }

  // 2. List files from Drive
  const { files, error: listError } = await listDriveFiles(folderId);
  if (listError) {
    return { ...result, error: listError };
  }
  if (!files || files.length === 0) {
    return { ...result, error: 'Thư mục Google Drive trống hoặc không chứa ảnh nào.' };
  }

  const imageFiles = files.filter(isImageFile);
  result.totalFiles = files.length;
  result.skipped = files.length - imageFiles.length;

  if (imageFiles.length === 0) {
    return { ...result, error: 'Thư mục không chứa file ảnh hợp lệ (jpg, png, webp).' };
  }

  const supabase = createServiceRoleClient();
  const storagePrefix = `products/${productSku ?? productId}`;
  let sortOrder = 0;
  let primaryAssigned = false;

  // 3. Process each image serially
  for (const file of imageFiles) {
    const filename = sanitizeFilename(file.name);

    // Download
    const downloadResult = await downloadDriveFile(file.id);
    if ('error' in downloadResult) {
      result.failed.push({ name: file.name, error: downloadResult.error });
      continue;
    }

    let { buffer, contentType } = downloadResult;
    let outputFilename = filename;

    // Optional WebP conversion
    if (ENABLE_WEBP_CONVERSION && contentType !== 'image/webp') {
      try {
        const sharp = (await import('sharp')).default;
        buffer = await sharp(buffer).webp({ quality: 85 }).toBuffer();
        contentType = 'image/webp';
        outputFilename = filename.replace(/\.[^.]+$/, '.webp');
      } catch {
        // Skip conversion if sharp fails, upload original
      }
    }

    const storagePath = `${storagePrefix}/${outputFilename}`;

    // Upload to Supabase Storage (upsert to avoid duplicates on re-import)
    const { error: uploadError } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      result.failed.push({ name: file.name, error: `Upload thất bại: ${uploadError.message}` });
      continue;
    }

    const { data: urlData } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(storagePath);
    const publicUrl = urlData.publicUrl;

    const isPrimary =
      !primaryAssigned &&
      (matchesPrimaryName(outputFilename, primaryImageName) ||
        // If no primary name specified, first image becomes primary
        (!primaryImageName && sortOrder === 0));

    if (isPrimary) primaryAssigned = true;

    // Insert product_images record (upsert by storage_path)
    const { error: dbError } = await supabase
      .from('product_images')
      .upsert(
        {
          product_id: productId,
          storage_path: storagePath,
          public_url: publicUrl,
          alt: null,
          sort_order: sortOrder,
          is_primary: isPrimary,
          is_active: true,
        },
        { onConflict: 'storage_path' },
      );

    if (dbError) {
      result.failed.push({ name: file.name, error: `Lưu DB thất bại: ${dbError.message}` });
      continue;
    }

    result.images.push({
      filename: outputFilename,
      storagePath,
      publicUrl,
      isPrimary,
      sortOrder,
    });

    result.imported++;
    if (isPrimary) result.primarySet = true;
    sortOrder++;
  }

  // If a primaryImageName was given but nothing matched, promote first imported image
  if (!result.primarySet && result.images.length > 0) {
    const firstImage = result.images[0];
    await supabase
      .from('product_images')
      .update({ is_primary: true })
      .eq('storage_path', firstImage.storagePath);
    firstImage.isPrimary = true;
    result.primarySet = true;
  }

  return result;
}
