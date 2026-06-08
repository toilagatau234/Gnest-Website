'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdminAuth } from '@/lib/services/admin/auth';
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

const PRODUCT_IMAGE_ROLES = ['super_admin', 'admin', 'editor'] as const;

// Canonical MIME → extension map. The stored file extension is derived from the
// validated MIME type (a trusted value), never from the original filename.
const MIME_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? (parts.pop() ?? '').toLowerCase() : '';
}

function parseDiscountPrice(value: string | null): number {
  if (!value) return 0;
  const clean = value.replace(/\D/g, '');
  return Number(clean || '0');
}

// -------------------------------------------------------------
// PRODUCT IMAGES ACTIONS
// -------------------------------------------------------------

export async function uploadProductImageAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  // 1. Verify admin permission BEFORE creating the service role client, reading
  //    the file, or touching Storage. requireAdminAuth redirects on failure, so
  //    it must stay outside the try/catch (catching would swallow the redirect).
  await requireAdminAuth(PRODUCT_IMAGE_ROLES);

  const productId = (formData.get('product_id') as string | null)?.trim() ?? '';
  const file = formData.get('file');
  const alt = (formData.get('alt') as string) || '';
  const sortOrder = Number(formData.get('sort_order') || '0');
  const isPrimary = formData.get('is_primary') === 'true' || formData.get('is_primary') === 'on';

  // 2. Validate product_id as a UUID before it can reach a storage path. This
  //    blocks path traversal and any user-controlled segment in the path.
  if (!productId) {
    return { ok: false, error: 'Thiếu ID sản phẩm liên kết.' };
  }
  if (!UUID_RE.test(productId)) {
    return { ok: false, error: 'ID sản phẩm không hợp lệ.' };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Vui lòng chọn hình ảnh để tải lên.' };
  }

  // 3. Validate file type by BOTH MIME and extension; do not trust either alone.
  const canonicalExt = MIME_EXTENSION[file.type];
  const originalExt = fileExtension(file.name);
  if (!canonicalExt || !ALLOWED_EXTENSIONS.has(originalExt)) {
    return { ok: false, error: 'Định dạng ảnh không hợp lệ. Chỉ chấp nhận JPG, PNG, hoặc WebP.' };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, error: 'Kích thước ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5 MB.' };
  }

  const supabase = createServiceRoleClient();

  // 4. Verify the product exists before uploading anything to Storage so we
  //    never leave orphaned files for non-existent products.
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id')
    .eq('id', productId)
    .maybeSingle();

  if (productError) {
    return { ok: false, error: 'Không thể xác minh sản phẩm. Vui lòng thử lại.' };
  }
  if (!product) {
    return { ok: false, error: 'Sản phẩm liên kết không tồn tại.' };
  }

  // 5. Build a fully server-controlled storage path: validated UUID folder +
  //    random filename + canonical extension from the MIME type. The original
  //    filename is never used.
  const storagePath = `products/${productId}/${Date.now()}-${randomUUID()}.${canonicalExt}`;

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
  const pricePerUnit = parseDiscountPrice(formData.get('price_per_unit') as string | null);
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
  const pricePerUnit = parseDiscountPrice(formData.get('price_per_unit') as string | null);
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
