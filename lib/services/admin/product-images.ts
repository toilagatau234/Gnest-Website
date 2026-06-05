import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Inserts, Updates } from '@/lib/types/database';
import { requireAdminAuth } from '@/lib/services/admin/auth';
import { cleanupProductImageStorage } from '@/lib/services/admin/media-cleanup';

const PRODUCT_MUTATION_ROLES = ['super_admin', 'admin', 'editor'] as const;
export const PRODUCT_IMAGES_BUCKET = 'product-images';

export interface ProductImagePayload {
  product_id: string;
  storage_path: string;
  public_url: string;
  alt: string | null;
  sort_order: number;
  is_primary: boolean;
  is_active: boolean;
}

function isInternalProductImagePath(storagePath: string) {
  return storagePath.startsWith('products/') && !storagePath.startsWith('http://') && !storagePath.startsWith('https://');
}

export async function cleanupUnusedProductImageStoragePaths(
  storagePaths: string[],
): Promise<{ deleted: string[]; skipped: string[]; failed: { path: string; error: string }[] }> {
  const supabase = createServiceRoleClient();
  const uniquePaths = [...new Set(storagePaths.filter(Boolean))];
  const deleted: string[] = [];
  const skipped: string[] = [];
  const failed: { path: string; error: string }[] = [];

  for (const path of uniquePaths) {
    if (!isInternalProductImagePath(path)) {
      skipped.push(path);
      continue;
    }

    const { count, error: countError } = await supabase
      .from('product_images')
      .select('id', { count: 'exact', head: true })
      .eq('storage_path', path);

    if (countError) {
      failed.push({ path, error: countError.message });
      continue;
    }

    if ((count ?? 0) > 0) {
      skipped.push(path);
      continue;
    }

    const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([path]);
    if (error) {
      failed.push({ path, error: error.message });
    } else {
      deleted.push(path);
    }
  }

  return { deleted, skipped, failed };
}

