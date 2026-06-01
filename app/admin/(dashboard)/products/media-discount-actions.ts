'use server';

import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  createAdminProductImage,
  deleteAdminProductImage,
  reorderAdminProductImages,
  setAdminProductImageActive,
  setAdminProductPrimaryImage,
  updateAdminProductImage,
  PRODUCT_IMAGES_BUCKET,
} from '@/lib/services/admin/product-images';
import {
  createAdminProductBulkDiscount,
  deleteAdminProductBulkDiscount,
  setAdminProductBulkDiscountActive,
  updateAdminProductBulkDiscount,
} from '@/lib/services/admin/product-discounts';

export type ActionState = { ok: boolean; error?: string };

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function sanitizeFilename(filename: string): string {
  // Prevent directory traversal and sanitize special characters
  const base = filename.split(/[/\\]/).pop() || 'image';
  const clean = base.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
  return clean;
}

// -------------------------------------------------------------
// PRODUCT IMAGES ACTIONS
// -------------------------------------------------------------

export async function uploadProductImageAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const productId = formData.get('product_id') as string;
  const file = formData.get('file') as File;
  const alt = (formData.get('alt') as string) || '';
  const sortOrder = Number(formData.get('sort_order') || '0');
  const isPrimary = formData.get('is_primary') === 'true' || formData.get('is_primary') === 'on';

  if (!productId) {
    return { ok: false, error: 'Thiếu ID sản phẩm liên kết.' };
  }
  if (!file || file.size === 0) {
    return { ok: false, error: 'Vui lòng chọn hình ảnh để tải lên.' };
  }

  // Upload Validation
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { ok: false, error: 'Định dạng ảnh không hợp lệ. Chỉ chấp nhận JPG, PNG, hoặc WebP.' };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, error: 'Kích thước ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5 MB.' };
  }

  const supabase = createServiceRoleClient();
  const timestamp = Date.now();
  const cleanName = sanitizeFilename(file.name);
  const storagePath = `products/${productId}/${timestamp}-${cleanName}`;

  let uploadedPath = '';

  try {
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(storagePath, arrayBuffer, {
        contentType: file.type,
      });

    if (uploadError) {
      return { ok: false, error: `Tải ảnh lên Storage thất bại: ${uploadError.message}` };
    }

    uploadedPath = storagePath;

    const { data: { publicUrl } } = supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .getPublicUrl(storagePath);

    // Save to Database
    const { error: dbError } = await createAdminProductImage({
      product_id: productId,
      storage_path: storagePath,
      public_url: publicUrl,
      alt: alt.trim() || null,
      sort_order: sortOrder,
      is_primary: isPrimary,
      is_active: true,
    });

    if (dbError) {
      // Clean up uploaded file if DB insert fails
      await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([storagePath]);
      return { ok: false, error: dbError };
    }
  } catch (err) {
    if (uploadedPath) {
      await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([uploadedPath]);
    }
    return { ok: false, error: err instanceof Error ? err.message : 'Lỗi không xác định khi tải ảnh.' };
  }

  revalidateAllPaths();
  return { ok: true };
}

export async function updateProductImageAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const imageId = formData.get('id') as string;
  const alt = (formData.get('alt') as string) || '';
  const sortOrder = Number(formData.get('sort_order') || '0');
  const isActive = formData.get('is_active') === 'true' || formData.get('is_active') === 'on';

  if (!imageId) {
    return { ok: false, error: 'Thiếu ID hình ảnh.' };
  }

  const { error } = await updateAdminProductImage(imageId, {
    alt,
    sort_order: sortOrder,
    is_active: isActive,
  });

  if (error) {
    return { ok: false, error };
  }

  revalidateAllPaths();
  return { ok: true };
}

export async function deleteProductImageAction(imageId: string): Promise<ActionState> {
  if (!imageId) {
    return { ok: false, error: 'Thiếu ID hình ảnh.' };
  }

  const { error } = await deleteAdminProductImage(imageId);

  if (error) {
    return { ok: false, error };
  }

  revalidateAllPaths();
  return { ok: true };
}

export async function toggleProductImageActiveAction(imageId: string, isActive: boolean): Promise<ActionState> {
  if (!imageId) {
    return { ok: false, error: 'Thiếu ID hình ảnh.' };
  }

  const { error } = await setAdminProductImageActive(imageId, isActive);

  if (error) {
    return { ok: false, error };
  }

  revalidateAllPaths();
  return { ok: true };
}

