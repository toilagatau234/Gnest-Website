'use server';

import { revalidatePath } from 'next/cache';

import {
  createAdminBanner,
  deleteAdminBanner,
  setAdminBannerActive,
  updateAdminBanner,
  type BannerPayload,
} from '@/lib/services/admin/banners';
import { getRequestContext } from '@/lib/services/admin/audit-metadata';
import { ALLOWED_POSITIONS } from '@/lib/services/banners';

export type AdminFormState = { ok: boolean; error?: string };

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
}

export async function createBannerAction(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
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
