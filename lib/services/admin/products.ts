import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Inserts, Json, Tables, Updates } from '@/lib/types/database';

import { buildAuditMetadata } from '@/lib/services/admin/audit-metadata';
import { requireAdminAuth } from '@/lib/services/admin/auth';

export type AdminProduct = Tables<'products'> & {
  categories: Pick<Tables<'categories'>, 'id' | 'name' | 'slug'> | null;
  product_images: Pick<Tables<'product_images'>, 'id' | 'public_url' | 'alt' | 'sort_order' | 'is_primary' | 'is_active'>[];
  product_bulk_discounts: Pick<Tables<'product_bulk_discounts'>, 'id' | 'product_id' | 'min_quantity' | 'price_per_unit' | 'is_active'>[];
};

// Minimal scalar fields needed by the product edit form
export type ProductFormData = Pick<
  Tables<'products'>,
  'id' | 'name' | 'slug' | 'category_id' | 'price' | 'stock' | 'is_active' | 'description' | 'specs'
>;

// Lightweight row returned by the paginated list query
export type ProductListItem = ProductFormData & {
  updated_at: string;
  created_at: string;
  categories: Pick<Tables<'categories'>, 'id' | 'name' | 'slug'> | null;
  product_images: Pick<Tables<'product_images'>, 'id' | 'public_url' | 'is_primary'>[];
  product_bulk_discounts: Pick<Tables<'product_bulk_discounts'>, 'id' | 'is_active'>[];
};

export type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
export type StatusFilter = 'all' | 'active' | 'hidden';
export type PriceFilter = 'all' | 'fixed' | 'contact';

export interface ProductListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  categoryId?: string;
  status?: StatusFilter;
  stock?: StockFilter;
  price?: PriceFilter;
}

export interface ProductStats {
  total: number;
  active: number;
  hidden: number;
  outOfStock: number;
  lowStock: number;
}

export interface ProductListResult {
  data: ProductListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  error: string | null;
}

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

function toProductAuditSnapshot(product: {
  name: string;
  slug: string;
  category_id?: string | null;
  price?: number | null;
  stock?: number;
  is_active: boolean;
}) {
  return {
    name: product.name,
    slug: product.slug,
    category_id: product.category_id ?? null,
    price: product.price ?? null,
    stock: product.stock ?? 0,
    is_active: product.is_active,
  };
}

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

export async function getAdminProductsPage(params: ProductListParams = {}): Promise<ProductListResult> {
  const { page = 1, pageSize = 30, q, categoryId, status, stock, price } = params;
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(100, Math.max(1, pageSize));
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  try {
    await requireAdminAuth();
    const supabase = createServiceRoleClient();
    const t0 = process.env.NODE_ENV === 'development' && process.env.ADMIN_TIMING_LOGS === '1' ? Date.now() : 0;

    let query = supabase
      .from('products')
      .select(
        'id, name, slug, category_id, price, stock, is_active, description, specs, updated_at, created_at, categories(id, name, slug), product_images(id, public_url, is_primary), product_bulk_discounts(id, is_active)',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(from, to);

    if (q) query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%`);
    if (categoryId && categoryId !== 'all') query = query.eq('category_id', categoryId);
    if (status === 'active') query = query.eq('is_active', true);
    else if (status === 'hidden') query = query.eq('is_active', false);
    if (stock === 'out_of_stock') query = query.eq('stock', 0);
    else if (stock === 'in_stock') query = query.gt('stock', 0);
    else if (stock === 'low_stock') query = query.gt('stock', 0).lte('stock', 5);
    if (price === 'fixed') query = query.not('price', 'is', null);
    else if (price === 'contact') query = query.is('price', null);

    const { data, count, error } = await query.returns<ProductListItem[]>();

    if (t0) console.log(`[admin-timing] getAdminProductsPage: ${Date.now() - t0}ms (page=${safePage}, size=${safePageSize})`);

    if (error) return { data: [], total: 0, page: safePage, pageSize: safePageSize, pageCount: 0, error: error.message };
    const total = count ?? 0;
    return {
      data: data || [],
      total,
      page: safePage,
      pageSize: safePageSize,
      pageCount: Math.max(1, Math.ceil(total / safePageSize)),
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể tải sản phẩm';
    return { data: [], total: 0, page: safePage, pageSize: safePageSize, pageCount: 0, error: message };
  }
}

export async function getAdminProductDetail(productId: string): Promise<{ data: AdminProduct | null; error: string | null }> {
  try {
    await requireAdminAuth();
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(id, name, slug), product_images(id, public_url, alt, sort_order, is_primary, is_active), product_bulk_discounts(id, product_id, min_quantity, price_per_unit, is_active)')
      .eq('id', productId)
      .single()
      .returns<AdminProduct>();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Không thể tải chi tiết sản phẩm' };
  }
}

export async function getAdminProductStats(): Promise<ProductStats> {
  const supabase = createServiceRoleClient();
  const t0 = process.env.NODE_ENV === 'development' && process.env.ADMIN_TIMING_LOGS === '1' ? Date.now() : 0;
  const [totalRes, activeRes, outOfStockRes, lowStockRes] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('stock', 0),
    supabase.from('products').select('*', { count: 'exact', head: true }).gt('stock', 0).lte('stock', 5),
  ]);
  if (t0) console.log(`[admin-timing] getAdminProductStats: ${Date.now() - t0}ms`);
  const total = totalRes.count ?? 0;
  const active = activeRes.count ?? 0;
  return { total, active, hidden: total - active, outOfStock: outOfStockRes.count ?? 0, lowStock: lowStockRes.count ?? 0 };
}

/**
 * @deprecated Use `getAdminProductsPage` for the products list page.
 * This function fetches ALL products with all relations in one call and has
 * no pagination, making it unsuitable for large catalogs. It is kept only
 * for compatibility during a future cleanup. No current admin page calls it.
 */
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
    metadata: buildAuditMetadata({
      label: data.name,
      after: toProductAuditSnapshot(data),
    }),
  });

  return { data, error: null };
}

export async function updateAdminProduct(productId: string, payload: ProductPayload) {
  const adminUser = await requireAdminAuth(PRODUCT_MUTATION_ROLES);
  const supabase = createServiceRoleClient();
  const { data: before } = await supabase
    .from('products')
    .select('name, slug, category_id, price, stock, is_active')
    .eq('id', productId)
    .maybeSingle();
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
    metadata: buildAuditMetadata({
      label: data.name,
      before: before ? toProductAuditSnapshot(before) : null,
      after: toProductAuditSnapshot(data),
    }),
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
    metadata: buildAuditMetadata({
      label: product.name,
      before: {
        name: product.name,
        slug: product.slug,
      },
    }),
  });

  return { data: product, error: null };
}

export async function setAdminProductActive(productId: string, isActive: boolean) {
  const adminUser = await requireAdminAuth(PRODUCT_MUTATION_ROLES);
  const supabase = createServiceRoleClient();
  const { data: before } = await supabase
    .from('products')
    .select('name, slug, category_id, price, stock, is_active')
    .eq('id', productId)
    .maybeSingle();

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
    metadata: buildAuditMetadata({
      label: data.name,
      before: before ? toProductAuditSnapshot(before) : null,
      after: toProductAuditSnapshot(data),
    }),
  });

  return { data, error: null };
}
