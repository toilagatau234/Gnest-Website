'use server';

import { revalidatePath } from 'next/cache';

import {
  createAdminCategory,
  deleteAdminCategory,
  moveAdminCategory,
  setAdminCategoryActive,
  updateAdminCategory,
  type CategoryPayload,
  type CategoryReorderScope,
} from '@/lib/services/admin/categories';
import { getRequestContext } from '@/lib/services/admin/audit-metadata';
import { requireAdminAuth } from '@/lib/services/admin/auth';
import { CONTENT_EDITOR_ROLES } from '@/lib/services/admin/permissions';
import type { CategoryType } from '@/lib/types/database';
import { createServiceRoleClient } from '@/lib/supabase/server';

const CATEGORY_IMAGES_BUCKET = 'category-images';

export type CategoryImageUploadState = { ok: boolean; url?: string; error?: string };

export type AdminFormState = { ok: boolean; error?: string };

export async function uploadCategoryImageAction(
  _prevState: CategoryImageUploadState,
  formData: FormData,
): Promise<CategoryImageUploadState> {
  await requireAdminAuth(CONTENT_EDITOR_ROLES);

  const categoryId = (formData.get('category_id') as string | null)?.trim() ?? '';
  const file = formData.get('file');

  if (!categoryId) return { ok: false, error: 'Thiếu ID dịch vụ.' };
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Vui lòng chọn hình ảnh.' };

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) return { ok: false, error: 'Chỉ chấp nhận ảnh JPG, PNG, WebP.' };
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: 'Ảnh không được vượt quá 5MB.' };

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `services/${categoryId}.${ext}`;
  const supabase = createServiceRoleClient();

  const { error: uploadError } = await supabase.storage
    .from(CATEGORY_IMAGES_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { ok: false, error: uploadError.message };

  const { data: urlData } = supabase.storage.from(CATEGORY_IMAGES_BUCKET).getPublicUrl(path);
  const publicUrl = urlData.publicUrl;

  const { error: updateError } = await supabase
    .from('categories')
    .update({ image_url: publicUrl })
    .eq('id', categoryId);

  if (updateError) return { ok: false, error: updateError.message };

  revalidateCategories();
  return { ok: true, url: publicUrl };
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function readBoolean(formData: FormData, key: string) {
  return formData.get(key) === 'on' || formData.get(key) === 'true';
}

function readCategoryPayload(formData: FormData): CategoryPayload {
  const name = readString(formData, 'name');
  const slug = readString(formData, 'slug');
  const rawType = readString(formData, 'type');
  const type: CategoryType = rawType === 'service' ? 'service' : 'product';
  const parentId = readString(formData, 'parent_id');

  if (!name) {
    throw new Error('Tên danh mục là bắt buộc.');
  }

  if (!slug) {
    throw new Error('Slug danh mục là bắt buộc.');
  }

  return {
    name,
    slug,
    type,
    parent_id: type === 'service' ? null : (parentId || null),
    has_filters: type === 'service' ? false : readBoolean(formData, 'has_filters'),
    is_active: readBoolean(formData, 'is_active'),
    image_url: type === 'service' ? (readString(formData, 'image_url') || null) : null,
  };
}

function revalidateCategories() {
  revalidatePath('/admin/categories');
  revalidatePath('/admin/services');
  revalidatePath('/admin/dashboard');
  revalidatePath('/danh-muc');
  revalidatePath('/');
}

export async function createCategoryAction(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdminAuth(CONTENT_EDITOR_ROLES);
  try {
    const payload = readCategoryPayload(formData);
    const requestContext = await getRequestContext();
    const { error } = await createAdminCategory(payload, requestContext);

    if (error) {
      return { ok: false, error };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Không thể tạo danh mục.' };
  }

  revalidateCategories();
  return { ok: true };
}

export async function updateCategoryAction(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdminAuth(CONTENT_EDITOR_ROLES);
  try {
    const categoryId = readString(formData, 'id');

    if (!categoryId) {
      return { ok: false, error: 'Thiếu ID danh mục.' };
    }

    const payload = readCategoryPayload(formData);
    const requestContext = await getRequestContext();
    const { error } = await updateAdminCategory(categoryId, payload, requestContext);

    if (error) {
      return { ok: false, error };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Không thể cập nhật danh mục.' };
  }

  revalidateCategories();
  return { ok: true };
}

export async function deleteCategoryAction(categoryId: string): Promise<AdminFormState> {
  await requireAdminAuth(CONTENT_EDITOR_ROLES);

  if (!categoryId) {
    return { ok: false, error: 'Thiếu ID danh mục.' };
  }

  try {
    const requestContext = await getRequestContext();
    const { error } = await deleteAdminCategory(categoryId, requestContext);

    if (error) {
      return { ok: false, error };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Không thể xóa danh mục.' };
  }

  revalidateCategories();
  return { ok: true };
}

export async function toggleCategoryActiveAction(formData: FormData) {
  await requireAdminAuth(CONTENT_EDITOR_ROLES);

  const categoryId = readString(formData, 'id');
  const isActive = readString(formData, 'next_is_active') === 'true';

  if (!categoryId) {
    throw new Error('Thiếu ID danh mục.');
  }

  const requestContext = await getRequestContext();
  const { error } = await setAdminCategoryActive(categoryId, isActive, requestContext);

  if (error) {
    throw new Error(error);
  }

  revalidateCategories();
}

export async function moveCategoryAction(input: {
  itemId: string;
  scope: CategoryReorderScope;
  beforeId: string | null;
  afterId: string | null;
}): Promise<AdminFormState> {
  await requireAdminAuth(CONTENT_EDITOR_ROLES);

  if (!input.itemId || !input.scope) {
    return { ok: false, error: 'Dữ liệu di chuyển không hợp lệ.' };
  }

  try {
    const requestContext = await getRequestContext();
    const { error } = await moveAdminCategory(
      input.itemId,
      input.scope,
      input.beforeId,
      input.afterId,
      requestContext
    );

    if (error) {
      return { ok: false, error };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Không thể cập nhật thứ tự hiển thị.' };
  }

  revalidateCategories();
  return { ok: true };
}
