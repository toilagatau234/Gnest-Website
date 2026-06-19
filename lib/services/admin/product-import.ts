import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Inserts, Json } from '@/lib/types/database';
import { requireAdminAuth } from '@/lib/services/admin/auth';
import { getActiveSpecTemplates } from '@/lib/services/admin/product-spec-templates';
import type { RequestContext } from '@/lib/services/admin/audit-metadata';
import { normalizeNumberField } from '@/lib/utils/import-normalizers';
import { generateProductName } from '@/lib/utils/product-name-generator';
import { importImagesFromDriveFolder, extractDriveFolderId } from '@/lib/services/admin/gdrive-image-import';

const PRODUCT_IMPORT_ROLES = ['super_admin', 'admin', 'editor'] as const;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface ImportError {
  row: number;
  column: string;
  message: string;
}

interface SkuTracker {
  existingSkus: Set<string>;
  seenSkus: Map<string, number>;
}

export interface TemplateImportResult {
  ok: boolean;
  importedCount: number;
  errors: ImportError[];
  driveResults?: { row: number; sku: string | null; imported: number; failed: number; error?: string }[];
  error?: string;
}

// ── Column definition for the new Vietnamese-header import system ────────────

export interface ColumnDef {
  /** Vietnamese header displayed in the Excel template */
  header: string;
  /** Key used when parsing the uploaded Excel row object */
  key: string;
  /** Spec field key (for spec columns only) */
  fieldKey?: string;
  unit?: string;
  required?: boolean;
  type?: string;
}

/** Core columns shared across all product types */
const CORE_COLUMN_DEFS: ColumnDef[] = [
  { header: 'Mã sản phẩm',              key: 'sku',                required: false },
  { header: 'Tên sản phẩm',             key: 'name',               required: false },
  { header: 'Slug',                      key: 'slug',               required: false },
  { header: 'Loại sản phẩm *',          key: 'template_code',      required: true  },
  { header: 'Danh mục',                  key: 'category',           required: false },
  { header: 'Mô tả ngắn',               key: 'description',        required: false },
  { header: 'Trạng thái (Có/Không)',     key: 'is_active',          required: false },
  { header: 'Nổi bật (Có/Không)',        key: 'is_featured',        required: false },
  { header: 'Giá bán',                   key: 'price',              required: false },
  { header: 'Tồn kho',                   key: 'stock',              required: false },
  { header: 'Tiêu đề SEO',              key: 'seo_title',          required: false },
  { header: 'Mô tả SEO',               key: 'seo_description',    required: false },
  { header: 'Từ khóa SEO',              key: 'seo_keywords',       required: false },
  { header: 'Link thư mục ảnh GG Drive', key: 'gdrive_folder_url', required: false },
  { header: 'Tên ảnh đại diện',         key: 'primary_image_name', required: false },
  { header: 'Giá sỉ bậc 1',             key: 'tier_1_price',       required: false },
  { header: 'SL tối thiểu bậc 1',       key: 'tier_1_min_qty',     required: false },
  { header: 'Giá sỉ bậc 2',             key: 'tier_2_price',       required: false },
  { header: 'SL tối thiểu bậc 2',       key: 'tier_2_min_qty',     required: false },
  { header: 'Giá sỉ bậc 3',             key: 'tier_3_price',       required: false },
  { header: 'SL tối thiểu bậc 3',       key: 'tier_3_min_qty',     required: false },
];

/**
 * Returns core columns + template-specific spec columns with Vietnamese headers.
 * Replaces the old generateTemplateColumns() which returned English keys.
 */
export async function generateTemplateColumns(templateCode: string): Promise<ColumnDef[]> {
  const registry = await getActiveSpecTemplates();
  const template = registry.templates[templateCode];

  if (!template) {
    return CORE_COLUMN_DEFS;
  }

  const specColumns: ColumnDef[] = template.fields.map((field) => {
    const unitLabel = field.unit ? ` (${field.unit})` : '';
    const requiredMark = field.required ? ' *' : '';
    return {
      header: `${field.label}${unitLabel}${requiredMark}`,
      key: `spec.${field.key}`,
      fieldKey: field.key,
      unit: field.unit,
      required: field.required,
      type: field.type,
    };
  });

  return [...CORE_COLUMN_DEFS, ...specColumns];
}

