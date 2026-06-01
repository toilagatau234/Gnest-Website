import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Inserts, Updates } from '@/lib/types/database';
import { requireAdminAuth } from '@/lib/services/admin/auth';

const PRODUCT_MUTATION_ROLES = ['super_admin', 'admin', 'editor'] as const;

export interface BulkDiscountPayload {
  product_id: string;
  min_quantity: number;
  price_per_unit: number;
  is_active: boolean;
}

export async function createAdminProductBulkDiscount(payload: BulkDiscountPayload) {
  try {
    const adminUser = await requireAdminAuth(PRODUCT_MUTATION_ROLES);
    const supabase = createServiceRoleClient();

    // 1. Validate quantity and price
    if (payload.min_quantity <= 0) {
      return { data: null, error: 'Số lượng mua tối thiểu phải lớn hơn 0.' };
    }
    if (payload.price_per_unit < 0) {
      return { data: null, error: 'Giá sỉ phải lớn hơn hoặc bằng 0.' };
    }

    // 2. Validate product existence
    const { data: product, error: pError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', payload.product_id)
      .maybeSingle();

    if (pError || !product) {
      return { data: null, error: 'Sản phẩm liên kết không tồn tại.' };
    }

    // 3. Prevent duplicate min_quantity tiers for the same product
    const { data: dupDiscount } = await supabase
      .from('product_bulk_discounts')
      .select('id')
      .eq('product_id', payload.product_id)
      .eq('min_quantity', payload.min_quantity)
      .maybeSingle();

    if (dupDiscount) {
      return {
        data: null,
        error: `Đã tồn tại bậc giá sỉ cho số lượng ${payload.min_quantity} sản phẩm. Hãy chỉnh sửa thay vì thêm mới.`,
      };
    }

    const insertPayload: Inserts<'product_bulk_discounts'> = {
      product_id: payload.product_id,
      min_quantity: payload.min_quantity,
      price_per_unit: payload.price_per_unit,
      is_active: payload.is_active,
    };

    const { data, error } = await supabase
      .from('product_bulk_discounts')
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
      entity: 'product_bulk_discounts',
      entity_id: data.id,
      metadata: { 
        product_id: data.product_id, 
        product_name: product.name, 
        min_quantity: data.min_quantity, 
        price_per_unit: data.price_per_unit 
      },
    });

    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể tạo bậc giá sỉ';
    return { data: null, error: message };
  }
}

export async function updateAdminProductBulkDiscount(
  discountId: string,
  payload: { min_quantity: number; price_per_unit: number; is_active: boolean }
) {
  try {
    const adminUser = await requireAdminAuth(PRODUCT_MUTATION_ROLES);
    const supabase = createServiceRoleClient();

    // 1. Validate quantity and price
    if (payload.min_quantity <= 0) {
      return { data: null, error: 'Số lượng mua tối thiểu phải lớn hơn 0.' };
    }
    if (payload.price_per_unit < 0) {
      return { data: null, error: 'Giá sỉ phải lớn hơn hoặc bằng 0.' };
    }

    const { data: currentDiscount, error: fetchError } = await supabase
      .from('product_bulk_discounts')
      .select('id, product_id')
      .eq('id', discountId)
      .maybeSingle();

    if (fetchError || !currentDiscount) {
      return { data: null, error: 'Không tìm thấy bậc giá sỉ cần cập nhật.' };
    }

    // 2. Prevent duplicate min_quantity tiers for the same product
    const { data: dupDiscount } = await supabase
      .from('product_bulk_discounts')
      .select('id')
      .eq('product_id', currentDiscount.product_id)
      .eq('min_quantity', payload.min_quantity)
      .neq('id', discountId)
      .maybeSingle();

    if (dupDiscount) {
      return {
        data: null,
        error: `Đã tồn tại bậc giá sỉ khác cho số lượng ${payload.min_quantity} sản phẩm.`,
      };
    }

    const updatePayload: Updates<'product_bulk_discounts'> = {
      min_quantity: payload.min_quantity,
      price_per_unit: payload.price_per_unit,
      is_active: payload.is_active,
    };

    const { data, error } = await supabase
      .from('product_bulk_discounts')
      .update(updatePayload)
      .eq('id', discountId)
      .select('*')
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    // Write audit log
    await supabase.from('audit_logs').insert({
      actor_id: adminUser.id,
      action: 'update',
      entity: 'product_bulk_discounts',
      entity_id: discountId,
      metadata: { 
        product_id: data.product_id, 
        min_quantity: data.min_quantity, 
        price_per_unit: data.price_per_unit,
        is_active: data.is_active 
      },
    });

    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể cập nhật bậc giá sỉ';
    return { data: null, error: message };
  }
}

export async function deleteAdminProductBulkDiscount(discountId: string) {
  try {
    const adminUser = await requireAdminAuth(PRODUCT_MUTATION_ROLES);
    const supabase = createServiceRoleClient();

    const { data: discount, error: fetchError } = await supabase
      .from('product_bulk_discounts')
      .select('*')
      .eq('id', discountId)
      .maybeSingle();

    if (fetchError || !discount) {
      return { data: null, error: 'Không tìm thấy bậc giá sỉ cần xóa.' };
    }

    const { error } = await supabase
      .from('product_bulk_discounts')
      .delete()
      .eq('id', discountId);

    if (error) {
      return { data: null, error: error.message };
    }

    // Write audit log
    await supabase.from('audit_logs').insert({
      actor_id: adminUser.id,
      action: 'delete',
      entity: 'product_bulk_discounts',
      entity_id: discountId,
      metadata: { 
        product_id: discount.product_id, 
        min_quantity: discount.min_quantity, 
        price_per_unit: discount.price_per_unit 
      },
    });

    return { data: discount, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể xóa bậc giá sỉ';
    return { data: null, error: message };
  }
}

export async function setAdminProductBulkDiscountActive(discountId: string, isActive: boolean) {
  try {
    const adminUser = await requireAdminAuth(PRODUCT_MUTATION_ROLES);
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('product_bulk_discounts')
      .update({ is_active: isActive })
      .eq('id', discountId)
      .select('*')
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    // Write audit log
    await supabase.from('audit_logs').insert({
      actor_id: adminUser.id,
      action: isActive ? 'activate' : 'deactivate',
      entity: 'product_bulk_discounts',
      entity_id: discountId,
      metadata: { product_id: data.product_id, min_quantity: data.min_quantity },
    });

    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể thay đổi trạng thái bậc giá sỉ';
    return { data: null, error: message };
  }
}
