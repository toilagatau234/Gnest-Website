import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Inserts, Json } from '@/lib/types/database';
import { requireAdminAuth } from '@/lib/services/admin/auth';
import { getActiveSpecTemplates } from '@/lib/services/admin/product-spec-templates';
import type { RequestContext } from '@/lib/services/admin/audit-metadata';

const PRODUCT_IMPORT_ROLES = ['super_admin', 'admin', 'editor'] as const;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface ImportError {
  row: number;
  column: string;
  message: string;
}

export interface TemplateImportResult {
  ok: boolean;
  importedCount: number;
  errors: ImportError[];
  error?: string;
}

/**
 * Generates core columns + dynamic spec columns for the selected template.
 */
export async function generateTemplateColumns(templateCode: string): Promise<string[]> {
  const coreColumns = ['sku', 'name', 'slug', 'category', 'price'];
  const registry = await getActiveSpecTemplates();
  const template = registry.templates[templateCode];

  if (!template) {
    return coreColumns;
  }

  const specColumns = template.fields.map((field) => {
    if (field.unit) {
      return `spec.${field.key}_${field.unit}`;
    }
    return `spec.${field.key}`;
  });

  return [...coreColumns, ...specColumns];
}

/**
 * Validates a single parsed excel row against core logic and spec template rules.
 */
