import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Inserts, Json } from '@/lib/types/database';
import { requireAdminAuth } from '@/lib/services/admin/auth';
import { buildAuditMetadata, type RequestContext } from '@/lib/services/admin/audit-metadata';

const PRODUCT_IMPORT_ROLES = ['super_admin', 'admin', 'editor'] as const;
const HTTPS_URL_RE = /^https:\/\/.+/i;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ImportRow {
  row: number;
  name: string;
  slug: string;
  parent_category_slug?: string | null;
  category_slug: string;
  description?: string | null;
  base_price?: string | number | null;
  stock?: string | number | null;
  is_active?: string | boolean | number | null;
  // Physical spec fields → merged into products.specs JSONB
  unit?: string | null;
  volume?: string | null;
  height?: string | null;
  diameter?: string | null;
  material?: string | null;
  // Raw JSON specs (advanced; merged with individual spec fields, individual fields take precedence)
  specs?: string | null;
  // Product images → product_images table
  image_1_url?: string | null;
  image_2_url?: string | null;
  image_3_url?: string | null;
  // Bulk discount tiers → product_bulk_discounts table
  tier_1_min_quantity?: string | number | null;
  tier_1_price?: string | number | null;
  tier_2_min_quantity?: string | number | null;
  tier_2_price?: string | number | null;
  tier_3_min_quantity?: string | number | null;
  tier_3_price?: string | number | null;
  tier_4_min_quantity?: string | number | null;
  tier_4_price?: string | number | null;
  // Unsupported legacy fields — presence with values produces warnings, never imported
  wholesale_price?: string | number | null;
  tags?: string | null;
}

export interface ImportRowError {
  row: number;
  field: string;
  value: string;
  message: string;
  suggestion?: string;
}

export interface ImportRowWarning {
  row: number;
  field: string;
  value: string;
  message: string;
}

export interface ImportResult {
  ok: boolean;
  imported?: number;
  slugs?: string[];
  image_count?: number;
  tier_count?: number;
  errors?: ImportRowError[];
  warnings?: ImportRowWarning[];
  error?: string;
}

// ---------------------------------------------------------------------------
// Normalisation helpers
// ---------------------------------------------------------------------------

