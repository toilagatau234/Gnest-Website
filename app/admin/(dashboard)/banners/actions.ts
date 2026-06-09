'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';

import {
  createAdminBanner,
  deleteAdminBanner,
  setAdminBannerActive,
  updateAdminBanner,
  type BannerPayload,
} from '@/lib/services/admin/banners';
import { getRequestContext } from '@/lib/services/admin/audit-metadata';
import { requireAdminAuth } from '@/lib/services/admin/auth';
import { CONTENT_EDITOR_ROLES } from '@/lib/services/admin/permissions';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { ALLOWED_POSITIONS } from '@/lib/services/banners';

export type AdminFormState = { ok: boolean; error?: string };
export type BannerUploadState = { ok: boolean; url?: string; slot?: 'desktop' | 'mobile'; error?: string };

// ── Banner image upload ────────────────────────────────────────────────────

const BANNER_IMAGES_BUCKET = 'banner-images';

/** Canonical MIME type → file extension map.
 *  The stored extension is always derived from the trusted MIME value, never
 *  from the original filename supplied by the browser. */
const BANNER_MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const BANNER_ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp']);
const BANNER_MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const BANNER_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function bannerFileExt(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? (parts.pop() ?? '').toLowerCase() : '';
}

/** Extract the storage object path from a public URL that belongs to
 *  the banner-images bucket.  Returns null for any external URL. */
function extractBannerStoragePath(url: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  const prefix = `${base}/storage/v1/object/public/${BANNER_IMAGES_BUCKET}/`;
  return url.startsWith(prefix) ? url.slice(prefix.length) : null;
}

export async function uploadBannerImageAction(
  _prevState: BannerUploadState,
  formData: FormData,
): Promise<BannerUploadState> {
  // Auth guard — must be outside try/catch so redirect() propagates.
  await requireAdminAuth(CONTENT_EDITOR_ROLES);

  const bannerId = (formData.get('banner_id') as string | null)?.trim() ?? '';
  const slot = formData.get('slot') as string | null;
  const file = formData.get('file');

  if (!bannerId) return { ok: false, error: 'Thiếu ID banner.' };
  if (!BANNER_UUID_RE.test(bannerId)) return { ok: false, error: 'ID banner không hợp lệ.' };
  if (slot !== 'desktop' && slot !== 'mobile') return { ok: false, error: 'Slot ảnh không hợp lệ.' };
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Vui lòng chọn hình ảnh.' };

  // Dual validation: trust neither MIME alone nor file extension alone.
  const canonicalExt = BANNER_MIME_EXT[file.type];
  const originalExt = bannerFileExt(file.name);
  if (!canonicalExt || !BANNER_ALLOWED_EXT.has(originalExt)) {
    return { ok: false, error: 'Định dạng ảnh không hợp lệ. Chỉ chấp nhận JPG, PNG, hoặc WebP.' };
  }
  if (file.size > BANNER_MAX_SIZE) {
    return { ok: false, error: 'Kích thước ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5 MB.' };
  }

  const supabase = createServiceRoleClient();

  // Verify the banner exists before touching Storage so we never create orphaned files.
  const { data: banner, error: bannerFetchError } = await supabase
    .from('promotional_banners')
    .select('id, position, image_desktop_url, image_mobile_url')
    .eq('id', bannerId)
    .maybeSingle();

  if (bannerFetchError || !banner) return { ok: false, error: 'Không tìm thấy banner.' };
  if (banner.position === 'site_top') {
    return { ok: false, error: 'Banner đầu trang (site_top) không hỗ trợ ảnh.' };
  }

  const oldUrl: string | null = slot === 'desktop'
    ? (banner.image_desktop_url ?? null)
    : (banner.image_mobile_url ?? null);

  // Server-controlled path — UUID folder + timestamp + random UUID + canonical ext.
  // The original filename is never used to avoid path-traversal or spoofed extensions.
  const storagePath = `banners/${bannerId}/${Date.now()}-${randomUUID()}.${canonicalExt}`;
  let uploadedPath = '';

  try {
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(BANNER_IMAGES_BUCKET)
      .upload(storagePath, arrayBuffer, { contentType: file.type });

    if (uploadError) {
      return { ok: false, error: `Tải ảnh lên thất bại: ${uploadError.message}` };
    }

    uploadedPath = storagePath;

    const { data: { publicUrl } } = supabase.storage
      .from(BANNER_IMAGES_BUCKET)
      .getPublicUrl(storagePath);

    const updateField = slot === 'desktop'
      ? { image_desktop_url: publicUrl }
      : { image_mobile_url: publicUrl };

    const { error: dbError } = await supabase
      .from('promotional_banners')
      .update(updateField)
      .eq('id', bannerId);

    if (dbError) {
      // Rollback: remove the just-uploaded file so Storage stays clean.
      await supabase.storage.from(BANNER_IMAGES_BUCKET).remove([storagePath]).catch(() => {});
      return { ok: false, error: 'Không thể cập nhật banner sau khi tải ảnh lên. Vui lòng thử lại.' };
    }

    // Best-effort cleanup of the old image.
    // Only delete files we own (banner-images bucket). Skip external / manual URLs.
    if (oldUrl) {
      const oldPath = extractBannerStoragePath(oldUrl);
      if (oldPath) {
        await supabase.storage.from(BANNER_IMAGES_BUCKET).remove([oldPath]).catch(() => {
          // Non-fatal — log in production if needed, but don't fail the action.
        });
      }
    }

    revalidateBanners();
    return { ok: true, url: publicUrl, slot: slot as 'desktop' | 'mobile' };
  } catch (err) {
    if (uploadedPath) {
      await supabase.storage.from(BANNER_IMAGES_BUCKET).remove([uploadedPath]).catch(() => {});
    }
    return { ok: false, error: err instanceof Error ? err.message : 'Lỗi không xác định khi tải ảnh.' };
  }
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function readBoolean(formData: FormData, key: string) {
  return formData.get(key) === 'on' || formData.get(key) === 'true';
}

function readBannerPayload(formData: FormData): BannerPayload {
  const name = readString(formData, 'name');
  const content = readString(formData, 'content');
  const position = readString(formData, 'position') || 'site_top';
  const sortOrderRaw = formData.get('sort_order');

  if (!name) {
    throw new Error('Tên banner quảng cáo là bắt buộc.');
  }

  if (!content) {
    throw new Error('Nội dung hiển thị là bắt buộc.');
  }

  if (!ALLOWED_POSITIONS.includes(position as any)) {
    throw new Error('Vị trí hiển thị không hợp lệ.');
  }

  if (sortOrderRaw === null || sortOrderRaw === undefined || String(sortOrderRaw).trim() === '') {
    throw new Error('Thứ tự ưu tiên là bắt buộc.');
  }

  const sortOrder = Number(sortOrderRaw);
  if (!Number.isInteger(sortOrder)) {
    throw new Error('Thứ tự ưu tiên phải là một số nguyên.');
  }
  if (sortOrder < 0) {
    throw new Error('Thứ tự ưu tiên không được âm.');
  }

  const startAt = readString(formData, 'start_at') || null;
  const endAt = readString(formData, 'end_at') || null;

  if (startAt && endAt && new Date(startAt) >= new Date(endAt)) {
    throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu.');
  }

  const imageDesktopUrl = readString(formData, 'image_desktop_url') || null;
  const imageMobileUrl = readString(formData, 'image_mobile_url') || null;

  if (position !== 'site_top') {
    const validateUrl = (url: string | null, fieldName: string) => {
      if (!url) return;
      try {
        const u = new URL(url);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') {
          throw new Error(`Đường dẫn ${fieldName} phải bắt đầu bằng http:// hoặc https://`);
        }
        if (url.includes('drive.google.com')) {
          throw new Error(`Đường dẫn ${fieldName} từ Google Drive không phải là link ảnh trực tiếp. Vui lòng chuyển thành direct link hoặc sử dụng host khác.`);
        }
      } catch (e: unknown) {
        if (e instanceof Error && (e.message.includes('Google Drive') || e.message.includes('bắt đầu bằng'))) {
          throw e;
        }
        throw new Error(`Đường dẫn ${fieldName} không đúng định dạng URL.`);
      }
    };
    validateUrl(imageDesktopUrl, 'ảnh máy tính');
    validateUrl(imageMobileUrl, 'ảnh điện thoại');
  }

  return {
    name,
    content,
    link_url: readString(formData, 'link_url') || null,
    position,
    image_desktop_url: imageDesktopUrl,
    image_mobile_url: imageMobileUrl,
    start_at: startAt,
    end_at: endAt,
    sort_order: sortOrder,
    is_active: readBoolean(formData, 'is_active'),
  };
}