function validateImportRow(
  row: any,
  rowIndex: number,
  categoryMap: Map<string, string>, // slug/name -> id
  existingSlugs: Set<string>,
  seenSlugs: Set<string>,
  templateFields: any[]
): { errors: ImportError[]; specs: Record<string, any> } {
  const errors: ImportError[] = [];
  const specs: Record<string, any> = {};

  // 1. Core fields validation
  const name = String(row.name || '').trim();
  if (!name) {
    errors.push({ row: rowIndex, column: 'name', message: 'Tên sản phẩm không được để trống.' });
  }

  const rawSlug = String(row.slug || '').trim().toLowerCase();
  if (!rawSlug) {
    errors.push({ row: rowIndex, column: 'slug', message: 'Slug không được để trống.' });
  } else if (!SLUG_RE.test(rawSlug)) {
    errors.push({ row: rowIndex, column: 'slug', message: 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang.' });
  } else if (seenSlugs.has(rawSlug)) {
    errors.push({ row: rowIndex, column: 'slug', message: `Slug "${rawSlug}" bị trùng lặp trong file.` });
  } else if (existingSlugs.has(rawSlug)) {
    errors.push({ row: rowIndex, column: 'slug', message: `Slug "${rawSlug}" đã tồn tại trong hệ thống.` });
  } else {
    seenSlugs.add(rawSlug);
  }

  const categoryInput = String(row.category || '').trim().toLowerCase();
  let categoryId = '';
  if (!categoryInput) {
    errors.push({ row: rowIndex, column: 'category', message: 'Danh mục không được để trống.' });
  } else {
    const matchedId = categoryMap.get(categoryInput);
    if (!matchedId) {
      errors.push({ row: rowIndex, column: 'category', message: `Không tìm thấy danh mục "${row.category}".` });
    } else {
      categoryId = matchedId;
    }
  }

  let price: number | null = null;
  if (row.price !== undefined && row.price !== null && String(row.price).trim() !== '') {
    const numPrice = Number(row.price);
    if (isNaN(numPrice) || numPrice < 0) {
      errors.push({ row: rowIndex, column: 'price', message: 'Giá sản phẩm phải là số không âm.' });
    } else {
      price = numPrice;
    }
  }

  const sku = String(row.sku || '').trim();
  if (sku) {
    specs.sku = sku;
  }

  // 2. Spec Template validation
  for (const field of templateFields) {
    // Check both spec.key and spec.key_unit format in row keys
    const colKeyNoUnit = `spec.${field.key}`;
    const colKeyWithUnit = field.unit ? `spec.${field.key}_${field.unit}` : colKeyNoUnit;

    // Excel object keys can be case-insensitive or have leading/trailing spaces, let's find the best match
    const rowKeys = Object.keys(row);
    const rowKey = rowKeys.find(
      (k) =>
        k.trim().toLowerCase() === colKeyNoUnit.toLowerCase() ||
        k.trim().toLowerCase() === colKeyWithUnit.toLowerCase()
    );

    const rawVal = rowKey !== undefined ? row[rowKey] : undefined;
    const isValEmpty = rawVal === undefined || rawVal === null || String(rawVal).trim() === '';

    if (field.required && isValEmpty) {
      errors.push({
        row: rowIndex,
        column: rowKey || colKeyWithUnit,
        message: `Thông số "${field.label}" là bắt buộc cho mẫu này.`,
      });
      continue;
    }

    if (isValEmpty) {
      continue;
    }

    const strVal = String(rawVal).trim();

    switch (field.type) {
      case 'number': {
        const num = Number(strVal);
        if (isNaN(num) || num < 0) {
          errors.push({
            row: rowIndex,
            column: rowKey || colKeyWithUnit,
            message: `Thông số "${field.label}" phải là số hợp lệ không âm (nhận được: "${strVal}").`,
          });
        } else {
          specs[field.key] = num;
        }
        break;
      }
      case 'boolean': {
        const valLower = strVal.toLowerCase();
        if (['true', 'yes', '1', 'có'].includes(valLower)) {
          specs[field.key] = true;
        } else if (['false', 'no', '0', 'không'].includes(valLower)) {
          specs[field.key] = false;
        } else {
          errors.push({
            row: rowIndex,
            column: rowKey || colKeyWithUnit,
            message: `Thông số "${field.label}" phải là giá trị đúng/sai (true/false, yes/no, có/không).`,
          });
        }
        break;
      }
      case 'select': {
        if (field.options && !field.options.includes(strVal)) {
          errors.push({
            row: rowIndex,
            column: rowKey || colKeyWithUnit,
            message: `Giá trị "${strVal}" không hợp lệ cho "${field.label}". Cho phép: ${field.options.join(', ')}.`,
          });
        } else {
          specs[field.key] = strVal;
        }
        break;
      }
      case 'multi_select': {
        const parts = strVal
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean);
        if (field.options) {
          const invalidParts = parts.filter((p) => !field.options.includes(p));
          if (invalidParts.length > 0) {
            errors.push({
              row: rowIndex,
              column: rowKey || colKeyWithUnit,
              message: `Giá trị "${invalidParts.join(', ')}" không hợp lệ cho "${field.label}". Cho phép: ${field.options.join(', ')}.`,
            });
          } else {
            specs[field.key] = parts.join(', ');
          }
        } else {
          specs[field.key] = parts.join(', ');
        }
        break;
      }
      case 'text':
      case 'textarea':
      default:
        specs[field.key] = strVal;
        break;
    }
  }

  return { errors, specs };
}

/**
 * Validates or imports products from parsed excel data.
 */
export async function importProductsExcel(
  parsedRows: any[],
  templateCode: string,
  dryRun: boolean
): Promise<TemplateImportResult> {
  const adminUser = await requireAdminAuth(PRODUCT_IMPORT_ROLES);
  const supabase = createServiceRoleClient();

  // 1. Fetch active spec templates & fields
  const registry = await getActiveSpecTemplates();
  const template = registry.templates[templateCode];
  if (!template) {
    return { ok: false, importedCount: 0, errors: [], error: `Mẫu thông số "${templateCode}" không tồn tại hoặc không hoạt động.` };
  }

  // 2. Fetch categories and slugs map
  const [categoriesRes, productsRes] = await Promise.all([
    supabase.from('categories').select('id, name, slug').eq('is_active', true),
    supabase.from('products').select('slug'),
  ]);

  if (categoriesRes.error || !categoriesRes.data) {
    return { ok: false, importedCount: 0, errors: [], error: 'Không thể tải danh mục.' };
  }

  const categoryMap = new Map<string, string>();
  categoriesRes.data.forEach((c) => {
    categoryMap.set(c.slug.trim().toLowerCase(), c.id);
    categoryMap.set(c.name.trim().toLowerCase(), c.id);
  });

  const existingSlugs = new Set<string>((productsRes.data || []).map((p) => p.slug.trim().toLowerCase()));
  const seenSlugs = new Set<string>();

  const errors: ImportError[] = [];
  const validProductsToInsert: Inserts<'products'>[] = [];

  // 3. Validation loop
  parsedRows.forEach((row, i) => {
    const rowIndex = i + 2; // Row number starting at 2 (1-indexed + header)
    const { errors: rowErrors, specs } = validateImportRow(
      row,
      rowIndex,
      categoryMap,
      existingSlugs,
      seenSlugs,
      template.fields
    );

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      const categoryInput = String(row.category || '').trim().toLowerCase();
      const categoryId = categoryMap.get(categoryInput) || null;

      // Add template indicator to specs JSON
      specs._template = templateCode;

      validProductsToInsert.push({
        name: String(row.name).trim(),
        slug: String(row.slug).trim().toLowerCase(),
        category_id: categoryId,
        price: row.price !== undefined && row.price !== null && String(row.price).trim() !== '' ? Number(row.price) : null,
        stock: row.stock !== undefined && row.stock !== null && !isNaN(Number(row.stock)) ? Math.max(0, parseInt(row.stock)) : 0,
        specs: specs as Json,
        is_active: true,
      });
    }
  });

  // If dryRun is true, return validation results
  if (dryRun) {
    return {
      ok: errors.length === 0,
      importedCount: 0,
      errors,
    };
  }

  // If not dry-run: Commit Mode
  // If there are errors, skip the invalid rows and insert only valid rows.
  // Wait, if no valid rows to insert, return.
  if (validProductsToInsert.length === 0) {
    return {
      ok: true,
      importedCount: 0,
      errors,
    };
  }

  // Commit transaction-safely
  const { data: inserted, error: insertError } = await supabase
    .from('products')
    .insert(validProductsToInsert)
    .select('id');

  if (insertError) {
    console.error('Error committing imported products:', insertError);
    return {
      ok: false,
      importedCount: 0,
      errors,
      error: insertError.message,
    };
  }

  // Add audit logs
  const { buildAuditMetadata } = await import('@/lib/services/admin/audit-metadata');
  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: 'bulk_import',
    entity: 'products',
    entity_id: null,
    metadata: buildAuditMetadata({
      extra: {
        template: templateCode,
        imported_count: inserted?.length ?? 0,
        skipped_count: errors.length,
      },
    }),
  });

  return {
    ok: true,
    importedCount: inserted?.length ?? 0,
    errors,
  };
}

