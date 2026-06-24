import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/types/database';
import { requireAdminAuth } from '@/lib/services/admin/auth';
import { getActiveSpecTemplates } from '@/lib/services/admin/product-spec-templates';
import { normalizeNumericByUnit } from '@/lib/utils/import-normalizers';
import type { SpecField } from '@/lib/product-spec-templates';

const PRODUCT_IMPORT_ROLES = ['super_admin', 'admin', 'editor'] as const;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Maximum product rows accepted per Excel import. Products are written set-based
 * via a single RPC, and images are uploaded out-of-band one request per file, so
 * this ceiling protects the parse/validate step (and the audit trail) without
 * limiting how many images a single SKU may carry.
 */
export const MAX_IMPORT_ROWS = 2000;

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

// ── V4 IMPORT & VALIDATION SERVICES ───────────────────────────────────────────

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
  /** Import-job id — used by the client to attach uploaded images to this run. */
  jobId: string | null;
  upserted: number;
  inserted: number;
  updated: number;
  tierCount: number;
  /** Images are uploaded client-side (Phase 8/9); always 0 from the upsert call. */
  imageCount: number;
  /** SKU → product UUID, so the client can upload images to the right product. */
  skuToProductId: Record<string, string>;
  error?: string;
}



/**
 * Schema-driven parse/validate of a single spec field value.
 * Normalization (numbers) is driven by the field's declared `unit`, and
 * enum membership is checked against the field's `options` — so new fields
 * and new product types work without code changes.
 */
function parseSpecValue(field: SpecField, rawVal: unknown): { error?: string; value?: unknown } {
  if (rawVal === undefined || rawVal === null || String(rawVal).trim() === '') {
    return { value: null };
  }
  const strVal = String(rawVal).trim();

  switch (field.type) {
    case 'number': {
      const normalized = normalizeNumericByUnit(field.unit, strVal);
      const num = Number(normalized);
      if (isNaN(num) || num < 0) {
        return { error: `phải là số không âm (nhận được: "${strVal}")` };
      }
      return { value: num };
    }
    case 'boolean': {
      const v = strVal.toLowerCase();
      if (['true', 'yes', '1', 'có'].includes(v)) return { value: true };
      if (['false', 'no', '0', 'không'].includes(v)) return { value: false };
      return { error: `phải là Có/Không (nhận được: "${strVal}")` };
    }
    case 'select': {
      if (field.options && field.options.length > 0 && !field.options.includes(strVal)) {
        return { error: `giá trị "${strVal}" không hợp lệ. Cho phép: ${field.options.join(', ')}` };
      }
      return { value: strVal };
    }
    case 'multi_select': {
      const parts = strVal.split(',').map((p) => p.trim()).filter(Boolean);
      if (field.options && field.options.length > 0) {
        const bad = parts.filter((p) => !field.options!.includes(p));
        if (bad.length > 0) {
          return { error: `giá trị "${bad.join(', ')}" không hợp lệ. Cho phép: ${field.options.join(', ')}` };
        }
      }
      return { value: parts.join(', ') };
    }
    default:
      return { value: strVal };
  }
}

/**
 * Builds the normalized specs JSONB for a row. Template-driven fields are parsed/normalized via
 * parseSpecValue; for template-less rows, arbitrary keys are copied as-is (skipping
 * prototype-polluting keys). The active template code is tagged as `_template`.
 */
function normalizeRowSpecs(
  template: { fields: SpecField[] } | undefined,
  specs: Record<string, unknown> | null | undefined,
  templateCode: string,
): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  if (template && specs) {
    for (const field of template.fields) {
      const parsed = parseSpecValue(field, specs[field.key]);
      if (parsed.value !== undefined && parsed.value !== null) {
        normalized[field.key] = parsed.value;
      }
    }
  } else if (specs) {
    for (const [k, v] of Object.entries(specs)) {
      // Skip prototype-polluting keys when copying arbitrary (template-less) spec keys.
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
      if (v !== null && v !== undefined && String(v).trim() !== '') normalized[k] = v;
    }
  }
  if (templateCode) normalized._template = templateCode;
  return normalized;
}

/**
 * Validates Excel V4 rows against the database and template schema rules.
 */
