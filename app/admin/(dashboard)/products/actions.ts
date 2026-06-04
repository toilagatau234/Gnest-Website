'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';

import { createServiceRoleClient } from '@/lib/supabase/server';
import { createAdminProductImage, PRODUCT_IMAGES_BUCKET } from '@/lib/services/admin/product-images';
import {
  createAdminProduct,
  deleteAdminProduct,
  getAdminProductDetail,
  setAdminProductActive,
  updateAdminProduct,
  type AdminProduct,
  type ProductPayload,
} from '@/lib/services/admin/products';
import { getRequestContext } from '@/lib/services/admin/audit-metadata';
import type { Json } from '@/lib/types/database';

export type AdminFormState = { ok: boolean; error?: string; productId?: string };

const PRODUCT_IMAGE_MIME_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const PRODUCT_IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);
const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_PRODUCT_IMAGES_ON_CREATE = 10;

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

function fileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? (parts.pop() ?? '').toLowerCase() : '';
}

function readCreateImages(formData: FormData): File[] {
  return formData
    .getAll('product_images')
    .filter((file): file is File => file instanceof File && file.size > 0);
}

function validateProductImages(files: File[]) {
  if (files.length > MAX_PRODUCT_IMAGES_ON_CREATE) {
    throw new Error(`Tối đa ${MAX_PRODUCT_IMAGES_ON_CREATE} ảnh cho mỗi lần tạo sản phẩm.`);
  }

  for (const file of files) {
    const ext = fileExtension(file.name);
    if (!PRODUCT_IMAGE_MIME_EXTENSION[file.type] || !PRODUCT_IMAGE_EXTENSIONS.has(ext)) {
      throw new Error('Định dạng ảnh không hợp lệ. Chỉ chấp nhận JPG, JPEG, PNG hoặc WebP.');
    }
    if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
      throw new Error('Kích thước ảnh quá lớn. Mỗi ảnh tối đa 5 MB.');
    }
  }
}

async function attachProductImages(productId: string, productName: string, formData: FormData) {
  const files = readCreateImages(formData);
  if (files.length === 0) {
    return;
  }

  validateProductImages(files);

  const requestedPrimaryIndex = Number(formData.get('primary_image_index') ?? 0);
  const primaryIndex =
    Number.isInteger(requestedPrimaryIndex) && requestedPrimaryIndex >= 0 && requestedPrimaryIndex < files.length
      ? requestedPrimaryIndex
      : 0;
  const supabase = createServiceRoleClient();
  const uploadedPaths: string[] = [];

  try {
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const ext = PRODUCT_IMAGE_MIME_EXTENSION[file.type];
      const storagePath = `products/${productId}/${Date.now()}-${index}-${randomUUID()}.${ext}`;
      const arrayBuffer = await file.arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .upload(storagePath, arrayBuffer, { contentType: file.type });

      if (uploadError) {
        throw new Error(`Tải ảnh "${file.name}" thất bại: ${uploadError.message}`);
      }

      uploadedPaths.push(storagePath);
      const { data: { publicUrl } } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(storagePath);
      const { error } = await createAdminProductImage({
        product_id: productId,
        storage_path: storagePath,
        public_url: publicUrl,
        alt: productName,
        sort_order: index,
        is_primary: index === primaryIndex,
        is_active: true,
      });

      if (error) {
        throw new Error(error);
      }
    }
  } catch (err) {
    if (uploadedPaths.length > 0) {
      await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove(uploadedPaths);
    }
    throw err;
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

export async function createProductAction(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  try {
    const images = readCreateImages(formData);
    validateProductImages(images);
    const payload = readProductPayload(formData);
    const requestContext = await getRequestContext();
    const { data, error } = await createAdminProduct(payload, requestContext);

    if (error) {
      return { ok: false, error };
    }

    if (!data?.id) {
      return { ok: false, error: 'Không thể xác định sản phẩm vừa tạo.' };
    }

    try {
      await attachProductImages(data.id, payload.name, formData);
    } catch (err) {
      await createServiceRoleClient().from('products').delete().eq('id', data.id);
      throw err;
    }

    revalidatePath('/admin/products');
    revalidatePath('/admin/dashboard');
    revalidatePath('/danh-muc');
    return { ok: true, productId: data.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Không thể tạo sản phẩm.' };
  }

}

export async function updateProductAction(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  try {
    const productId = readString(formData, 'id');

    if (!productId) {
      return { ok: false, error: 'Thiếu ID sản phẩm.' };
    }

    const payload = readProductPayload(formData);
    const requestContext = await getRequestContext();
    const { error } = await updateAdminProduct(productId, payload, requestContext);

    if (error) {
      return { ok: false, error };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Không thể cập nhật sản phẩm.' };
  }

  revalidatePath('/admin/products');
  revalidatePath('/admin/dashboard');
  revalidatePath('/danh-muc');
  return { ok: true };
}

export async function deleteProductAction(productId: string): Promise<AdminFormState> {
  if (!productId) {
    return { ok: false, error: 'Thiếu ID sản phẩm.' };
  }

  try {
    const requestContext = await getRequestContext();
    const { error } = await deleteAdminProduct(productId, requestContext);

    if (error) {
      return { ok: false, error };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Không thể xóa sản phẩm.' };
  }

  revalidatePath('/admin/products');
  revalidatePath('/admin/dashboard');
  revalidatePath('/danh-muc');
  return { ok: true };
}

export async function fetchProductDetailAction(productId: string): Promise<{ data: AdminProduct | null; error: string | null }> {
  return getAdminProductDetail(productId);
}

export async function toggleProductActiveAction(formData: FormData) {
  const productId = readString(formData, 'id');
  const isActive = readString(formData, 'next_is_active') === 'true';

  if (!productId) {
    throw new Error('Thiếu ID sản phẩm.');
  }

  const requestContext = await getRequestContext();
  const { error } = await setAdminProductActive(productId, isActive, requestContext);

  if (error) {
    throw new Error(error);
  }

  revalidatePath('/admin/products');
  revalidatePath('/admin/dashboard');
  revalidatePath('/danh-muc');
}