// ---------------------------------------------------------------------------
// LEGACY IMPORT FUNCTIONS (For backward compatibility with ProductImportDialog)
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
  is_featured?: string | boolean | number | null;
  unit?: string | null;
  volume?: string | null;
  height?: string | null;
  diameter?: string | null;
  material?: string | null;
  specs?: string | null;
  image_1_url?: string | null;
  image_2_url?: string | null;
  image_3_url?: string | null;
  tier_1_min_quantity?: string | number | null;
  tier_1_price?: string | number | null;
  tier_2_min_quantity?: string | number | null;
  tier_2_price?: string | number | null;
  tier_3_min_quantity?: string | number | null;
  tier_3_price?: string | number | null;
  tier_4_min_quantity?: string | number | null;
  tier_4_price?: string | number | null;
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
  tier_count?: number;
  errors?: ImportRowError[];
  warnings?: ImportRowWarning[];
  error?: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: ImportRowError[];
  warnings: ImportRowWarning[];
  validCount: number;
  warningCount: number;
  errorCount: number;
  error?: string;
}

interface CategoryInfo {
  id: string;
  slug: string;
  parent_id: string | null;
}

const IS_ACTIVE_FALSE = new Set(['false', '0', 'no', 'hidden']);
const IS_ACTIVE_VALID = new Set(['true', '1', 'yes', 'active', 'false', '0', 'no', 'hidden']);

