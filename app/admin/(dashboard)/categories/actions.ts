'use server';

import { revalidatePath } from 'next/cache';

import {
  createAdminCategory,
  deleteAdminCategory,
  setAdminCategoryActive,
  updateAdminCategory,
  type CategoryPayload,
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

function readSortOrder(formData: FormData) {
  const rawValue = readString(formData, 'sort_order');

  if (!rawValue) {
    return 0;
  }

  const value = Number(rawValue);

  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0 || !Number.isSafeInteger(value)) {
    throw new Error('Độ ưu tiên hiển thị phải là số nguyên không âm.');
  }

  return value;
}

function readCategoryPayload(formData: FormData): CategoryPayload {
  const name = readString(formData, 'name');
  const slug = readString(formData, 'slug');
  const rawType = readString(formData, 'type');
  const type: CategoryType = rawType === 'service' ? 'service' : 'product';
  const parentId = readString(formData, 'parent_id');
  const sortOrder = readSortOrder(formData);

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
    parent_id: parentId || null,
    sort_order: sortOrder,
    has_filters: readBoolean(formData, 'has_filters'),
    is_active: readBoolean(formData, 'is_active'),
  };
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

  revalidatePath('/admin/categories');
  revalidatePath('/admin/services');
  revalidatePath('/admin/dashboard');
  revalidatePath('/danh-muc');
  revalidatePath('/');
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

  revalidatePath('/admin/categories');
  revalidatePath('/admin/services');
  revalidatePath('/admin/dashboard');
  revalidatePath('/danh-muc');
  revalidatePath('/');
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

  revalidatePath('/admin/categories');
  revalidatePath('/admin/services');
  revalidatePath('/admin/dashboard');
  revalidatePath('/danh-muc');
  revalidatePath('/');
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

  revalidatePath('/admin/categories');
  revalidatePath('/admin/services');
  revalidatePath('/admin/dashboard');
  revalidatePath('/danh-muc');
  revalidatePath('/');
}