function normalizeSlug(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const IS_ACTIVE_FALSE = new Set(['false', '0', 'no', 'hidden']);
const IS_ACTIVE_VALID = new Set(['true', '1', 'yes', 'active', 'false', '0', 'no', 'hidden']);

function isEmptyish(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

function isValidIsActive(value: unknown): boolean {
  if (isEmptyish(value)) return true;
  return IS_ACTIVE_VALID.has(String(value).trim().toLowerCase());
}

function parseIsActive(value: unknown): boolean {
  if (isEmptyish(value)) return true;
  return !IS_ACTIVE_FALSE.has(String(value).trim().toLowerCase());
}

function parsePrice(value: unknown): number | null {
  if (isEmptyish(value)) return null;
  const n = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : NaN;
}

function parseStock(value: unknown): number {
  if (isEmptyish(value)) return 0;
  const n = Number(String(value).trim());
  return Number.isFinite(n) && Number.isInteger(n) ? n : NaN;
}

function parseTierQty(value: unknown): number | null {
  if (isEmptyish(value)) return null;
  const n = Number(String(value).trim());
  return Number.isFinite(n) && Number.isInteger(n) ? n : NaN;
}

function parseTierPrice(value: unknown): number | null {
  if (isEmptyish(value)) return null;
  const n = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : NaN;
}

type SpecsResult =
  | { ok: true; value: Record<string, unknown> | null }
  | { ok: false };

function parseSpecs(value: unknown): SpecsResult {
  if (isEmptyish(value)) return { ok: true, value: null };
  try {
    const parsed: unknown = JSON.parse(String(value));
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return { ok: false };
    return { ok: true, value: parsed as Record<string, unknown> };
  } catch {
    return { ok: false };
  }
}

function isValidHttpsUrl(value: unknown): boolean {
  if (isEmptyish(value)) return true;
  return HTTPS_URL_RE.test(String(value).trim());
}

function buildSpecs(row: ImportRow): Record<string, unknown> {
  const base = parseSpecs(row.specs);
  const result: Record<string, unknown> = base.ok && base.value ? { ...base.value } : {};
  // Individual fields take precedence over raw JSON
  if (!isEmptyish(row.unit)) result.unit = String(row.unit).trim();
  if (!isEmptyish(row.volume)) result.volume = String(row.volume).trim();
  if (!isEmptyish(row.height)) result.height = String(row.height).trim();
  if (!isEmptyish(row.diameter)) result.diameter = String(row.diameter).trim();
  if (!isEmptyish(row.material)) result.material = String(row.material).trim();
  return result;
}

interface TierInput {
  min_quantity: unknown;
  price: unknown;
  tierNum: number;
}

function extractTiers(row: ImportRow): TierInput[] {
  return [
    { min_quantity: row.tier_1_min_quantity, price: row.tier_1_price, tierNum: 1 },
    { min_quantity: row.tier_2_min_quantity, price: row.tier_2_price, tierNum: 2 },
    { min_quantity: row.tier_3_min_quantity, price: row.tier_3_price, tierNum: 3 },
    { min_quantity: row.tier_4_min_quantity, price: row.tier_4_price, tierNum: 4 },
  ].filter((t) => !isEmptyish(t.min_quantity) || !isEmptyish(t.price));
}

// ---------------------------------------------------------------------------
// Category lookup type (server-internal)
// ---------------------------------------------------------------------------

interface CategoryInfo {
  id: string;
  slug: string;
  parent_id: string | null;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateImportRows(
  rows: ImportRow[],
  categoryMap: Map<string, CategoryInfo>,
  existingProductSlugs: Set<string>,
): { errors: ImportRowError[]; warnings: ImportRowWarning[] } {
  const errors: ImportRowError[] = [];
  const warnings: ImportRowWarning[] = [];
  const seenSlugs = new Set<string>();

  for (const row of rows) {
    const r = row.row;

    // name
    if (!String(row.name ?? '').trim()) {
      errors.push({ row: r, field: 'name', value: '', message: 'Tên sản phẩm là bắt buộc.' });
    }

    // slug
    const rawSlug = String(row.slug ?? '').trim();
    if (!rawSlug) {
      errors.push({ row: r, field: 'slug', value: '', message: 'Slug là bắt buộc.' });
    } else {
      const slug = normalizeSlug(rawSlug);
      if (!SLUG_RE.test(slug)) {
        errors.push({
          row: r,
          field: 'slug',
          value: rawSlug,
          message: 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang.',
          suggestion: slug.replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '') || undefined,
        });
      } else if (seenSlugs.has(slug)) {
        errors.push({
          row: r,
          field: 'slug',
          value: rawSlug,
          message: `Slug "${slug}" bị trùng lặp trong file.`,
          suggestion: `${slug}-2`,
        });
      } else if (existingProductSlugs.has(slug)) {
        errors.push({
          row: r,
          field: 'slug',
          value: rawSlug,
          message: `Slug "${slug}" đã tồn tại trong cơ sở dữ liệu.`,
          suggestion: `${slug}-new`,
        });
      } else {
        seenSlugs.add(slug);
      }
    }

    // category_slug
    const catSlug = String(row.category_slug ?? '').trim().toLowerCase();
    if (!catSlug) {
      errors.push({ row: r, field: 'category_slug', value: '', message: 'Danh mục là bắt buộc.' });
    } else if (!categoryMap.has(catSlug)) {
      errors.push({
        row: r,
        field: 'category_slug',
        value: catSlug,
        message: `Danh mục "${catSlug}" không tồn tại hoặc đang bị ẩn.`,
        suggestion: 'Kiểm tra lại slug danh mục trong trang quản lý Danh mục.',
      });
    } else if (!isEmptyish(row.parent_category_slug)) {
      const parentSlug = String(row.parent_category_slug).trim().toLowerCase();
      const cat = categoryMap.get(catSlug);
      const parentCat = categoryMap.get(parentSlug);
      if (!parentCat) {
        errors.push({
          row: r,
          field: 'parent_category_slug',
          value: parentSlug,
          message: `Danh mục cha "${parentSlug}" không tồn tại hoặc đang bị ẩn.`,
        });
      } else if (cat && cat.parent_id !== parentCat.id) {
        errors.push({
          row: r,
          field: 'parent_category_slug',
          value: parentSlug,
          message: `"${catSlug}" không phải là danh mục con của "${parentSlug}".`,
          suggestion: 'Bỏ trống cột parent_category_slug hoặc sửa cho đúng quan hệ cha-con.',
        });
      }
    }

    // base_price
    const priceVal = parsePrice(row.base_price);
    if (Number.isNaN(priceVal)) {
      errors.push({
        row: r,
        field: 'base_price',
        value: String(row.base_price),
        message: 'Giá phải là số không âm hoặc để trống.',
        suggestion: 'Ví dụ: 150000',
      });
    } else if (priceVal !== null && priceVal < 0) {
      errors.push({ row: r, field: 'base_price', value: String(row.base_price), message: 'Giá không được âm.' });
    }

    // stock
    const stockVal = parseStock(row.stock);
    if (Number.isNaN(stockVal)) {
      errors.push({
        row: r,
        field: 'stock',
        value: String(row.stock),
        message: 'Tồn kho phải là số nguyên không âm.',
        suggestion: 'Ví dụ: 0 hoặc 100',
      });
    } else if (stockVal < 0) {
      errors.push({ row: r, field: 'stock', value: String(row.stock), message: 'Tồn kho không được âm.' });
    }

    // is_active
    if (!isValidIsActive(row.is_active)) {
      errors.push({
        row: r,
        field: 'is_active',
        value: String(row.is_active),
        message: 'Trạng thái hiển thị không hợp lệ.',
        suggestion: 'Dùng: true/false, 1/0, yes/no, active/hidden (hoặc để trống = hiển thị).',
      });
    }

    // specs raw JSON
    if (!isEmptyish(row.specs) && !parseSpecs(row.specs).ok) {
      errors.push({
        row: r,
        field: 'specs',
        value: String(row.specs).slice(0, 60),
        message: 'specs phải là JSON object hợp lệ hoặc để trống.',
        suggestion: 'Ví dụ: {"dungTich":"500ml","mauSac":"Trắng"}',
      });
    }

    // image URLs
    for (const field of ['image_1_url', 'image_2_url', 'image_3_url'] as const) {
      const val = row[field];
      if (!isEmptyish(val) && !isValidHttpsUrl(val)) {
        errors.push({
          row: r,
          field,
          value: String(val).slice(0, 60),
          message: 'URL ảnh phải bắt đầu bằng https://',
          suggestion: 'Ví dụ: https://cdn.example.com/anh-san-pham.jpg',
        });
      }
    }

    // tier validation
    const tiers = extractTiers(row);
    const seenTierQtys = new Set<number>();
    for (const tier of tiers) {
      const qtyField = `tier_${tier.tierNum}_min_quantity`;
      const priceField = `tier_${tier.tierNum}_price`;

      if (isEmptyish(tier.min_quantity) && !isEmptyish(tier.price)) {
        errors.push({ row: r, field: qtyField, value: '', message: `Bậc ${tier.tierNum}: thiếu số lượng tối thiểu.` });
        continue;
      }
      if (!isEmptyish(tier.min_quantity) && isEmptyish(tier.price)) {
        errors.push({ row: r, field: priceField, value: '', message: `Bậc ${tier.tierNum}: thiếu giá bậc.` });
        continue;
      }

      const qty = parseTierQty(tier.min_quantity);
      const price = parseTierPrice(tier.price);

      if (Number.isNaN(qty) || (qty !== null && qty <= 0)) {
        errors.push({
          row: r,
          field: qtyField,
          value: String(tier.min_quantity),
          message: `Bậc ${tier.tierNum}: số lượng tối thiểu phải là số nguyên dương.`,
          suggestion: 'Ví dụ: 10',
        });
      } else if (qty !== null) {
        if (seenTierQtys.has(qty)) {
          errors.push({
            row: r,
            field: qtyField,
            value: String(tier.min_quantity),
            message: `Bậc ${tier.tierNum}: số lượng ${qty} bị trùng với bậc khác trong cùng sản phẩm.`,
          });
        } else {
          seenTierQtys.add(qty);
        }
      }

      if (Number.isNaN(price) || (price !== null && price < 0)) {
        errors.push({
          row: r,
          field: priceField,
          value: String(tier.price),
          message: `Bậc ${tier.tierNum}: giá bậc phải là số không âm.`,
          suggestion: 'Ví dụ: 120000',
        });
      }
    }

    // Unsupported fields → warnings (never errors, never imported)
    if (!isEmptyish(row.wholesale_price)) {
      warnings.push({
        row: r,
        field: 'wholesale_price',
        value: String(row.wholesale_price).slice(0, 30),
        message: 'wholesale_price không có trong schema và sẽ bị bỏ qua.',
      });
    }
    if (!isEmptyish(row.tags)) {
      warnings.push({
        row: r,
        field: 'tags',
        value: String(row.tags).slice(0, 30),
        message: 'tags chưa được hỗ trợ trong schema và sẽ bị bỏ qua.',
      });
    }
  }

  return { errors, warnings };
}

// ---------------------------------------------------------------------------
// Bulk import (server-only, requires auth)
// ---------------------------------------------------------------------------

export async function bulkImportProducts(
  rows: ImportRow[],
  requestContext?: RequestContext,
): Promise<ImportResult> {
  const adminUser = await requireAdminAuth(PRODUCT_IMPORT_ROLES);
  const supabase = createServiceRoleClient();

  if (!rows || rows.length === 0) {
    return { ok: false, error: 'Không có dữ liệu để nhập.' };
  }

  const [categoriesResult, existingSlugsResult] = await Promise.all([
    supabase.from('categories').select('id, slug, parent_id').eq('is_active', true),
    supabase.from('products').select('slug'),
  ]);

  if (categoriesResult.error) {
    return { ok: false, error: 'Không thể tải danh mục để kiểm tra. Vui lòng thử lại.' };
  }
  if (existingSlugsResult.error) {
    return { ok: false, error: 'Không thể kiểm tra slug hiện có. Vui lòng thử lại.' };
  }

  const categoryMap = new Map<string, CategoryInfo>(
    (categoriesResult.data ?? []).map((c) => [c.slug, { id: c.id, slug: c.slug, parent_id: c.parent_id }]),
  );
  const existingProductSlugs = new Set<string>(
    (existingSlugsResult.data ?? []).map((p) => p.slug),
  );

  const { errors, warnings } = validateImportRows(rows, categoryMap, existingProductSlugs);
  if (errors.length > 0) {
    return { ok: false, errors, warnings: warnings.length > 0 ? warnings : undefined };
  }

  // ── Step 1: Insert products ──────────────────────────────────────────────

  const productInserts: Inserts<'products'>[] = rows.map((row) => {
    const slug = normalizeSlug(row.slug);
    const catSlug = String(row.category_slug).trim().toLowerCase();
    const specsData = buildSpecs(row);
    return {
      name: String(row.name).trim(),
      slug,
      category_id: categoryMap.get(catSlug)?.id ?? null,
      description: row.description ? String(row.description).trim() || null : null,
      price: parsePrice(row.base_price) ?? null,
      stock: parseStock(row.stock) || 0,
      is_active: parseIsActive(row.is_active),
      specs: (Object.keys(specsData).length > 0 ? specsData : {}) as Json,
    };
  });

  const { data: inserted, error: insertError } = await supabase
    .from('products')
    .insert(productInserts)
    .select('id, name, slug');

  if (insertError) {
    if (insertError.code === '23505') {
      return { ok: false, error: 'Một hoặc nhiều slug bị trùng lặp. Vui lòng kiểm tra lại file.' };
    }
    return { ok: false, error: insertError.message };
  }

  const insertedProducts = inserted ?? [];
  const slugToId = new Map<string, string>(insertedProducts.map((p) => [p.slug, p.id]));

  // ── Step 2: Insert product images ────────────────────────────────────────

  const imageInserts: Inserts<'product_images'>[] = [];
  for (const row of rows) {
    const productId = slugToId.get(normalizeSlug(row.slug));
    if (!productId) continue;
    const urls = [row.image_1_url, row.image_2_url, row.image_3_url]
      .map((u) => (isEmptyish(u) ? null : String(u).trim()))
      .filter((u): u is string => u !== null && HTTPS_URL_RE.test(u));
    for (let i = 0; i < urls.length; i++) {
      imageInserts.push({
        product_id: productId,
        // External URL stored as storage_path for imported images (no Supabase Storage upload)
        storage_path: urls[i],
        public_url: urls[i],
        alt: null,
        sort_order: i,
        is_primary: i === 0,
        is_active: true,
      });
    }
  }

  let imageCount = 0;
  if (imageInserts.length > 0) {
    const { data: insertedImages, error: imgErr } = await supabase
      .from('product_images')
      .insert(imageInserts)
      .select('id');
    if (imgErr) {
      // Rollback: delete inserted products (cascade deletes child rows)
      await supabase.from('products').delete().in('id', insertedProducts.map((p) => p.id));
      return { ok: false, error: `Lỗi tạo ảnh sản phẩm: ${imgErr.message}. Toàn bộ import đã bị huỷ.` };
    }
    imageCount = insertedImages?.length ?? 0;
  }

  // ── Step 3: Insert bulk discount tiers ──────────────────────────────────

  const tierInserts: Inserts<'product_bulk_discounts'>[] = [];
  for (const row of rows) {
    const productId = slugToId.get(normalizeSlug(row.slug));
    if (!productId) continue;
    const tiers = extractTiers(row);
    for (const tier of tiers) {
      const qty = parseTierQty(tier.min_quantity);
      const price = parseTierPrice(tier.price);
      if (qty !== null && !Number.isNaN(qty) && qty > 0 && price !== null && !Number.isNaN(price) && price >= 0) {
        tierInserts.push({
          product_id: productId,
          min_quantity: qty,
          price_per_unit: price,
          is_active: true,
        });
      }
    }
  }

  let tierCount = 0;
  if (tierInserts.length > 0) {
    const { data: insertedTiers, error: tierErr } = await supabase
      .from('product_bulk_discounts')
      .insert(tierInserts)
      .select('id');
    if (tierErr) {
      // Rollback
      await supabase.from('products').delete().in('id', insertedProducts.map((p) => p.id));
      return { ok: false, error: `Lỗi tạo bảng giá sỉ: ${tierErr.message}. Toàn bộ import đã bị huỷ.` };
    }
    tierCount = insertedTiers?.length ?? 0;
  }

  // ── Audit log ────────────────────────────────────────────────────────────

  const importedSlugs = insertedProducts.map((p) => p.slug);

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: 'bulk_import',
    entity: 'products',
    entity_id: null,
    metadata: buildAuditMetadata({
      extra: {
        imported_count: insertedProducts.length,
        image_count: imageCount,
        tier_count: tierCount,
        warning_count: warnings.length,
        slugs: importedSlugs,
      },
      requestContext,
    }),
  });

  return {
    ok: true,
    imported: insertedProducts.length,
    slugs: importedSlugs,
    image_count: imageCount,
    tier_count: tierCount,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