function legacyIsEmptyish(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

function legacyIsValidIsActive(value: unknown): boolean {
  if (legacyIsEmptyish(value)) return true;
  return IS_ACTIVE_VALID.has(String(value).trim().toLowerCase());
}

function legacyParseIsActive(value: unknown): boolean {
  if (legacyIsEmptyish(value)) return true;
  return !IS_ACTIVE_FALSE.has(String(value).trim().toLowerCase());
}

function legacyIsValidIsFeatured(value: unknown): boolean {
  if (legacyIsEmptyish(value)) return true;
  return IS_ACTIVE_VALID.has(String(value).trim().toLowerCase());
}

function legacyParseIsFeatured(value: unknown): boolean {
  if (legacyIsEmptyish(value)) return false;
  return !IS_ACTIVE_FALSE.has(String(value).trim().toLowerCase());
}

function legacyParsePrice(value: unknown): number | null {
  if (legacyIsEmptyish(value)) return null;
  const str = String(value).trim();
  if (!str) return null;
  const clean = str.replace(/[\s.,]/g, '');
  if (!/^\d+$/.test(clean)) return NaN;
  const n = Number(clean);
  return Number.isFinite(n) ? n : NaN;
}

function legacyParseStock(value: unknown): number {
  if (legacyIsEmptyish(value)) return 0;
  const n = Number(String(value).trim());
  return Number.isFinite(n) && Number.isInteger(n) ? n : NaN;
}

function legacyParseTierQty(value: unknown): number | null {
  if (legacyIsEmptyish(value)) return null;
  const n = Number(String(value).trim());
  return Number.isFinite(n) && Number.isInteger(n) ? n : NaN;
}

function legacyParseTierPrice(value: unknown): number | null {
  if (legacyIsEmptyish(value)) return null;
  const str = String(value).trim();
  if (!str) return null;
  const clean = str.replace(/[\s.,]/g, '');
  if (!/^\d+$/.test(clean)) return NaN;
  const n = Number(clean);
  return Number.isFinite(n) ? n : NaN;
}

function legacyParseSpecs(value: unknown): { ok: boolean; value: Record<string, unknown> | null } {
  if (legacyIsEmptyish(value)) return { ok: true, value: null };
  try {
    const parsed: unknown = JSON.parse(String(value));
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return { ok: false, value: null };
    return { ok: true, value: parsed as Record<string, unknown> };
  } catch {
    return { ok: false, value: null };
  }
}

function legacyBuildSpecs(row: ImportRow): Record<string, unknown> {
  const base = legacyParseSpecs(row.specs);
  const result: Record<string, unknown> = base.ok && base.value ? { ...base.value } : {};
  if (!legacyIsEmptyish(row.unit)) result.unit = String(row.unit).trim();
  if (!legacyIsEmptyish(row.volume)) result.volume = String(row.volume).trim();
  if (!legacyIsEmptyish(row.height)) result.height = String(row.height).trim();
  if (!legacyIsEmptyish(row.diameter)) result.diameter = String(row.diameter).trim();
  if (!legacyIsEmptyish(row.material)) result.material = String(row.material).trim();
  return result;
}

function legacyExtractTiers(row: ImportRow) {
  return [
    { min_quantity: row.tier_1_min_quantity, price: row.tier_1_price, tierNum: 1 },
    { min_quantity: row.tier_2_min_quantity, price: row.tier_2_price, tierNum: 2 },
    { min_quantity: row.tier_3_min_quantity, price: row.tier_3_price, tierNum: 3 },
    { min_quantity: row.tier_4_min_quantity, price: row.tier_4_price, tierNum: 4 },
  ].filter((t) => !legacyIsEmptyish(t.min_quantity) || !legacyIsEmptyish(t.price));
}

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

    if (!String(row.name ?? '').trim()) {
      errors.push({ row: r, field: 'name', value: '', message: 'Tên sản phẩm là bắt buộc.' });
    }

    const rawSlug = String(row.slug ?? '').trim();
    if (!rawSlug) {
      errors.push({ row: r, field: 'slug', value: '', message: 'Slug là bắt buộc.' });
    } else {
      const slug = rawSlug.trim().toLowerCase().replace(/\s+/g, '-');
      if (!SLUG_RE.test(slug)) {
        errors.push({
          row: r,
          field: 'slug',
          value: rawSlug,
          message: 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang.',
        });
      } else if (seenSlugs.has(slug)) {
        errors.push({
          row: r,
          field: 'slug',
          value: rawSlug,
          message: `Slug "${slug}" bị trùng lặp trong file.`,
        });
      } else if (existingProductSlugs.has(slug)) {
        errors.push({
          row: r,
          field: 'slug',
          value: rawSlug,
          message: `Slug "${slug}" đã tồn tại trong cơ sở dữ liệu.`,
        });
      } else {
        seenSlugs.add(slug);
      }
    }

    const catSlug = String(row.category_slug ?? '').trim().toLowerCase();
    if (!catSlug) {
      errors.push({ row: r, field: 'category_slug', value: '', message: 'Danh mục là bắt buộc.' });
    } else if (!categoryMap.has(catSlug)) {
      errors.push({
        row: r,
        field: 'category_slug',
        value: catSlug,
        message: `Danh mục "${catSlug}" không tồn tại hoặc đang bị ẩn.`,
      });
    }

    const priceVal = legacyParsePrice(row.base_price);
    if (Number.isNaN(priceVal)) {
      errors.push({
        row: r,
        field: 'base_price',
        value: String(row.base_price),
        message: 'Giá phải là số không âm hoặc để trống.',
      });
    }

    const stockVal = legacyParseStock(row.stock);
    if (Number.isNaN(stockVal) || stockVal < 0) {
      errors.push({
        row: r,
        field: 'stock',
        value: String(row.stock),
        message: 'Tồn kho phải là số nguyên không âm.',
      });
    }

    if (!legacyIsValidIsActive(row.is_active)) {
      errors.push({
        row: r,
        field: 'is_active',
        value: String(row.is_active),
        message: 'Trạng thái hiển thị không hợp lệ.',
      });
    }

    if (!legacyIsValidIsFeatured(row.is_featured)) {
      errors.push({
        row: r,
        field: 'is_featured',
        value: String(row.is_featured),
        message: 'Trạng thái nổi bật không hợp lệ.',
      });
    }

    if (!legacyIsEmptyish(row.specs) && !legacyParseSpecs(row.specs).ok) {
      errors.push({
        row: r,
        field: 'specs',
        value: String(row.specs),
        message: 'specs phải là JSON object hợp lệ hoặc để trống.',
      });
    }

    const tiers = legacyExtractTiers(row);
    for (const tier of tiers) {
      if (legacyIsEmptyish(tier.min_quantity) && !legacyIsEmptyish(tier.price)) {
        errors.push({ row: r, field: `tier_${tier.tierNum}_min_quantity`, value: '', message: `Bậc ${tier.tierNum}: thiếu số lượng tối thiểu.` });
      }
    }
  }

  return { errors, warnings };
}

