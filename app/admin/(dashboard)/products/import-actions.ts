'use server';

import { revalidatePath } from 'next/cache';

import { getRequestContext, buildAuditMetadata } from '@/lib/services/admin/audit-metadata';
import { requireAdminAuth } from '@/lib/services/admin/auth';
import { CONTENT_EDITOR_ROLES } from '@/lib/services/admin/permissions';
import {
  bulkImportProducts,
  validateProductImportRows,
  type ColumnDef,
  type ImportResult,
  type ImportRow,
  type ImportRowError,
  type ImportRowWarning,
  type ValidationResult,
} from '@/lib/services/admin/product-import';

export type { ColumnDef, ImportResult, ImportRow, ImportRowError, ImportRowWarning, ValidationResult };

export async function validateProductsImportAction(rows: ImportRow[]): Promise<ValidationResult> {
  await requireAdminAuth(CONTENT_EDITOR_ROLES);

  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      ok: false,
      errors: [],
      warnings: [],
      validCount: 0,
      warningCount: 0,
      errorCount: 0,
      error: 'File không có dữ liệu sản phẩm.',
    };
  }

  if (rows.length > 500) {
    return {
      ok: false,
      errors: [],
      warnings: [],
      validCount: 0,
      warningCount: 0,
      errorCount: 0,
      error: 'Tối đa 500 sản phẩm mỗi lần nhập.',
    };
  }

  return validateProductImportRows(rows);
}

export async function importProductsAction(
  _prev: ImportResult,
  formData: FormData,
): Promise<ImportResult> {
  await requireAdminAuth(CONTENT_EDITOR_ROLES);

  const raw = formData.get('rows');
  if (!raw || typeof raw !== 'string') {
    return { ok: false, error: 'Dữ liệu không hợp lệ.' };
  }

  let rows: ImportRow[];
  try {
    rows = JSON.parse(raw) as ImportRow[];
  } catch {
    return { ok: false, error: 'Không thể đọc dữ liệu từ file.' };
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, error: 'File không có dữ liệu sản phẩm.' };
  }

  if (rows.length > 500) {
    return { ok: false, error: 'Tối đa 500 sản phẩm mỗi lần nhập.' };
  }

  const requestContext = await getRequestContext();
  const result = await bulkImportProducts(rows, requestContext);

  if (result.ok) {
    revalidatePath('/admin/products');
    revalidatePath('/admin/dashboard');
    revalidatePath('/danh-muc');
  }

  return result;
}

export async function generateTemplateColumnsAction(templateCode: string): Promise<ColumnDef[]> {
  await requireAdminAuth(CONTENT_EDITOR_ROLES);
  const { generateTemplateColumns } = await import('@/lib/services/admin/product-import');
  return generateTemplateColumns(templateCode);
}

export async function importProductsV3Action(
  rows: ImportRow[],
): Promise<{ ok: boolean; imported: number; tierCount: number; error?: string }> {
  await requireAdminAuth(CONTENT_EDITOR_ROLES);

  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, imported: 0, tierCount: 0, error: 'Không có dữ liệu sản phẩm.' };
  }
  if (rows.length > 500) {
    return { ok: false, imported: 0, tierCount: 0, error: 'Tối đa 500 sản phẩm mỗi lần nhập.' };
  }

  const requestContext = await getRequestContext();
  const result = await bulkImportProducts(rows, requestContext);

  if (!result.ok) {
    return { ok: false, imported: 0, tierCount: 0, error: result.error };
  }

  const rowsWithImages = rows.filter(
    (r) => r.image_1_url || r.image_2_url || r.image_3_url,
  );

  if (rowsWithImages.length > 0) {
    const { createServiceRoleClient } = await import('@/lib/supabase/server');
    const supabase = createServiceRoleClient();

    const slugs = rowsWithImages.map((r) =>
      String(r.slug ?? '').trim().toLowerCase().replace(/\s+/g, '-'),
    );
    const { data: products } = await supabase
      .from('products')
      .select('id, slug')
      .in('slug', slugs);

    if (products && products.length > 0) {
      const slugToId = new Map(products.map((p) => [p.slug, p.id]));
      const imageInserts: {
        product_id: string;
        storage_path: string;
        public_url: string;
        sort_order: number;
        is_primary: boolean;
        is_active: boolean;
      }[] = [];

      for (const row of rowsWithImages) {
        const slug = String(row.slug ?? '').trim().toLowerCase().replace(/\s+/g, '-');
        const productId = slugToId.get(slug);
        if (!productId) continue;

        const urls = [row.image_1_url, row.image_2_url, row.image_3_url].filter(
          (u): u is string => typeof u === 'string' && u.trim().length > 0,
        );

        urls.forEach((url, i) => {
          imageInserts.push({
            product_id: productId,
            storage_path: url,
            public_url: url,
            sort_order: i,
            is_primary: i === 0,
            is_active: true,
          });
        });
      }

      if (imageInserts.length > 0) {
        await supabase.from('product_images').insert(imageInserts);
      }
    }
  }

  revalidatePath('/admin/products');
  revalidatePath('/admin/dashboard');
  revalidatePath('/danh-muc');

  return {
    ok: true,
    imported: result.imported ?? 0,
    tierCount: result.tier_count ?? 0,
  };
}