export async function createAdminProductImage(payload: ProductImagePayload) {
  try {
    const adminUser = await requireAdminAuth(PRODUCT_MUTATION_ROLES);
    const supabase = createServiceRoleClient();

    // Validate product existence first
    const { data: product, error: pError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', payload.product_id)
      .maybeSingle();

    if (pError || !product) {
      return { data: null, error: 'Sản phẩm liên kết không tồn tại.' };
    }

    if (payload.sort_order < 0) {
      return { data: null, error: 'Thứ tự sắp xếp phải lớn hơn hoặc bằng 0.' };
    }

    // Ensure only one primary image per product
    if (payload.is_primary) {
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', payload.product_id);
    }

    const insertPayload: Inserts<'product_images'> = {
      product_id: payload.product_id,
      storage_path: payload.storage_path,
      public_url: payload.public_url,
      alt: payload.alt?.trim() || null,
      sort_order: payload.sort_order,
      is_primary: payload.is_primary,
      is_active: payload.is_active,
    };

    const { data, error } = await supabase
      .from('product_images')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    // Write audit log
    await supabase.from('audit_logs').insert({
      actor_id: adminUser.id,
      action: 'create',
      entity: 'product_images',
      entity_id: data.id,
      metadata: { 
        product_id: data.product_id, 
        product_name: product.name, 
        storage_path: data.storage_path, 
        is_primary: data.is_primary 
      },
    });

    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể tạo hình ảnh sản phẩm';
    return { data: null, error: message };
  }
}

export async function updateAdminProductImage(
  imageId: string,
  payload: { alt: string | null; sort_order: number; is_active: boolean }
) {
  try {
    const adminUser = await requireAdminAuth(PRODUCT_MUTATION_ROLES);
    const supabase = createServiceRoleClient();

    if (payload.sort_order < 0) {
      return { data: null, error: 'Thứ tự sắp xếp phải lớn hơn hoặc bằng 0.' };
    }

    const { data: currentImage, error: fetchError } = await supabase
      .from('product_images')
      .select('*')
      .eq('id', imageId)
      .maybeSingle();

    if (fetchError || !currentImage) {
      return { data: null, error: 'Không tìm thấy hình ảnh cần cập nhật.' };
    }

    const updatePayload: Updates<'product_images'> = {
      alt: payload.alt?.trim() || null,
      sort_order: payload.sort_order,
      is_active: payload.is_active,
    };

    const { data, error } = await supabase
      .from('product_images')
      .update(updatePayload)
      .eq('id', imageId)
      .select('*')
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    // Write audit log
    await supabase.from('audit_logs').insert({
      actor_id: adminUser.id,
      action: 'update',
      entity: 'product_images',
      entity_id: data.id,
      metadata: { 
        product_id: data.product_id, 
        alt: data.alt, 
        sort_order: data.sort_order, 
        is_active: data.is_active 
      },
    });

    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể cập nhật hình ảnh';
    return { data: null, error: message };
  }
}

export async function deleteAdminProductImage(imageId: string) {
  try {
    const adminUser = await requireAdminAuth(PRODUCT_MUTATION_ROLES);
    const supabase = createServiceRoleClient();

    const { data: image, error: fetchError } = await supabase
      .from('product_images')
      .select('*')
      .eq('id', imageId)
      .maybeSingle();

    if (fetchError || !image) {
      return { data: null, error: 'Không tìm thấy hình ảnh cần xóa.' };
    }

    const { error: deleteDbError } = await supabase
      .from('product_images')
      .delete()
      .eq('id', imageId);

    if (deleteDbError) {
      return { data: null, error: deleteDbError.message };
    }

    // If deleted image was primary, promote another active image
    if (image.is_primary) {
      const { data: otherImages } = await supabase
        .from('product_images')
        .select('id')
        .eq('product_id', image.product_id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(1);

      if (otherImages && otherImages.length > 0) {
        await supabase
          .from('product_images')
          .update({ is_primary: true })
          .eq('id', otherImages[0].id);
      }
    }

    // Storage cleanup — failure does not fail the action
    const [cleanupResult] = await cleanupProductImageStorage([image.storage_path]);

    await supabase.from('audit_logs').insert({
      actor_id: adminUser.id,
      action: 'delete',
      entity: 'product_images',
      entity_id: imageId,
      metadata: {
        product_id: image.product_id,
        image_id: imageId,
        storage_path: image.storage_path,
        cleanup_status: cleanupResult?.deleted ? 'deleted' : cleanupResult?.skipped ? 'skipped' : 'failed',
        cleanup_error: cleanupResult?.error ?? null,
      },
    });

    return { data: image, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể xóa hình ảnh';
    return { data: null, error: message };
  }
}

export async function setAdminProductImageActive(imageId: string, isActive: boolean) {
  try {
    const adminUser = await requireAdminAuth(PRODUCT_MUTATION_ROLES);
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('product_images')
      .update({ is_active: isActive })
      .eq('id', imageId)
      .select('*')
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    // Write audit log
    await supabase.from('audit_logs').insert({
      actor_id: adminUser.id,
      action: isActive ? 'activate' : 'deactivate',
      entity: 'product_images',
      entity_id: imageId,
      metadata: { product_id: data.product_id, storage_path: data.storage_path },
    });

    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể thay đổi trạng thái hình ảnh';
    return { data: null, error: message };
  }
}

export async function setAdminProductPrimaryImage(productId: string, imageId: string) {
  try {
    const adminUser = await requireAdminAuth(PRODUCT_MUTATION_ROLES);
    const supabase = createServiceRoleClient();

    // 1. Verify image belongs to product
    const { data: image, error: imgError } = await supabase
      .from('product_images')
      .select('id, product_id')
      .eq('id', imageId)
      .eq('product_id', productId)
      .maybeSingle();

    if (imgError || !image) {
      return { data: null, error: 'Hình ảnh không thuộc sản phẩm này.' };
    }

    // 2. Set all other images to non-primary
    await supabase
      .from('product_images')
      .update({ is_primary: false })
      .eq('product_id', productId);

    // 3. Set target image as primary
    const { data, error } = await supabase
      .from('product_images')
      .update({ is_primary: true, is_active: true }) // primary images must be active
      .eq('id', imageId)
      .select('*')
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    // Write audit log
    await supabase.from('audit_logs').insert({
      actor_id: adminUser.id,
      action: 'set_primary',
      entity: 'product_images',
      entity_id: imageId,
      metadata: { product_id: productId, storage_path: data.storage_path },
    });

    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể đặt ảnh chính';
    return { data: null, error: message };
  }
}

export async function reorderAdminProductImages(productId: string, orderedIds: string[]) {
  try {
    const adminUser = await requireAdminAuth(PRODUCT_MUTATION_ROLES);
    const supabase = createServiceRoleClient();

    // Bulk update sort order
    for (let index = 0; index < orderedIds.length; index++) {
      const id = orderedIds[index];
      await supabase
        .from('product_images')
        .update({ sort_order: index })
        .eq('id', id)
        .eq('product_id', productId);
    }

    // Write audit log
    await supabase.from('audit_logs').insert({
      actor_id: adminUser.id,
      action: 'reorder',
      entity: 'product_images',
      entity_id: productId,
      metadata: { product_id: productId, ordered_ids: orderedIds },
    });

    return { data: orderedIds, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể thay đổi thứ tự hình ảnh';
    return { data: null, error: message };
  }
}