export async function validateProductImportRows(rows: ImportRow[]): Promise<ValidationResult> {
  const EMPTY: ValidationResult = {
    ok: true, errors: [], warnings: [], validCount: 0, warningCount: 0, errorCount: 0,
  };

  try {
    await requireAdminAuth(PRODUCT_IMPORT_ROLES);
    const supabase = createServiceRoleClient();

    const uploadedSlugs = [
      ...new Set(
        rows
          .map((r) => String(r.slug ?? '').trim().toLowerCase().replace(/\s+/g, '-'))
          .filter((s) => SLUG_RE.test(s)),
      ),
    ];

    const [categoriesResult, slugsResult] = await Promise.all([
      supabase.from('categories').select('id, slug, parent_id').eq('is_active', true),
      uploadedSlugs.length > 0
        ? supabase.from('products').select('slug').in('slug', uploadedSlugs)
        : Promise.resolve({ data: [] as { slug: string }[], error: null }),
    ]);

    if (categoriesResult.error || slugsResult.error) {
      return { ...EMPTY, ok: false, error: 'Lỗi kết nối cơ sở dữ liệu.' };
    }

    const categoryMap = new Map<string, CategoryInfo>(
      (categoriesResult.data ?? []).map((c) => [c.slug, { id: c.id, slug: c.slug, parent_id: c.parent_id }]),
    );
    const existingProductSlugs = new Set<string>(
      (slugsResult.data ?? []).map((p) => p.slug),
    );

    const { errors, warnings } = validateImportRows(rows, categoryMap, existingProductSlugs);
    const errorRowSet = new Set(errors.map((e) => e.row));
    const warnRowSet = new Set(warnings.map((w) => w.row));

    return {
      ok: errors.length === 0,
      errors,
      warnings,
      validCount: rows.filter((r) => !errorRowSet.has(r.row)).length,
      warningCount: warnRowSet.size,
      errorCount: errorRowSet.size,
    };
  } catch (err) {
    return {
      ...EMPTY,
      ok: false,
      error: err instanceof Error ? err.message : 'Lỗi kiểm tra dữ liệu.',
    };
  }
}