export async function importProductsExcelAction(
  rows: any[],
  templateCode: string,
  dryRun: boolean
): Promise<{ ok: boolean; importedCount: number; errors: any[]; error?: string }> {
  await requireAdminAuth(CONTENT_EDITOR_ROLES);
  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, importedCount: 0, errors: [], error: 'File không có dữ liệu sản phẩm.' };
  }
  if (rows.length > 500) {
    return { ok: false, importedCount: 0, errors: [], error: 'Tối đa 500 dòng sản phẩm mỗi lần nhập.' };
  }

  const { importProductsExcel } = await import('@/lib/services/admin/product-import');
  const result = await importProductsExcel(rows, templateCode, dryRun);

  if (result.ok && !dryRun) {
    revalidatePath('/admin/products');
    revalidatePath('/admin/dashboard');
    revalidatePath('/danh-muc');
  }

  return result;
}

// ── V4 Import (UPSERT + dynamic spec grouping) ────────────────────────────────

export interface V4ImportRow {
  row?: number;
  sku?: string | null;
  name?: string | null;
  slug?: string | null;
  template_code?: string | null;
  category?: string | null;
  description?: string | null;
  is_active?: boolean | string | number | null;
  is_featured?: boolean | string | number | null;
  price?: number | string | null;
  stock?: number | string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  specs?: Record<string, unknown> | null;
  image_1_url?: string | null;
  image_2_url?: string | null;
  image_3_url?: string | null;
  tier_1_price?: number | string | null;
  tier_1_min_qty?: number | string | null;
  tier_2_price?: number | string | null;
  tier_2_min_qty?: number | string | null;
  tier_3_price?: number | string | null;
  tier_3_min_qty?: number | string | null;
}

export interface V4ValidationResult {
  ok: boolean;
  errors: { row: number; field: string; message: string }[];
  warnings: { row: number; field: string; message: string }[];
  validCount: number;
  insertCount: number;
  upsertCount: number;
  errorCount: number;
  error?: string;
}

export interface V4ImportResult {
  ok: boolean;
  upserted: number;
  inserted: number;
  updated: number;
  tierCount: number;
  imageCount: number;
  error?: string;
}

