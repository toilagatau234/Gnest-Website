'use server';

import { revalidatePath } from 'next/cache';

import {
  createAdminProduct,
  setAdminProductActive,
  updateAdminProduct,
  type ProductPayload,
} from '@/lib/services/admin/products';
import type { Json } from '@/lib/types/database';

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function readBoolean(formData: FormData, key: string) {
  return formData.get(key) === 'on' || formData.get(key) === 'true';
}

function parseNumber(value: string) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/,/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseSpecs(value: string): Json {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as Json;

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Specs phải là object JSON.');
    }

    return parsed;
  } catch {
    throw new Error('Specs không đúng định dạng JSON. Ví dụ: {"dungTich":"500ml"}');
  }
}

function readProductPayload(formData: FormData): ProductPayload {
  const name = readString(formData, 'name');
  const slug = readString(formData, 'slug');
  const categoryId = readString(formData, 'category_id');
  const price = parseNumber(readString(formData, 'price'));
  const stock = Number(readString(formData, 'stock') || 0);

  if (!name) {
    throw new Error('Tên sản phẩm là bắt buộc.');
  }

  if (!slug) {
    throw new Error('Slug sản phẩm là bắt buộc.');
  }

  if (!Number.isFinite(stock) || stock < 0) {
    throw new Error('Tồn kho phải là số không âm.');
  }

  return {
    category_id: categoryId || null,
    name,
    slug,
    description: readString(formData, 'description') || null,
    price,
    stock,
    specs: parseSpecs(readString(formData, 'specs')),
    is_active: readBoolean(formData, 'is_active'),
  };
}

export async function createProductAction(formData: FormData) {
  const payload = readProductPayload(formData);
  const { error } = await createAdminProduct(payload);

  if (error) {
    throw new Error(error);
  }

  revalidatePath('/admin/products');
  revalidatePath('/danh-muc');
}

export async function updateProductAction(formData: FormData) {
  const productId = readString(formData, 'id');

  if (!productId) {
    throw new Error('Thiếu ID sản phẩm.');
  }

  const payload = readProductPayload(formData);
  const { error } = await updateAdminProduct(productId, payload);

  if (error) {
    throw new Error(error);
  }

  revalidatePath('/admin/products');
  revalidatePath('/danh-muc');
}

export async function toggleProductActiveAction(formData: FormData) {
  const productId = readString(formData, 'id');
  const isActive = readString(formData, 'next_is_active') === 'true';

  if (!productId) {
    throw new Error('Thiếu ID sản phẩm.');
  }

  const { error } = await setAdminProductActive(productId, isActive);

  if (error) {
    throw new Error(error);
  }

  revalidatePath('/admin/products');
  revalidatePath('/danh-muc');
}