function revalidateBanners() {
  revalidatePath('/admin/banners');
  revalidatePath('/admin/dashboard');
  revalidatePath('/');
  revalidatePath('/danh-muc');
  revalidatePath('/danh-muc/[slug]', 'page');
  revalidatePath('/tuyen-dung');
}

export async function createBannerAction(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdminAuth(CONTENT_EDITOR_ROLES);
  try {
    const payload = readBannerPayload(formData);
    const requestContext = await getRequestContext();
    const { error } = await createAdminBanner(payload, requestContext);

    if (error) {
      return { ok: false, error };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Không thể tạo banner.' };
  }

  revalidateBanners();
  return { ok: true };
}

export async function updateBannerAction(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdminAuth(CONTENT_EDITOR_ROLES);
  try {
    const bannerId = readString(formData, 'id');

    if (!bannerId) {
      return { ok: false, error: 'Thiếu ID banner quảng cáo.' };
    }

    const payload = readBannerPayload(formData);
    const requestContext = await getRequestContext();
    const { error } = await updateAdminBanner(bannerId, payload, requestContext);

    if (error) {
      return { ok: false, error };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Không thể cập nhật banner.' };
  }

  revalidateBanners();
  return { ok: true };
}

export async function deleteBannerAction(bannerId: string): Promise<AdminFormState> {
  await requireAdminAuth(CONTENT_EDITOR_ROLES);

  if (!bannerId) {
    return { ok: false, error: 'Thiếu ID banner quảng cáo.' };
  }

  try {
    const requestContext = await getRequestContext();
    const { error } = await deleteAdminBanner(bannerId, requestContext);

    if (error) {
      return { ok: false, error };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Không thể xóa banner.' };
  }

  revalidateBanners();
  return { ok: true };
}

export async function toggleBannerActiveAction(formData: FormData) {
  await requireAdminAuth(CONTENT_EDITOR_ROLES);

  const bannerId = readString(formData, 'id');
  const isActive = readString(formData, 'next_is_active') === 'true';

  if (!bannerId) {
    throw new Error('Thiếu ID banner quảng cáo.');
  }

  const requestContext = await getRequestContext();
  const { error } = await setAdminBannerActive(bannerId, isActive, requestContext);

  if (error) {
    throw new Error(error);
  }

  revalidateBanners();
}