const V4_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function validateV4ImportAction(rows: V4ImportRow[]): Promise<V4ValidationResult> {
  await requireAdminAuth(CONTENT_EDITOR_ROLES);

  const EMPTY: V4ValidationResult = {
    ok: false, errors: [], warnings: [], validCount: 0,
    insertCount: 0, upsertCount: 0, errorCount: 0,
  };

  if (!Array.isArray(rows) || rows.length === 0) {
    return { ...EMPTY, error: 'File không có dữ liệu sản phẩm.' };
  }
  if (rows.length > 500) {
    return { ...EMPTY, error: 'Tối đa 500 sản phẩm mỗi lần nhập.' };
  }

  try {
    const { createServiceRoleClient } = await import('@/lib/supabase/server');
    const supabase = createServiceRoleClient();

    const candidateSlugs = rows
      .map((r) => String(r.slug ?? '').trim().toLowerCase())
      .filter((s) => V4_SLUG_RE.test(s));

    const [catsResult, existingResult] = await Promise.all([
      supabase.from('categories').select('id, slug, name').eq('is_active', true),
      candidateSlugs.length > 0
        ? supabase.from('products').select('slug').in('slug', candidateSlugs)
        : Promise.resolve({ data: [] as { slug: string }[], error: null }),
    ]);

    const validCategoryKeys = new Set<string>();
    for (const c of catsResult.data ?? []) {
      validCategoryKeys.add(c.slug.toLowerCase());
      validCategoryKeys.add(c.name.toLowerCase());
    }
    const existingSlugSet = new Set<string>((existingResult.data ?? []).map((p) => p.slug));

    const errors: V4ValidationResult['errors'] = [];
    const warnings: V4ValidationResult['warnings'] = [];
    const seenSlugs = new Set<string>();
    let insertCount = 0;
    let upsertCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = row.row ?? i + 3;

      if (!String(row.name ?? '').trim()) {
        errors.push({ row: rowNum, field: 'name', message: 'Tên sản phẩm không được để trống.' });
      }

      const slug = String(row.slug ?? '').trim().toLowerCase();
      if (!slug) {
        errors.push({ row: rowNum, field: 'slug', message: 'Slug không được để trống.' });
      } else if (!V4_SLUG_RE.test(slug)) {
        errors.push({ row: rowNum, field: 'slug', message: 'Slug chỉ gồm chữ thường a-z, số 0-9 và dấu gạch ngang.' });
      } else if (seenSlugs.has(slug)) {
        errors.push({ row: rowNum, field: 'slug', message: `Slug "${slug}" bị trùng lặp trong file.` });
      } else {
        seenSlugs.add(slug);
        if (existingSlugSet.has(slug)) {
          warnings.push({ row: rowNum, field: 'slug', message: `Slug "${slug}" đã tồn tại — sẽ cập nhật (UPSERT).` });
          upsertCount++;
        } else {
          insertCount++;
        }
      }

      const catInput = String(row.category ?? '').trim().toLowerCase();
      if (catInput && !validCategoryKeys.has(catInput)) {
        errors.push({ row: rowNum, field: 'category', message: `Danh mục "${catInput}" không tồn tại hoặc đang bị ẩn.` });
      }
    }

    const errorRowSet = new Set(errors.map((e) => e.row));
    return {
      ok: errors.length === 0,
      errors,
      warnings,
      validCount: rows.filter((r, i) => !errorRowSet.has(r.row ?? i + 3)).length,
      insertCount,
      upsertCount,
      errorCount: errorRowSet.size,
    };
  } catch (err) {
    return { ...EMPTY, error: err instanceof Error ? err.message : 'Lỗi kiểm tra dữ liệu.' };
  }
}

