import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Inserts, Json, Tables, Updates } from '@/lib/types/database';

import { buildAuditMetadata, type RequestContext } from '@/lib/services/admin/audit-metadata';
import { requireAdminAuth } from '@/lib/services/admin/auth';
import { cleanupProductImageStorage } from '@/lib/services/admin/media-cleanup';

export type AdminProduct = Tables<'products'> & {
  categories: Pick<Tables<'categories'>, 'id' | 'name' | 'slug'> | null;
  product_images: Pick<Tables<'product_images'>, 'id' | 'public_url' | 'alt' | 'sort_order' | 'is_primary' | 'is_active'>[];
  product_bulk_discounts: Pick<Tables<'product_bulk_discounts'>, 'id' | 'product_id' | 'min_quantity' | 'price_per_unit' | 'is_active'>[];
};

// Minimal scalar fields needed by the product edit form
export type ProductFormData = Pick<
  Tables<'products'>,
  'id' | 'name' | 'slug' | 'category_id' | 'price' | 'stock' | 'is_active' | 'is_featured' | 'description' | 'specs'
>;

// Slim row for the paginated list — no description, specs, or nested arrays.
// description/specs are fetched lazily in the edit dialog via getAdminProductDetail.
// thumbnail, image count, and discount info are enriched via secondary queries.
export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  category_id: string | null;
  price: number | null;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  updated_at: string;
  created_at: string;
  categories: Pick<Tables<'categories'>, 'id' | 'name' | 'slug'> | null;
  thumbnailUrl: string | null;
  imageCount: number;
  hasActiveBulkDiscount: boolean;
  activeBulkDiscountCount: number;
};

export type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
export type StatusFilter = 'all' | 'active' | 'hidden';
export type PriceFilter = 'all' | 'fixed' | 'contact';
export type ImageFilter = 'all' | 'missing' | 'has_image';

export interface ProductListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  categoryId?: string;
  status?: StatusFilter;
  stock?: StockFilter;
  price?: PriceFilter;
  images?: ImageFilter;
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
  is_featured: boolean;
}

// Base row shape returned by the slim list query (Phase 1)
type ProductBaseRow = {
  id: string;
  name: string;
  slug: string;
  category_id: string | null;
  price: number | null;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  updated_at: string;
  created_at: string;
  categories: Pick<Tables<'categories'>, 'id' | 'name' | 'slug'> | null;
};

const PRODUCT_MUTATION_ROLES = ['super_admin', 'admin', 'editor'] as const;
const SHOULD_LOG_TIMINGS =
  process.env.NODE_ENV === 'development' && process.env.ADMIN_TIMING_LOGS === '1';

function toProductAuditSnapshot(product: {
  name: string;
  slug: string;
  category_id?: string | null;
  price?: number | null;
  stock?: number;
  is_active: boolean;
  is_featured?: boolean;
}) {
  return {
    name: product.name,
    slug: product.slug,
    category_id: product.category_id ?? null,
    price: product.price ?? null,
    stock: product.stock ?? 0,
    is_active: product.is_active,
    is_featured: product.is_featured ?? false,
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
    is_featured: payload.is_featured,
  };
}