// ── Row parsing helpers ──────────────────────────────────────────────────────

function parseBoolField(raw: unknown, fallback: boolean): boolean {
  if (raw === null || raw === undefined || String(raw).trim() === '') return fallback;
  const v = String(raw).trim().toLowerCase();
  return !['false', '0', 'no', 'không', 'hidden'].includes(v);
}

function parsePrice(raw: unknown): number | null {
  if (raw === null || raw === undefined || String(raw).trim() === '') return null;
  const cleaned = String(raw).replace(/[\s,]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function parseStock(raw: unknown): number {
  if (raw === null || raw === undefined || String(raw).trim() === '') return 0;
  const n = parseInt(String(raw).trim(), 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

// ── New-system row validator (per-row) ───────────────────────────────────────

interface ValidatedRow {
  sku: string | null;
  name: string;
  slug: string;
  template_code: string;
  category_id: string | null;
  description: string | null;
  is_active: boolean;
  is_featured: boolean;
  price: number | null;
  stock: number;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  gdrive_folder_url: string | null;
  primary_image_name: string | null;
  tier_1_price: number | null;
  tier_1_min_qty: number | null;
  tier_2_price: number | null;
  tier_2_min_qty: number | null;
  tier_3_price: number | null;
  tier_3_min_qty: number | null;
  specs: Record<string, unknown>;
}

function validateNewImportRow(
  row: Record<string, unknown>,
  rowIndex: number,
  categoryMap: Map<string, string>,
  existingSlugs: Set<string>,
  seenSlugs: Set<string>,
  skuTracker: SkuTracker,
  activeTemplateKeys: string[],
  columnDefs: ColumnDef[],
  nameTemplate: string | null | undefined,
): { errors: ImportError[]; validated?: ValidatedRow } {
  const errors: ImportError[] = [];

  // ── template_code ──────────────────────────────────────────────
  const rawTemplate = String(row['template_code'] ?? row['Loại sản phẩm *'] ?? '').trim();
  if (!rawTemplate) {
    errors.push({ row: rowIndex, column: 'Loại sản phẩm *', message: 'Loại sản phẩm không được để trống.' });
  } else if (!activeTemplateKeys.includes(rawTemplate)) {
    errors.push({ row: rowIndex, column: 'Loại sản phẩm *', message: `Loại sản phẩm "${rawTemplate}" không hợp lệ. Cho phép: ${activeTemplateKeys.join(', ')}.` });
  }

  // ── SKU ───────────────────────────────────────────────────────
  const sku = String(row['sku'] ?? row['Mã sản phẩm'] ?? '').trim() || null;
  if (sku) {
    if (skuTracker.seenSkus.has(sku)) {
      errors.push({ row: rowIndex, column: 'Mã sản phẩm', message: `SKU "${sku}" bị trùng lặp trong file (dòng ${skuTracker.seenSkus.get(sku)}).` });
    } else if (skuTracker.existingSkus.has(sku)) {
      errors.push({ row: rowIndex, column: 'Mã sản phẩm', message: `SKU "${sku}" đã tồn tại trong hệ thống.` });
    } else {
      skuTracker.seenSkus.set(sku, rowIndex);
    }
  }

  // ── Spec fields ────────────────────────────────────────────────
  const specs: Record<string, unknown> = {};
  const specDefs = columnDefs.filter((c) => c.fieldKey);

  for (const col of specDefs) {
    // Find value by header (Vietnamese) or by key (spec.fieldKey)
    let rawVal = row[col.header] ?? row[col.key];
    const isValEmpty = rawVal === undefined || rawVal === null || String(rawVal).trim() === '';

    if (col.required && isValEmpty) {
      errors.push({ row: rowIndex, column: col.header, message: `"${col.header}" là bắt buộc cho loại sản phẩm này.` });
      continue;
    }
    if (isValEmpty) continue;

    let strVal = String(rawVal).trim();

    switch (col.type) {
      case 'number': {
        // Normalize first (handles "100ml", "Phi 53", "100 gram", etc.)
        const normalized = normalizeNumberField(col.fieldKey!, strVal);
        const num = Number(normalized);
        if (isNaN(num) || num < 0) {
          errors.push({ row: rowIndex, column: col.header, message: `"${col.header}" phải là số không âm (nhận được: "${strVal}").` });
        } else {
          specs[col.fieldKey!] = num;
        }
        break;
      }
      case 'boolean': {
        const v = strVal.toLowerCase();
        if (['true', 'yes', '1', 'có'].includes(v)) {
          specs[col.fieldKey!] = true;
        } else if (['false', 'no', '0', 'không'].includes(v)) {
          specs[col.fieldKey!] = false;
        } else {
          errors.push({ row: rowIndex, column: col.header, message: `"${col.header}" phải là Có/Không (nhận được: "${strVal}").` });
        }
        break;
      }
      case 'select': {
        // Allow matching by trimmed string, case-insensitive partial
        specs[col.fieldKey!] = strVal;
        break;
      }
      case 'multi_select': {
        const parts = strVal.split(',').map((p) => p.trim()).filter(Boolean);
        specs[col.fieldKey!] = parts.join(', ');
        break;
      }
      default:
        specs[col.fieldKey!] = strVal;
    }
  }

  // ── Slug (optional — auto-derive from SKU if blank) ────────────
  let slug = String(row['slug'] ?? row['Slug'] ?? '').trim().toLowerCase();
  if (!slug && sku) {
    slug = sku.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }
  if (!slug) {
    errors.push({ row: rowIndex, column: 'Slug', message: 'Slug không được để trống và không thể tự sinh từ Mã sản phẩm.' });
  } else if (!SLUG_RE.test(slug)) {
    errors.push({ row: rowIndex, column: 'Slug', message: 'Slug chỉ được chứa chữ thường a-z, số 0-9 và dấu gạch ngang.' });
  } else if (seenSlugs.has(slug)) {
    errors.push({ row: rowIndex, column: 'Slug', message: `Slug "${slug}" bị trùng lặp trong file.` });
  } else if (existingSlugs.has(slug)) {
    errors.push({ row: rowIndex, column: 'Slug', message: `Slug "${slug}" đã tồn tại trong hệ thống.` });
  } else {
    seenSlugs.add(slug);
  }

  // ── Name (optional — auto-generate if blank) ───────────────────
  let name = String(row['name'] ?? row['Tên sản phẩm'] ?? '').trim();
  if (!name && nameTemplate) {
    name = generateProductName(nameTemplate, specs) ?? '';
  }
  if (!name) {
    errors.push({ row: rowIndex, column: 'Tên sản phẩm', message: 'Tên sản phẩm không được để trống và không thể tự sinh từ thông số kỹ thuật.' });
  }

  // ── Category (optional) ────────────────────────────────────────
  const categoryInput = String(row['category'] ?? row['Danh mục'] ?? '').trim().toLowerCase();
  const category_id = categoryInput ? (categoryMap.get(categoryInput) ?? null) : null;
  if (categoryInput && !category_id) {
    errors.push({ row: rowIndex, column: 'Danh mục', message: `Không tìm thấy danh mục "${categoryInput}".` });
  }

  // ── Price ─────────────────────────────────────────────────────
  const priceRaw = row['price'] ?? row['Giá bán'];
  const price = parsePrice(priceRaw);
  if (priceRaw !== undefined && priceRaw !== null && String(priceRaw).trim() !== '' && price === null) {
    errors.push({ row: rowIndex, column: 'Giá bán', message: 'Giá bán phải là số không âm.' });
  }

  // ── Google Drive URL validation ────────────────────────────────
  const gdrive_folder_url = String(row['gdrive_folder_url'] ?? row['Link thư mục ảnh GG Drive'] ?? '').trim() || null;
  if (gdrive_folder_url && !extractDriveFolderId(gdrive_folder_url)) {
    errors.push({ row: rowIndex, column: 'Link thư mục ảnh GG Drive', message: `URL Google Drive không hợp lệ: "${gdrive_folder_url}".` });
  }

  if (errors.length > 0) {
    return { errors };
  }

  return {
    errors: [],
    validated: {
      sku,
      name,
      slug,
      template_code: rawTemplate,
      category_id,
      description: String(row['description'] ?? row['Mô tả ngắn'] ?? '').trim() || null,
      is_active: parseBoolField(row['is_active'] ?? row['Trạng thái (Có/Không)'], true),
      is_featured: parseBoolField(row['is_featured'] ?? row['Nổi bật (Có/Không)'], false),
      price,
      stock: parseStock(row['stock'] ?? row['Tồn kho']),
      seo_title: String(row['seo_title'] ?? row['Tiêu đề SEO'] ?? '').trim() || null,
      seo_description: String(row['seo_description'] ?? row['Mô tả SEO'] ?? '').trim() || null,
      seo_keywords: String(row['seo_keywords'] ?? row['Từ khóa SEO'] ?? '').trim() || null,
      gdrive_folder_url,
      primary_image_name: String(row['primary_image_name'] ?? row['Tên ảnh đại diện'] ?? '').trim() || null,
      tier_1_price: parsePrice(row['tier_1_price'] ?? row['Giá sỉ bậc 1']),
      tier_1_min_qty: parseStock(row['tier_1_min_qty'] ?? row['SL tối thiểu bậc 1']) || null,
      tier_2_price: parsePrice(row['tier_2_price'] ?? row['Giá sỉ bậc 2']),
      tier_2_min_qty: parseStock(row['tier_2_min_qty'] ?? row['SL tối thiểu bậc 2']) || null,
      tier_3_price: parsePrice(row['tier_3_price'] ?? row['Giá sỉ bậc 3']),
      tier_3_min_qty: parseStock(row['tier_3_min_qty'] ?? row['SL tối thiểu bậc 3']) || null,
      specs,
    },
  };
}

// ── New import function ──────────────────────────────────────────────────────

/**
 * Validates or imports products from parsed Excel data.
 * Handles all new columns: sku, seo_*, bulk discount tiers, GDrive image import,
 * and auto-generates product names from the template name_template when blank.
 */
export async function importProductsExcel(
  parsedRows: Record<string, unknown>[],
  templateCode: string,
  dryRun: boolean,
): Promise<TemplateImportResult> {
  const adminUser = await requireAdminAuth(PRODUCT_IMPORT_ROLES);
  const supabase = createServiceRoleClient();

  // 1. Load registry + template
  const registry = await getActiveSpecTemplates();
  const template = registry.templates[templateCode];
  if (!template) {
    return { ok: false, importedCount: 0, errors: [], error: `Loại sản phẩm "${templateCode}" không tồn tại hoặc không hoạt động.` };
  }

  // 2. Build ColumnDef list (needed for spec field lookup)
  const columnDefs = await generateTemplateColumns(templateCode);

  // 3. Fetch categories and existing product data
  const [categoriesRes, productsRes] = await Promise.all([
    supabase.from('categories').select('id, name, slug').eq('is_active', true),
    supabase.from('products').select('slug, sku'),
  ]);

  if (categoriesRes.error || !categoriesRes.data) {
    return { ok: false, importedCount: 0, errors: [], error: 'Không thể tải danh mục.' };
  }

  const categoryMap = new Map<string, string>();
  for (const c of categoriesRes.data) {
    categoryMap.set(c.slug.trim().toLowerCase(), c.id);
    categoryMap.set(c.name.trim().toLowerCase(), c.id);
  }

  const existingSlugs = new Set<string>((productsRes.data ?? []).map((p) => p.slug.trim().toLowerCase()));
  const seenSlugs = new Set<string>();

  // Deduplication uses the dedicated sku column (not specs.sku)
  const existingSkus = new Set<string>(
    (productsRes.data ?? [])
      .filter((p) => p.sku)
      .map((p) => String(p.sku).trim()),
  );
  const skuTracker: SkuTracker = { existingSkus, seenSkus: new Map() };

  const errors: ImportError[] = [];
  const validRows: ValidatedRow[] = [];
  const validRowIndices: number[] = [];

  // 4. Validate all rows
  for (let i = 0; i < parsedRows.length; i++) {
    const rowIndex = i + 2;
    const { errors: rowErrors, validated } = validateNewImportRow(
      parsedRows[i],
      rowIndex,
      categoryMap,
      existingSlugs,
      seenSlugs,
      skuTracker,
      registry.keys,
      columnDefs,
      template.nameTemplate,
    );
    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else if (validated) {
      validRows.push(validated);
      validRowIndices.push(rowIndex);
    }
  }

  if (dryRun) {
    return { ok: errors.length === 0, importedCount: 0, errors };
  }

  if (validRows.length === 0) {
    return { ok: true, importedCount: 0, errors };
  }

  // 5. Insert products
  const inserts: Inserts<'products'>[] = validRows.map((r) => ({
    sku: r.sku,
    name: r.name,
    slug: r.slug,
    category_id: r.category_id,
    description: r.description,
    price: r.price,
    stock: r.stock,
    is_active: r.is_active,
    is_featured: r.is_featured,
    seo_title: r.seo_title,
    seo_description: r.seo_description,
    seo_keywords: r.seo_keywords,
    specs: { ...r.specs, _template: r.template_code } as Json,
  }));

  const { data: inserted, error: insertError } = await supabase
    .from('products')
    .insert(inserts)
    .select('id, slug, sku');

  if (insertError) {
    return { ok: false, importedCount: 0, errors, error: insertError.message };
  }

  const insertedProducts = inserted ?? [];
  const slugToProduct = new Map(insertedProducts.map((p) => [p.slug, p]));

  // 6. Insert bulk discount tiers
  const tierInserts: Inserts<'product_bulk_discounts'>[] = [];
  for (const r of validRows) {
    const product = slugToProduct.get(r.slug);
    if (!product) continue;
    const tiers = [
      { price: r.tier_1_price, qty: r.tier_1_min_qty },
      { price: r.tier_2_price, qty: r.tier_2_min_qty },
      { price: r.tier_3_price, qty: r.tier_3_min_qty },
    ];
    for (const tier of tiers) {
      if (tier.price !== null && tier.qty !== null && tier.qty > 0) {
        tierInserts.push({ product_id: product.id, min_quantity: tier.qty, price_per_unit: tier.price, is_active: true });
      }
    }
  }
  if (tierInserts.length > 0) {
    await supabase.from('product_bulk_discounts').insert(tierInserts);
  }

  // 7. Google Drive image import (serial per product)
  const driveResults: TemplateImportResult['driveResults'] = [];
  for (const r of validRows) {
    if (!r.gdrive_folder_url) continue;
    const product = slugToProduct.get(r.slug);
    if (!product) continue;

    const driveResult = await importImagesFromDriveFolder(
      product.id,
      product.sku ?? null,
      r.gdrive_folder_url,
      r.primary_image_name,
    );

    driveResults.push({
      row: validRowIndices[validRows.indexOf(r)],
      sku: product.sku ?? null,
      imported: driveResult.imported,
      failed: driveResult.failed.length,
      error: driveResult.error,
    });
  }

  // 8. Audit log
  const { buildAuditMetadata } = await import('@/lib/services/admin/audit-metadata');
  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: 'bulk_import',
    entity: 'products',
    entity_id: null,
    metadata: buildAuditMetadata({
      extra: {
        template: templateCode,
        imported_count: insertedProducts.length,
        skipped_count: errors.length,
        drive_imports: driveResults.length,
      },
    }),
  });

  return {
    ok: true,
    importedCount: insertedProducts.length,
    errors,
    driveResults: driveResults.length > 0 ? driveResults : undefined,
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