export async function importV4UpsertAction(rows: V4ImportRow[]): Promise<V4ImportResult> {
  const adminUser = await requireAdminAuth(CONTENT_EDITOR_ROLES);

  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, upserted: 0, inserted: 0, updated: 0, tierCount: 0, imageCount: 0, error: 'Không có dữ liệu sản phẩm.' };
  }
  if (rows.length > 500) {
    return { ok: false, upserted: 0, inserted: 0, updated: 0, tierCount: 0, imageCount: 0, error: 'Tối đa 500 sản phẩm mỗi lần nhập.' };
  }

  const { createServiceRoleClient } = await import('@/lib/supabase/server');
  const supabase = createServiceRoleClient();

  const { data: cats } = await supabase.from('categories').select('id, slug, name').eq('is_active', true);
  const catMap = new Map<string, string>();
  for (const c of cats ?? []) {
    catMap.set(c.slug.toLowerCase(), c.id);
    catMap.set(c.name.toLowerCase(), c.id);
  }

  const slugs = rows.map((r) => String(r.slug ?? '').trim().toLowerCase()).filter(Boolean);
  const { data: existing } = await supabase
    .from('products')
    .select('id, slug, specs, sku')
    .in('slug', slugs);

  const existingBySlug = new Map<string, { id: string; specs: Record<string, unknown>; sku: string | null }>();
  for (const p of existing ?? []) {
    existingBySlug.set(p.slug, {
      id: p.id,
      specs: (p.specs as Record<string, unknown>) ?? {},
      sku: (p.sku as string | null) ?? null,
    });
  }

  const parseBool = (v: unknown, def: boolean): boolean => {
    if (v === null || v === undefined || String(v).trim() === '') return def;
    return !['false', '0', 'no', 'không', 'hidden'].includes(String(v).trim().toLowerCase());
  };
  const parsePrice = (v: unknown): number | null => {
    if (v === null || v === undefined || String(v).trim() === '') return null;
    const n = Number(String(v).replace(/[\s,]/g, ''));
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  const parseStock = (v: unknown): number => {
    if (v === null || v === undefined || String(v).trim() === '') return 0;
    const n = parseInt(String(v), 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };

  const upsertPayloads: Record<string, unknown>[] = [];
  const tierDataBySlug = new Map<string, { price: number; qty: number }[]>();
  const imageDataBySlug = new Map<string, string[]>();

  for (const row of rows) {
    const slug = String(row.slug ?? '').trim().toLowerCase();
    const name = String(row.name ?? '').trim();
    if (!slug || !name) continue;

    // Merge specs: preserve existing fields, overlay only non-empty incoming values
    const existingSpecs = existingBySlug.get(slug)?.specs ?? {};
    const incoming = row.specs ?? {};
    const filteredIncoming: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(incoming)) {
      if (v !== null && v !== undefined && String(v).trim() !== '') filteredIncoming[k] = v;
    }
    const mergedSpecs: Record<string, unknown> = { ...existingSpecs, ...filteredIncoming };
    if (row.template_code) mergedSpecs._template = row.template_code;

    const catInput = String(row.category ?? '').trim().toLowerCase();
    upsertPayloads.push({
      sku: row.sku ? String(row.sku).trim() || null : (existingBySlug.get(slug)?.sku ?? null),
      name,
      slug,
      category_id: catInput ? (catMap.get(catInput) ?? null) : null,
      description: String(row.description ?? '').trim() || null,
      price: parsePrice(row.price),
      stock: parseStock(row.stock),
      is_active: parseBool(row.is_active, true),
      is_featured: parseBool(row.is_featured, false),
      seo_title: String(row.seo_title ?? '').trim() || null,
      seo_description: String(row.seo_description ?? '').trim() || null,
      seo_keywords: String(row.seo_keywords ?? '').trim() || null,
      specs: mergedSpecs,
    });

    const tiers: { price: number; qty: number }[] = [];
    for (let i = 1; i <= 3; i++) {
      const price = parsePrice((row as Record<string, unknown>)[`tier_${i}_price`]);
      const qty = parsePrice((row as Record<string, unknown>)[`tier_${i}_min_qty`]);
      if (price !== null && qty !== null && qty > 0) tiers.push({ price, qty });
    }
    if (tiers.length > 0) tierDataBySlug.set(slug, tiers);

    const imgs = [row.image_1_url, row.image_2_url, row.image_3_url].filter(
      (u): u is string => typeof u === 'string' && u.trim().length > 0,
    );
    if (imgs.length > 0) imageDataBySlug.set(slug, imgs);
  }

  if (upsertPayloads.length === 0) {
    return { ok: false, upserted: 0, inserted: 0, updated: 0, tierCount: 0, imageCount: 0, error: 'Không có hàng hợp lệ để nhập.' };
  }

  const { data: upserted, error: upsertError } = await supabase
    .from('products')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert(upsertPayloads as any, { onConflict: 'slug', ignoreDuplicates: false })
    .select('id, slug');

  if (upsertError) {
    return { ok: false, upserted: 0, inserted: 0, updated: 0, tierCount: 0, imageCount: 0, error: upsertError.message };
  }

  const upsertedProducts = upserted ?? [];
  const insertedCount = upsertedProducts.filter((p) => !existingBySlug.has(p.slug)).length;
  const updatedCount = upsertedProducts.length - insertedCount;
  const slugToId = new Map(upsertedProducts.map((p) => [p.slug, p.id]));

  let tierCount = 0;
  for (const [slug, tiers] of tierDataBySlug) {
    const productId = slugToId.get(slug);
    if (!productId) continue;
    await supabase.from('product_bulk_discounts').delete().eq('product_id', productId);
    const { data: ti } = await supabase
      .from('product_bulk_discounts')
      .insert(tiers.map((t) => ({ product_id: productId, min_quantity: t.qty, price_per_unit: t.price, is_active: true })))
      .select('id');
    tierCount += ti?.length ?? 0;
  }

  let imageCount = 0;
  for (const [slug, urls] of imageDataBySlug) {
    const productId = slugToId.get(slug);
    if (!productId) continue;
    await supabase.from('product_images').delete().eq('product_id', productId);
    const { data: ii } = await supabase
      .from('product_images')
      .insert(urls.map((url, i) => ({ product_id: productId, storage_path: url, public_url: url, sort_order: i, is_primary: i === 0, is_active: true })))
      .select('id');
    imageCount += ii?.length ?? 0;
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: 'bulk_upsert_v4',
    entity: 'products',
    entity_id: null,
    metadata: buildAuditMetadata({
      extra: { upserted: upsertedProducts.length, inserted: insertedCount, updated: updatedCount, tiers: tierCount, images: imageCount },
    }),
  });

  revalidatePath('/admin/products');
  revalidatePath('/admin/dashboard');
  revalidatePath('/danh-muc');

  return { ok: true, upserted: upsertedProducts.length, inserted: insertedCount, updated: updatedCount, tierCount, imageCount };
}

