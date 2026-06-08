'use server';

import { revalidatePath } from 'next/cache';

import {
  createAdminCategory,
  deleteAdminCategory,
  reorderAdminCategories,
  setAdminCategoryActive,
  updateAdminCategory,
  type CategoryPayload,
  type CategoryReorderScope,
} from '@/lib/services/admin/categories';
import { getRequestContext } from '@/lib/services/admin/audit-metadata';
import type { CategoryType } from '@/lib/types/database';

export type AdminFormState = { ok: boolean; error?: string };

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

export async function reorderCategoriesAction(input: {
  scope: CategoryReorderScope;
  orderedIds: string[];
}): Promise<AdminFormState> {
  if (!input.scope || !Array.isArray(input.orderedIds) || input.orderedIds.length === 0) {
    return { ok: false, error: 'Dữ liệu sắp xếp không hợp lệ.' };
  }

  try {
    const requestContext = await getRequestContext();
    const { error } = await reorderAdminCategories(input.scope, input.orderedIds, requestContext);

    if (error) {
      return { ok: false, error };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Không thể cập nhật thứ tự hiển thị.' };
  }

  revalidateCategories();
  return { ok: true };
}