export async function bulkImportProducts(
  rows: ImportRow[],
  requestContext?: RequestContext,
): Promise<ImportResult> {
  const adminUser = await requireAdminAuth(PRODUCT_IMPORT_ROLES);
  const supabase = createServiceRoleClient();

  const uploadedSlugs = [
    ...new Set(
      rows
        .map((r) => String(r.slug ?? '').trim().toLowerCase().replace(/\s+/g, '-'))
        .filter((s) => SLUG_RE.test(s)),
    ),
  ];

  const [categoriesResult, slugsResult] = await Promise.all([
    supabase.from('categories').select('id, slug, parent_id').eq('is_active', true),
    uploadedSlugs.length > 0
      ? supabase.from('products').select('slug').in('slug', uploadedSlugs)
      : Promise.resolve({ data: [] as { slug: string }[], error: null }),
  ]);

  if (categoriesResult.error || slugsResult.error) {
    return { ok: false, error: 'Lỗi cơ sở dữ liệu.' };
  }

  const categoryMap = new Map<string, CategoryInfo>(
    (categoriesResult.data ?? []).map((c) => [c.slug, { id: c.id, slug: c.slug, parent_id: c.parent_id }]),
  );
  const existingProductSlugs = new Set<string>(
    (slugsResult.data ?? []).map((p) => p.slug),
  );

  const { errors, warnings } = validateImportRows(rows, categoryMap, existingProductSlugs);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const productInserts = rows.map((row) => {
    const slug = String(row.slug ?? '').trim().toLowerCase().replace(/\s+/g, '-');
    const catSlug = String(row.category_slug).trim().toLowerCase();
    const specsData = legacyBuildSpecs(row);
    return {
      name: String(row.name).trim(),
      slug,
      category_id: categoryMap.get(catSlug)?.id ?? null,
      description: row.description ? String(row.description).trim() || null : null,
      price: legacyParsePrice(row.base_price) ?? null,
      stock: legacyParseStock(row.stock) || 0,
      is_active: legacyParseIsActive(row.is_active),
      is_featured: legacyParseIsFeatured(row.is_featured),
      specs: specsData as Json,
    };
  });

  const { data: inserted, error: insertError } = await supabase
    .from('products')
    .insert(productInserts)
    .select('id, name, slug');

  if (insertError) {
    return { ok: false, error: insertError.message };
  }

  const insertedProducts = inserted ?? [];
  const slugToId = new Map<string, string>(insertedProducts.map((p) => [p.slug, p.id]));

  const tierInserts = [];
  for (const row of rows) {
    const productId = slugToId.get(String(row.slug ?? '').trim().toLowerCase().replace(/\s+/g, '-'));
    if (!productId) continue;
    const tiers = legacyExtractTiers(row);
    for (const tier of tiers) {
      const qty = legacyParseTierQty(tier.min_quantity);
      const price = legacyParseTierPrice(tier.price);
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
      await supabase.from('products').delete().in('id', insertedProducts.map((p) => p.id));
      return { ok: false, error: tierErr.message };
    }
    tierCount = insertedTiers?.length ?? 0;
  }

  const { buildAuditMetadata: legacyBuildAuditMetadata } = await import('@/lib/services/admin/audit-metadata');
  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: 'bulk_import',
    entity: 'products',
    entity_id: null,
    metadata: legacyBuildAuditMetadata({
      extra: {
        imported_count: insertedProducts.length,
        tier_count: tierCount,
        warning_count: warnings.length,
      },
      requestContext,
    }),
  });

  return {
    ok: true,
    imported: insertedProducts.length,
    tier_count: tierCount,
  };
}