export async function validateV4Import(rows: V4ImportRow[]): Promise<V4ValidationResult> {
  await requireAdminAuth(PRODUCT_IMPORT_ROLES);
  const supabase = createServiceRoleClient();

  const EMPTY: V4ValidationResult = {
    ok: false, errors: [], warnings: [], validCount: 0,
    insertCount: 0, upsertCount: 0, errorCount: 0,
  };

  if (!Array.isArray(rows) || rows.length === 0) {
    return { ...EMPTY, error: 'File không có dữ liệu sản phẩm.' };
  }
  if (rows.length > MAX_IMPORT_ROWS) {
    return { ...EMPTY, error: `Tối đa ${MAX_IMPORT_ROWS} sản phẩm mỗi lần nhập.` };
  }

  try {
    const candidateSlugs = rows
      .map((r) => String(r.slug ?? '').trim().toLowerCase())
      .filter((s) => SLUG_RE.test(s));

    const candidateSkus = rows
      .map((r) => String(r.sku ?? '').trim())
      .filter(Boolean);

    const slugQuery = candidateSlugs.length > 0
      ? supabase.from('products').select('id, slug, sku').in('slug', candidateSlugs)
      : Promise.resolve({ data: [] as { id: string; slug: string; sku: string | null }[] });

    const skuQuery = candidateSkus.length > 0
      ? supabase.from('products').select('id, slug, sku').in('sku', candidateSkus)
      : Promise.resolve({ data: [] as { id: string; slug: string; sku: string | null }[] });

    const [catsResult, slugRes, skuRes] = await Promise.all([
      supabase.from('categories').select('id, slug, name').eq('is_active', true),
      slugQuery,
      skuQuery,
    ]);

    const validCategoryKeys = new Set<string>();
    for (const c of catsResult.data ?? []) {
      validCategoryKeys.add(c.slug.toLowerCase());
      validCategoryKeys.add(c.name.toLowerCase());
    }

    // SKU is the business identity → match existing products by SKU.
    const existingSkuSet = new Set<string>();
    for (const p of skuRes.data ?? []) {
      if (p.sku) existingSkuSet.add(p.sku.trim());
    }
    // slug → its owning SKU, so we can detect "slug belongs to a different product".
    const slugToSku = new Map<string, string | null>();
    for (const p of [...(slugRes.data ?? []), ...(skuRes.data ?? [])]) {
      slugToSku.set(p.slug.toLowerCase(), p.sku?.trim() ?? null);
    }

    const registry = await getActiveSpecTemplates();

    const errors: V4ValidationResult['errors'] = [];
    const warnings: V4ValidationResult['warnings'] = [];
    const seenSlugs = new Set<string>();
    const seenSkus = new Map<string, number>();
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
      } else if (!SLUG_RE.test(slug)) {
        errors.push({ row: rowNum, field: 'slug', message: 'Slug chỉ gồm chữ thường a-z, số 0-9 và dấu gạch ngang.' });
      } else if (seenSlugs.has(slug)) {
        errors.push({ row: rowNum, field: 'slug', message: `Slug "${slug}" bị trùng lặp trong file.` });
      } else {
        seenSlugs.add(slug);
      }

      // ── SKU is REQUIRED (business identity for matching + UPSERT) ──
      const sku = String(row.sku ?? '').trim();
      if (!sku) {
        errors.push({ row: rowNum, field: 'sku', message: 'Mã sản phẩm (SKU) là bắt buộc — đây là định danh để cập nhật/đối chiếu.' });
      } else {
        const skuLower = sku.toLowerCase();
        if (seenSkus.has(skuLower)) {
          errors.push({ row: rowNum, field: 'sku', message: `Mã sản phẩm (SKU) "${sku}" bị trùng lặp trong file (dòng ${seenSkus.get(skuLower)}).` });
        } else {
          seenSkus.set(skuLower, rowNum);
          // Insert vs update is decided by SKU existence, NOT slug.
          if (existingSkuSet.has(sku)) {
            warnings.push({ row: rowNum, field: 'sku', message: `SKU "${sku}" đã tồn tại — sẽ cập nhật (UPSERT theo SKU).` });
            upsertCount++;
          } else {
            insertCount++;
          }
          // Guard: slug already used by a DIFFERENT product (different/empty SKU).
          if (slug && slugToSku.has(slug)) {
            const owner = slugToSku.get(slug);
            if (owner !== sku) {
              errors.push({ row: rowNum, field: 'slug', message: `Slug "${slug}" đã thuộc về sản phẩm khác (SKU "${owner ?? '—'}").` });
            }
          }
        }
      }

      const catInput = String(row.category ?? '').trim().toLowerCase();
      if (catInput && !validCategoryKeys.has(catInput)) {
        errors.push({ row: rowNum, field: 'category', message: `Danh mục "${catInput}" không tồn tại hoặc đang bị ẩn.` });
      }

      const templateCode = String(row.template_code ?? '').trim();
      const template = templateCode ? registry.templates[templateCode] : undefined;
      if (templateCode && !registry.keys.includes(templateCode)) {
        errors.push({ row: rowNum, field: 'template_code', message: `Loại sản phẩm "${templateCode}" không hợp lệ. Cho phép: ${registry.keys.join(', ')}.` });
      }

      // ── Specs: reject UNKNOWN keys (no silent drop) + type/enum check ──
      if (template && row.specs) {
        const allowedKeys = new Set(template.fields.map((f) => f.key));
        for (const specKey of Object.keys(row.specs)) {
          const rawVal = row.specs[specKey];
          const isEmpty = rawVal === undefined || rawVal === null || String(rawVal).trim() === '';
          if (!allowedKeys.has(specKey)) {
            if (!isEmpty) {
              errors.push({ row: rowNum, field: `spec.${specKey}`, message: `Thông số "spec.${specKey}" không thuộc loại sản phẩm "${templateCode}". Thông số hợp lệ: ${[...allowedKeys].join(', ')}.` });
            }
            continue;
          }
        }
        for (const field of template.fields) {
          const rawVal = row.specs[field.key];
          const isEmpty = rawVal === undefined || rawVal === null || String(rawVal).trim() === '';
          if (field.required && isEmpty) {
            errors.push({ row: rowNum, field: `spec.${field.key}`, message: `Thông số "${field.label}" là bắt buộc cho loại sản phẩm này.` });
            continue;
          }
          if (!isEmpty) {
            const parsed = parseSpecValue(field, rawVal);
            if (parsed.error) {
              errors.push({ row: rowNum, field: `spec.${field.key}`, message: `Thông số "${field.label}" ${parsed.error}.` });
            }
          }
        }
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

/**
 * Imports Excel V4 rows into the database using SKU-based UPSERT.
 *
 * Identity rule (Phase 7/8): SKU is the business identity. Matching and
 * upsert happen on `sku` via the upsert_products_by_sku RPC, which preserves
 * existing non-empty fields and JSONB-merges specs (incremental enrichment).
 * Images are uploaded separately from a local folder (Phase 8/9) keyed by SKU —
 * this function returns the opened job id + SKU→product-id map so the client can
 * stream images into Supabase Storage. Every run is recorded in import_jobs /
 * import_job_errors / import_job_images (Phase 11).
 */
export async function importV4Upsert(
  rows: V4ImportRow[],
  fileName?: string | null,
): Promise<V4ImportResult> {
  const adminUser = await requireAdminAuth(PRODUCT_IMPORT_ROLES);
  const supabase = createServiceRoleClient();

  const fail = (error: string, jobId: string | null = null): V4ImportResult => ({
    ok: false, jobId, upserted: 0, inserted: 0, updated: 0,
    tierCount: 0, imageCount: 0, skuToProductId: {}, error,
  });

  if (!Array.isArray(rows) || rows.length === 0) {
    return fail('Không có dữ liệu sản phẩm.');
  }
  if (rows.length > MAX_IMPORT_ROWS) {
    return fail(`Tối đa ${MAX_IMPORT_ROWS} sản phẩm mỗi lần nhập.`);
  }

  // 0. Open an import job (traceability)
  const { data: job } = await supabase
    .from('import_jobs')
    .insert({
      file_name: fileName ?? null,
      started_by: adminUser.id,
      mode: 'v4_upsert',
      status: 'running',
      total_rows: rows.length,
    })
    .select('id')
    .single();
  const jobId = job?.id ?? null;

  const jobErrors: { row_number: number | null; column_name: string | null; error_code: string; error_message: string }[] = [];
  const recordError = (rowNum: number | null, column: string | null, code: string, message: string) =>
    jobErrors.push({ row_number: rowNum, column_name: column, error_code: code, error_message: message });

  // 1. Fetch categories
  const { data: cats } = await supabase.from('categories').select('id, slug, name').eq('is_active', true);
  const catMap = new Map<string, string>();
  for (const c of cats ?? []) {
    catMap.set(c.slug.toLowerCase(), c.id);
    catMap.set(c.name.toLowerCase(), c.id);
  }

  const registry = await getActiveSpecTemplates();

  // 2. Build SKU-keyed payloads (specs normalized schema-driven; unknown keys ignored —
  //    they are blocked upstream by validateV4Import).
  const upsertPayloads: Record<string, unknown>[] = [];
  const tierDataBySku = new Map<string, { price: number; qty: number }[]>();

  for (const row of rows) {
    const rowNum = row.row ?? null;
    const sku = String(row.sku ?? '').trim();
    const slug = String(row.slug ?? '').trim().toLowerCase();
    const name = String(row.name ?? '').trim();
    if (!sku) { recordError(rowNum, 'sku', 'MISSING_SKU', 'Thiếu SKU — bỏ qua dòng.'); continue; }
    if (!slug || !name) { recordError(rowNum, !slug ? 'slug' : 'name', 'MISSING_CORE', 'Thiếu slug hoặc tên — bỏ qua dòng.'); continue; }

    const templateCode = String(row.template_code ?? '').trim();
    const template = templateCode ? registry.templates[templateCode] : undefined;

    const normalizedSpecs = normalizeRowSpecs(template, row.specs, templateCode);

    const catInput = String(row.category ?? '').trim().toLowerCase();
    upsertPayloads.push({
      sku,
      name,
      slug,
      category_id: catInput ? (catMap.get(catInput) ?? null) : null,
      description: String(row.description ?? '').trim() || null,
      price: parsePrice(row.price),
      stock: parseStock(row.stock),
      is_active: parseBoolField(row.is_active, true),
      is_featured: parseBoolField(row.is_featured, false),
      seo_title: String(row.seo_title ?? '').trim() || null,
      seo_description: String(row.seo_description ?? '').trim() || null,
      seo_keywords: String(row.seo_keywords ?? '').trim() || null,
      specs: normalizedSpecs,
    });

    const tiers: { price: number; qty: number }[] = [];
    for (let i = 1; i <= 3; i++) {
      const price = parsePrice((row as Record<string, unknown>)[`tier_${i}_price`]);
      const qty = parsePrice((row as Record<string, unknown>)[`tier_${i}_min_qty`]);
      if (price !== null && qty !== null && qty > 0) tiers.push({ price, qty });
    }
    if (tiers.length > 0) tierDataBySku.set(sku, tiers);
  }

  if (upsertPayloads.length === 0) {
    if (jobId) {
      if (jobErrors.length > 0) await supabase.from('import_job_errors').insert(jobErrors.map((e) => ({ ...e, job_id: jobId })));
      await supabase.from('import_jobs').update({ status: 'failed', error_count: jobErrors.length, finished_at: new Date().toISOString() }).eq('id', jobId);
    }
    return fail('Không có hàng hợp lệ để nhập.', jobId);
  }

  // 3. SKU UPSERT via RPC (set-based; COALESCE-preserve + specs merge)
  const { data: upserted, error: upsertError } = await supabase.rpc('upsert_products_by_sku', {
    p_rows: upsertPayloads as unknown as Json,
  });

  if (upsertError) {
    if (jobId) {
      recordError(null, null, 'DB_UPSERT', upsertError.message);
      await supabase.from('import_job_errors').insert(jobErrors.map((e) => ({ ...e, job_id: jobId })));
      await supabase.from('import_jobs').update({ status: 'failed', error_count: jobErrors.length, finished_at: new Date().toISOString() }).eq('id', jobId);
    }
    return fail(upsertError.message, jobId);
  }

  const upsertedRows = (upserted ?? []) as { id: string; sku: string; slug: string; was_inserted: boolean }[];
  const insertedCount = upsertedRows.filter((p) => p.was_inserted).length;
  const updatedCount = upsertedRows.length - insertedCount;
  const skuToId = new Map(upsertedRows.map((p) => [p.sku, p.id]));

  // 4. Bulk discount tiers (replace per product)
  let tierCount = 0;
  for (const [sku, tiers] of tierDataBySku) {
    const productId = skuToId.get(sku);
    if (!productId) continue;
    await supabase.from('product_bulk_discounts').delete().eq('product_id', productId);
    const { data: ti } = await supabase
      .from('product_bulk_discounts')
      .insert(tiers.map((t) => ({ product_id: productId, min_quantity: t.qty, price_per_unit: t.price, is_active: true })))
      .select('id');
    tierCount += ti?.length ?? 0;
  }

  // 5. Finalize the product portion of the job. Images are uploaded afterwards
  //    by the client (Phase 8/9) and recorded against this same job id, bumping
  //    import_jobs.image_count via recordImportJobImages().
  if (jobId) {
    if (jobErrors.length > 0) await supabase.from('import_job_errors').insert(jobErrors.map((e) => ({ ...e, job_id: jobId })));
    await supabase.from('import_jobs').update({
      status: jobErrors.length > 0 ? 'completed_with_errors' : 'completed',
      success_count: upsertedRows.length,
      error_count: jobErrors.length,
      inserted_count: insertedCount,
      updated_count: updatedCount,
      finished_at: new Date().toISOString(),
    }).eq('id', jobId);
  }

  const { buildAuditMetadata } = await import('@/lib/services/admin/audit-metadata');
  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: 'bulk_upsert_v4',
    entity: 'products',
    entity_id: null,
    metadata: buildAuditMetadata({
      extra: { job_id: jobId, upserted: upsertedRows.length, inserted: insertedCount, updated: updatedCount, tiers: tierCount, errors: jobErrors.length },
    }),
  });

  return {
    ok: true,
    jobId,
    upserted: upsertedRows.length,
    inserted: insertedCount,
    updated: updatedCount,
    tierCount,
    imageCount: 0,
    skuToProductId: Object.fromEntries(skuToId),
  };
}


