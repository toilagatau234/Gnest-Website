import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Inserts, Json } from '@/lib/types/database';
import { requireAdminAuth } from '@/lib/services/admin/auth';

const PRODUCT_IMPORT_ROLES = ['super_admin', 'admin', 'editor'] as const;

export interface ImportRow {
  row: number;
  name: string;
  slug: string;
  category_slug: string;
  description?: string | null;
  price?: string | number | null;
  stock?: string | number | null;
  is_active?: string | boolean | number | null;
  specs?: string | null;
}

export interface ImportRowError {
  row: number;
  field: string;
  value: string;
  message: string;
  suggestion?: string;
}

export interface ImportResult {
  ok: boolean;
  imported?: number;
  slugs?: string[];
  errors?: ImportRowError[];
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

function parseIsActive(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return true;
  const s = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'active'].includes(s)) return true;
  if (['false', '0', 'no', 'hidden'].includes(s)) return false;
  return true;
}

function parsePrice(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : NaN;
}

function parseStock(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  const n = Number(String(value).trim());
  return Number.isFinite(n) && Number.isInteger(n) ? n : NaN;
}

function parseSpecs(value: unknown): object | null {
  if (value === null || value === undefined || value === '') return null;
  try {
    const parsed = JSON.parse(String(value));
    if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) return undefined as unknown as null;
    return parsed;
  } catch {
    return undefined as unknown as null;
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateImportRows(
  rows: ImportRow[],
  activeCategorySlugs: Set<string>,
  existingProductSlugs: Set<string>,
): ImportRowError[] {
  const errors: ImportRowError[] = [];
  const seenSlugs = new Set<string>();

  for (const row of rows) {
    const r = row.row;

    // name
    const name = String(row.name ?? '').trim();
    if (!name) {
      errors.push({ row: r, field: 'name', value: '', message: 'Tên sản phẩm là bắt buộc.' });
    }

    // slug
    const rawSlug = String(row.slug ?? '').trim();
    if (!rawSlug) {
      errors.push({ row: r, field: 'slug', value: rawSlug, message: 'Slug là bắt buộc.' });
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
      errors.push({ row: r, field: 'category_slug', value: catSlug, message: 'Danh mục là bắt buộc.' });
    } else if (!activeCategorySlugs.has(catSlug)) {
      errors.push({
        row: r,
        field: 'category_slug',
        value: catSlug,
        message: `Danh mục "${catSlug}" không tồn tại hoặc đang bị ẩn.`,
        suggestion: `Kiểm tra lại slug danh mục trong trang quản lý Danh mục.`,
      });
    }

    // price
    const priceVal = parsePrice(row.price);
    if (Number.isNaN(priceVal)) {
      errors.push({
        row: r,
        field: 'price',
        value: String(row.price),
        message: 'Giá phải là số không âm hoặc để trống.',
        suggestion: 'Ví dụ: 150000',
      });
    } else if (priceVal !== null && priceVal < 0) {
      errors.push({
        row: r,
        field: 'price',
        value: String(row.price),
        message: 'Giá không được âm.',
      });
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
      errors.push({
        row: r,
        field: 'stock',
        value: String(row.stock),
        message: 'Tồn kho không được âm.',
      });
    }

    // specs
    if (row.specs !== null && row.specs !== undefined && row.specs !== '') {
      const specsVal = parseSpecs(row.specs);
      if (specsVal === undefined) {
        errors.push({
          row: r,
          field: 'specs',
          value: String(row.specs).slice(0, 60),
          message: 'Specs phải là JSON object hợp lệ hoặc để trống.',
          suggestion: 'Ví dụ: {"dungTich":"500ml","mauSac":"Trắng"}',
        });
      }
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Bulk import (server-only, requires auth)
// ---------------------------------------------------------------------------

export async function bulkImportProducts(rows: ImportRow[]): Promise<ImportResult> {
  const adminUser = await requireAdminAuth(PRODUCT_IMPORT_ROLES);
  const supabase = createServiceRoleClient();

  if (!rows || rows.length === 0) {
    return { ok: false, error: 'Không có dữ liệu để nhập.' };
  }

  // Load reference data for validation
  const [{ data: categories }, { data: existingSlugs }] = await Promise.all([
    supabase.from('categories').select('id, slug').eq('is_active', true),
    supabase.from('products').select('slug'),
  ]);

  const activeCategoryMap = new Map<string, string>(
    (categories ?? []).map((c) => [c.slug, c.id]),
  );
  const existingProductSlugs = new Set<string>((existingSlugs ?? []).map((p) => p.slug));

  const errors = validateImportRows(rows, new Set(activeCategoryMap.keys()), existingProductSlugs);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  // Build insert payloads
  const inserts: Inserts<'products'>[] = rows.map((row) => {
    const slug = normalizeSlug(row.slug);
    const catSlug = String(row.category_slug).trim().toLowerCase();
    return {
      name: String(row.name).trim(),
      slug,
      category_id: activeCategoryMap.get(catSlug) ?? null,
      description: row.description ? String(row.description).trim() || null : null,
      price: parsePrice(row.price) ?? null,
      stock: parseStock(row.stock) || 0,
      is_active: parseIsActive(row.is_active),
      specs: (parseSpecs(row.specs) ?? {}) as Json,
    };
  });

  const { data: inserted, error } = await supabase
    .from('products')
    .insert(inserts)
    .select('id, name, slug');

  if (error) {
    if (error.code === '23505') {
      return { ok: false, error: 'Một hoặc nhiều slug bị trùng lặp. Vui lòng kiểm tra lại file.' };
    }
    return { ok: false, error: error.message };
  }

  const importedSlugs = (inserted ?? []).map((p) => p.slug);

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: 'bulk_import',
    entity: 'products',
    entity_id: null,
    metadata: {
      imported_count: inserted?.length ?? 0,
      slugs: importedSlugs,
    },
  });

  return { ok: true, imported: inserted?.length ?? 0, slugs: importedSlugs };
}