export async function setProductPrimaryImageAction(productId: string, imageId: string): Promise<ActionState> {
  if (!productId || !imageId) {
    return { ok: false, error: 'Thiếu ID sản phẩm hoặc ID hình ảnh.' };
  }

  const { error } = await setAdminProductPrimaryImage(productId, imageId);

  if (error) {
    return { ok: false, error };
  }

  revalidateAllPaths();
  return { ok: true };
}

export async function reorderProductImagesAction(productId: string, orderedIds: string[]): Promise<ActionState> {
  if (!productId || !orderedIds || orderedIds.length === 0) {
    return { ok: false, error: 'Dữ liệu sắp xếp không hợp lệ.' };
  }

  const { error } = await reorderAdminProductImages(productId, orderedIds);

  if (error) {
    return { ok: false, error };
  }

  revalidateAllPaths();
  return { ok: true };
}

// -------------------------------------------------------------
// BULK DISCOUNTS ACTIONS
// -------------------------------------------------------------

export async function addProductDiscountAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const productId = formData.get('product_id') as string;
  const minQuantity = Number(formData.get('min_quantity') || '0');
  const pricePerUnit = Number((formData.get('price_per_unit') as string)?.replace(/,/g, '') || '0');
  const isActive = formData.get('is_active') === 'true' || formData.get('is_active') === 'on';

  if (!productId) {
    return { ok: false, error: 'Thiếu ID sản phẩm liên kết.' };
  }
  if (minQuantity <= 0) {
    return { ok: false, error: 'Số lượng tối thiểu phải lớn hơn 0.' };
  }
  if (pricePerUnit < 0) {
    return { ok: false, error: 'Giá sỉ phải lớn hơn hoặc bằng 0.' };
  }

  const { error } = await createAdminProductBulkDiscount({
    product_id: productId,
    min_quantity: minQuantity,
    price_per_unit: pricePerUnit,
    is_active: isActive,
  });

  if (error) {
    return { ok: false, error };
  }

  revalidateAllPaths();
  return { ok: true };
}

export async function updateProductDiscountAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const discountId = formData.get('id') as string;
  const minQuantity = Number(formData.get('min_quantity') || '0');
  const pricePerUnit = Number((formData.get('price_per_unit') as string)?.replace(/,/g, '') || '0');
  const isActive = formData.get('is_active') === 'true' || formData.get('is_active') === 'on';

  if (!discountId) {
    return { ok: false, error: 'Thiếu ID bậc giá sỉ.' };
  }
  if (minQuantity <= 0) {
    return { ok: false, error: 'Số lượng tối thiểu phải lớn hơn 0.' };
  }
  if (pricePerUnit < 0) {
    return { ok: false, error: 'Giá sỉ phải lớn hơn hoặc bằng 0.' };
  }

  const { error } = await updateAdminProductBulkDiscount(discountId, {
    min_quantity: minQuantity,
    price_per_unit: pricePerUnit,
    is_active: isActive,
  });

  if (error) {
    return { ok: false, error };
  }

  revalidateAllPaths();
  return { ok: true };
}

export async function deleteProductDiscountAction(discountId: string): Promise<ActionState> {
  if (!discountId) {
    return { ok: false, error: 'Thiếu ID bậc giá sỉ.' };
  }

  const { error } = await deleteAdminProductBulkDiscount(discountId);

  if (error) {
    return { ok: false, error };
  }

  revalidateAllPaths();
  return { ok: true };
}

export async function toggleProductDiscountActiveAction(discountId: string, isActive: boolean): Promise<ActionState> {
  if (!discountId) {
    return { ok: false, error: 'Thiếu ID bậc giá sỉ.' };
  }

  const { error } = await setAdminProductBulkDiscountActive(discountId, isActive);

  if (error) {
    return { ok: false, error };
  }

  revalidateAllPaths();
  return { ok: true };
}

// -------------------------------------------------------------
// CACHE REVALIDATION HELPER
// -------------------------------------------------------------

function revalidateAllPaths() {
  revalidatePath('/admin/products');
  revalidatePath('/admin/dashboard');
  revalidatePath('/danh-muc');
  revalidatePath('/');
}