export async function getAdminProductsPage(params: ProductListParams = {}): Promise<ProductListResult> {
  const { page = 1, pageSize = 30, q, categoryId, status, stock, price, images = 'all' } = params;
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(100, Math.max(1, pageSize));

  try {
    await requireAdminAuth();
    const supabase = createServiceRoleClient();

    let imageProductIds: string[] = [];
    if (images === 'missing' || images === 'has_image') {
      const { data: imgData, error: imgError } = await supabase
        .from('product_images')
        .select('product_id');

      if (imgError) {
        throw new Error(`Failed to load product images for filtering: ${imgError.message}`);
      }

      imageProductIds = Array.from(new Set((imgData ?? []).map((img) => img.product_id).filter(Boolean)));
    }

    // --- Phase 0: Fetch total count first to enable out-of-range page clamping ---
    let countQuery = supabase
      .from('products')
      .select('id', { count: 'exact', head: true });

    if (q) countQuery = countQuery.or(`name.ilike.%${q}%,slug.ilike.%${q}%`);
    if (categoryId && categoryId !== 'all') countQuery = countQuery.eq('category_id', categoryId);
    if (status === 'active') countQuery = countQuery.eq('is_active', true);
    else if (status === 'hidden') countQuery = countQuery.eq('is_active', false);
    if (stock === 'out_of_stock') countQuery = countQuery.eq('stock', 0);
    else if (stock === 'in_stock') countQuery = countQuery.gt('stock', 0);
    else if (stock === 'low_stock') countQuery = countQuery.gt('stock', 0).lte('stock', 5);
    if (price === 'fixed') countQuery = countQuery.not('price', 'is', null);
    else if (price === 'contact') countQuery = countQuery.is('price', null);

    if (images === 'has_image') {
      if (imageProductIds.length > 0) {
        countQuery = countQuery.in('id', imageProductIds);
      } else {
        countQuery = countQuery.eq('id', '00000000-0000-0000-0000-000000000000');
      }
    } else if (images === 'missing') {
      if (imageProductIds.length > 0) {
        countQuery = countQuery.not('id', 'in', `(${imageProductIds.join(',')})`);
      }
    }

    const { count: countTotal, error: countError } = await countQuery;
    if (countError) {
      return { data: [], total: 0, page: safePage, pageSize: safePageSize, pageCount: 0, error: countError.message };
    }

    const total = countTotal ?? 0;
    const pageCount = Math.max(1, Math.ceil(total / safePageSize));
    const clampedPage = safePage > pageCount ? pageCount : safePage;

    const from = (clampedPage - 1) * safePageSize;
    const to = from + safePageSize - 1;

    // --- Phase 1: slim base query — no description, specs, or nested arrays ---
    const t0 = SHOULD_LOG_TIMINGS ? Date.now() : 0;

    let query = supabase
      .from('products')
      .select(
        'id, name, slug, category_id, price, stock, is_active, is_featured, updated_at, created_at, categories(id, name, slug)',
      )
      .order('is_featured', { ascending: false })
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

    if (images === 'has_image') {
      if (imageProductIds.length > 0) {
        query = query.in('id', imageProductIds);
      } else {
        query = query.eq('id', '00000000-0000-0000-0000-000000000000');
      }
    } else if (images === 'missing') {
      if (imageProductIds.length > 0) {
        query = query.not('id', 'in', `(${imageProductIds.join(',')})`);
      }
    }

    const { data: baseRows, error } = await query.returns<ProductBaseRow[]>();

    if (t0) console.log(`[admin-timing] getAdminProductsPage base: ${Date.now() - t0}ms (page=${clampedPage}, size=${safePageSize})`);

    if (error) return { data: [], total, page: clampedPage, pageSize: safePageSize, pageCount, error: error.message };

    const rows = baseRows ?? [];
    const productIds = rows.map((r) => r.id as string);

    if (productIds.length === 0) {
      return {
        data: [],
        total,
        page: clampedPage,
        pageSize: safePageSize,
        pageCount,
        error: null,
      };
    }

    // --- Phase 2: thumbnails + image counts + discount counts (parallel, bounded by page) ---
    const t1 = SHOULD_LOG_TIMINGS ? Date.now() : 0;

    const [imagesRes, discountsRes] = await Promise.all([
      supabase
        .from('product_images')
        .select('product_id, public_url, is_primary')
        .in('product_id', productIds),
      supabase
        .from('product_bulk_discounts')
        .select('product_id, is_active')
        .in('product_id', productIds),
    ]);

    if (t1) console.log(`[admin-timing] getAdminProductsPage secondary: ${Date.now() - t1}ms`);

    // Build thumbnail and image-count maps
    const primaryUrlById = new Map<string, string>();
    const firstUrlById = new Map<string, string>();
    const imageCountById = new Map<string, number>();

    for (const img of imagesRes.data ?? []) {
      const pid = img.product_id;
      if (!pid) continue;
      imageCountById.set(pid, (imageCountById.get(pid) ?? 0) + 1);
      if (img.public_url && !firstUrlById.has(pid)) {
        firstUrlById.set(pid, img.public_url);
      }
      if (img.is_primary && img.public_url) {
        primaryUrlById.set(pid, img.public_url);
      }
    }

    // Build active bulk-discount count map
    const activeBulkCountById = new Map<string, number>();
    for (const d of discountsRes.data ?? []) {
      if (!d.product_id || !d.is_active) continue;
      activeBulkCountById.set(d.product_id, (activeBulkCountById.get(d.product_id) ?? 0) + 1);
    }

    // Assemble final slim list items
    const data: ProductListItem[] = rows.map((row) => {
      const activeBulkCount = activeBulkCountById.get(row.id) ?? 0;
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        category_id: row.category_id,
        price: row.price,
        stock: row.stock,
        is_active: row.is_active,
        is_featured: row.is_featured,
        updated_at: row.updated_at,
        created_at: row.created_at,
        categories: row.categories,
        thumbnailUrl: primaryUrlById.get(row.id) ?? firstUrlById.get(row.id) ?? null,
        imageCount: imageCountById.get(row.id) ?? 0,
        hasActiveBulkDiscount: activeBulkCount > 0,
        activeBulkDiscountCount: activeBulkCount,
      };
    });

    return {
      data,
      total,
      page: clampedPage,
      pageSize: safePageSize,
      pageCount,
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
  await requireAdminAuth();
  const supabase = createServiceRoleClient();
  const t0 = SHOULD_LOG_TIMINGS ? Date.now() : 0;
  const [totalRes, activeRes, outOfStockRes, lowStockRes] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('stock', 0),
    supabase.from('products').select('id', { count: 'exact', head: true }).gt('stock', 0).lte('stock', 5),
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

export async function createAdminProduct(payload: ProductPayload, requestContext?: RequestContext) {
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
      requestContext,
    }),
  });

  return { data, error: null };
}

export async function updateAdminProduct(productId: string, payload: ProductPayload, requestContext?: RequestContext) {
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
      requestContext,
    }),
  });

  return { data, error: null };
}

export async function deleteAdminProduct(productId: string, requestContext?: RequestContext) {
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

  const { data: imagesBeforeDelete } = await supabase
    .from('product_images')
    .select('storage_path')
    .eq('product_id', productId);

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

  const cleanupResults = await cleanupProductImageStorage(
    (imagesBeforeDelete ?? []).map((img) => img.storage_path),
  );

  const deletedFiles = cleanupResults.filter((r) => r.deleted).map((r) => r.storage_path);
  const skippedFiles = cleanupResults.filter((r) => r.skipped);
  const failedFiles = cleanupResults.filter((r) => r.failed);

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
      extra: {
        total_images: imagesBeforeDelete?.length ?? 0,
        deleted_files: deletedFiles.length,
        skipped_files: skippedFiles.length,
        failed_files: failedFiles.length,
        failed_paths: failedFiles.map((r) => r.storage_path),
      },
      requestContext,
    }),
  });

  return { data: product, error: null };
}

export async function setAdminProductActive(productId: string, isActive: boolean, requestContext?: RequestContext) {
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
      requestContext,
    }),
  });

  return { data, error: null };
}
