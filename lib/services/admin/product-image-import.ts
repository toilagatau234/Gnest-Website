import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';
import { sanitizeSkuForPath } from '@/lib/utils/image-folder';

/**
 * Local-folder image import (Phase 8/9).
 *
 * Images are uploaded one request per file from the browser after products are
 * upserted. Each file lands at the canonical, SKU-keyed path
 *
 *     products/{SKU}/NN.ext      (bucket: `products`, public)
 *
 * Re-imports are deduped by SHA-256 content hash per product, so unchanged
 * images are skipped instead of re-uploaded. Every outcome is recorded in
 * import_job_images for a full audit trail.
 */

export const PRODUCTS_BUCKET = 'products';

const MIME_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB — matches the bucket limit.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? (parts.pop() ?? '').toLowerCase() : '';
}

export interface UploadImportImageInput {
  jobId: string | null;
  productId: string;
  sku: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  bytes: ArrayBuffer;
  /** Zero-based position → storage name NN = sortOrder + 1, zero-padded. */
  sortOrder: number;
  isPrimary: boolean;
  /** Browser-computed SHA-256 (hex) of the file bytes, for dedup. */
  contentHash: string;
}

export type UploadImportImageStatus = 'uploaded' | 'skipped' | 'failed';

export interface UploadImportImageResult {
  status: UploadImportImageStatus;
  storagePath?: string;
  publicUrl?: string;
  error?: string;
}

/**
 * Validates, dedups, uploads and registers a single import image.
 * Caller MUST have verified admin auth before invoking this.
 */
export async function uploadImportImage(
  input: UploadImportImageInput,
): Promise<UploadImportImageResult> {
  const supabase = createServiceRoleClient();

  const recordImage = async (
    status: UploadImportImageStatus,
    storagePath: string | null,
    errorMessage: string | null,
  ) => {
    if (!input.jobId) return;
    await supabase.from('import_job_images').insert({
      job_id: input.jobId,
      sku: input.sku,
      filename: input.fileName,
      storage_path: storagePath,
      content_hash: input.contentHash || null,
      status,
      error_message: errorMessage,
    });
  };

  const fail = async (error: string): Promise<UploadImportImageResult> => {
    await recordImage('failed', null, error);
    return { status: 'failed', error };
  };

  // 1. Path-traversal guard: productId is a server-issued UUID.
  if (!UUID_RE.test(input.productId)) {
    return fail('ID sản phẩm không hợp lệ.');
  }
  if (!input.sku.trim()) {
    return fail('Thiếu SKU cho ảnh.');
  }

  // 2. Validate type by BOTH MIME and extension; trust neither alone.
  const canonicalExt = MIME_EXTENSION[input.fileType];
  const originalExt = fileExtension(input.fileName);
  if (!canonicalExt || !ALLOWED_EXTENSIONS.has(originalExt)) {
    return fail(`Định dạng ảnh không hợp lệ (${input.fileName}). Chỉ chấp nhận JPG, PNG, WebP.`);
  }
  if (input.fileSize <= 0) {
    return fail(`Ảnh rỗng: ${input.fileName}.`);
  }
  if (input.fileSize > MAX_FILE_SIZE_BYTES) {
    return fail(`Ảnh quá lớn (${input.fileName}). Tối đa 5 MB.`);
  }

  // 3. Verify the product exists (productId is authoritative for the SKU match).
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id')
    .eq('id', input.productId)
    .maybeSingle();
  if (productError) return fail('Không thể xác minh sản phẩm.');
  if (!product) return fail('Sản phẩm liên kết không tồn tại.');

  // 4. Dedup (Phase 9): skip if this exact content already exists for the product.
  if (input.contentHash) {
    const { data: existing } = await supabase
      .from('product_images')
      .select('id')
      .eq('product_id', input.productId)
      .eq('content_hash', input.contentHash)
      .limit(1);
    if (existing && existing.length > 0) {
      await recordImage('skipped', null, null);
      return { status: 'skipped' };
    }
  }

  // 5. Server-controlled canonical path: products/{SKU}/NN.ext
  const safeSku = sanitizeSkuForPath(input.sku);
  const nn = String(input.sortOrder + 1).padStart(2, '0');
  const storagePath = `products/${safeSku}/${nn}.${canonicalExt}`;

  // 6. Upload (upsert overwrites the same NN path on re-import of changed images).
  const { error: uploadError } = await supabase.storage
    .from(PRODUCTS_BUCKET)
    .upload(storagePath, input.bytes, { contentType: input.fileType, upsert: true });
  if (uploadError) {
    return fail(`Tải ảnh lên Storage thất bại (${input.fileName}): ${uploadError.message}`);
  }

  const { data: { publicUrl } } = supabase.storage.from(PRODUCTS_BUCKET).getPublicUrl(storagePath);

  // 7. Register/refresh the product_images row (unique on storage_path).
  const { error: dbError } = await supabase
    .from('product_images')
    .upsert(
      {
        product_id: input.productId,
        storage_path: storagePath,
        public_url: publicUrl,
        content_hash: input.contentHash || null,
        sort_order: input.sortOrder,
        is_primary: input.isPrimary,
        is_active: true,
      },
      { onConflict: 'storage_path' },
    );
  if (dbError) {
    return fail(`Lưu DB thất bại (${input.fileName}): ${dbError.message}`);
  }

  // 8. Enforce a single primary per product (Phase 9 thumbnail rule).
  if (input.isPrimary) {
    await supabase
      .from('product_images')
      .update({ is_primary: false })
      .eq('product_id', input.productId)
      .neq('storage_path', storagePath);
  }

  await recordImage('uploaded', storagePath, null);
  return { status: 'uploaded', storagePath, publicUrl };
}

/**
 * Bumps an import job's image counter and records image-level error count after
 * the client finishes streaming all images for the run.
 */
export async function finalizeImportJobImages(
  jobId: string,
  counts: { uploaded: number; skipped: number; failed: number },
): Promise<void> {
  const supabase = createServiceRoleClient();
  await supabase
    .from('import_jobs')
    .update({ image_count: counts.uploaded })
    .eq('id', jobId);
}
