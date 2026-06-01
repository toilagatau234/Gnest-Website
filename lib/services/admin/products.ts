import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Inserts, Json, Tables, Updates } from '@/lib/types/database';

import { requireAdminAuth } from '@/lib/services/admin/auth';

export type AdminProduct = Tables<'products'> & {
  categories: Pick<Tables<'categories'>, 'id' | 'name' | 'slug'> | null;
  product_images: Pick<Tables<'product_images'>, 'id' | 'public_url' | 'alt' | 'sort_order' | 'is_primary' | 'is_active'>[];
  product_bulk_discounts: Pick<Tables<'product_bulk_discounts'>, 'id' | 'product_id' | 'min_quantity' | 'price_per_unit' | 'is_active'>[];
};

export interface ProductPayload {
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price: number | null;
  stock: number;
  specs: Json;
  is_active: boolean;
}

const PRODUCT_MUTATION_ROLES = ['super_admin', 'admin', 'editor'] as const;

function normalizeProductPayload(payload: ProductPayload): Inserts<'products'> {
  return {
    category_id: payload.category_id || null,
    name: payload.name.trim(),
    slug: payload.slug.trim().toLowerCase(),
    description: payload.description?.trim() || null,
    price: payload.price,
    stock: payload.stock,
    specs: payload.specs,
    is_active: payload.is_active,
  };
}

export async function getAdminProducts() {
  try {
    await requireAdminAuth();
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('products')
      .select('*, categories (id, name, slug), product_images (id, public_url, alt, sort_order, is_primary, is_active), product_bulk_discounts (id, product_id, min_quantity, price_per_unit, is_active)')
      .order('created_at', { ascending: false })
      .returns<AdminProduct[]>();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể tải sản phẩm';
    return { data: null, error: message };
  }
}

export async function createAdminProduct(payload: ProductPayload) {
  const adminUser = await requireAdminAuth(PRODUCT_MUTATION_ROLES);
  const supabase = createServiceRoleClient();
  const insertPayload = normalizeProductPayload(payload);

  const { data, error } = await supabase
    .from('products')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: 'create',
    entity: 'products',
    entity_id: data.id,
    metadata: { name: data.name, slug: data.slug },
  });

  return { data, error: null };
}

export async function updateAdminProduct(productId: string, payload: ProductPayload) {
  const adminUser = await requireAdminAuth(PRODUCT_MUTATION_ROLES);
  const supabase = createServiceRoleClient();
  const updatePayload: Updates<'products'> = normalizeProductPayload(payload);

  const { data, error } = await supabase
    .from('products')
    .update(updatePayload)
    .eq('id', productId)
    .select('*')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: 'update',
    entity: 'products',
    entity_id: data.id,
    metadata: { name: data.name, slug: data.slug },
  });

  return { data, error: null };
}

export async function deleteAdminProduct(productId: string) {
  const adminUser = await requireAdminAuth(PRODUCT_MUTATION_ROLES);
  const supabase = createServiceRoleClient();

  const { data: product } = await supabase
    .from('products')
    .select('id, name, slug')
    .eq('id', productId)
    .maybeSingle();

  if (!product) {
    return { data: null, error: 'Không tìm thấy sản phẩm cần xóa.' };
  }

  const { error } = await supabase.from('products').delete().eq('id', productId);

  if (error) {
    if (error.code === '23503') {
      return {
        data: null,
        error: 'Không thể xóa vì đang có dữ liệu liên quan. Hãy ẩn sản phẩm thay vì xóa.',
      };
    }
    return { data: null, error: error.message };
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: 'delete',
    entity: 'products',
    entity_id: product.id,
    metadata: { name: product.name, slug: product.slug },
  });

  return { data: product, error: null };
}

export async function setAdminProductActive(productId: string, isActive: boolean) {
  const adminUser = await requireAdminAuth(PRODUCT_MUTATION_ROLES);
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('products')
    .update({ is_active: isActive })
    .eq('id', productId)
    .select('id, name, slug, is_active')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: isActive ? 'activate' : 'deactivate',
    entity: 'products',
    entity_id: data.id,
    metadata: { name: data.name, slug: data.slug },
  });

  return { data, error: null };
}
