'use server';

import { revalidatePath } from 'next/cache';

import { getRequestContext, buildAuditMetadata } from '@/lib/services/admin/audit-metadata';
import { requireAdminAuth } from '@/lib/services/admin/auth';
import { CONTENT_EDITOR_ROLES } from '@/lib/services/admin/permissions';
import {
  bulkImportProducts,
  validateProductImportRows,
  validateV4Import,
  importV4Upsert,
  type ColumnDef,
  type ImportResult,
  type ImportRow,
  type ImportRowError,
  type ImportRowWarning,
  type ValidationResult,
  type V4ImportRow,
  type V4ValidationResult,
  type V4ImportResult,
} from '@/lib/services/admin/product-import';

export type {
  ColumnDef,
  ImportResult,
  ImportRow,
  ImportRowError,
  ImportRowWarning,
  ValidationResult,
  V4ImportRow,
  V4ValidationResult,
  V4ImportResult,
};

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

// ── V4 Import Actions (delegate to product-import service) ─────────────────────

export async function validateV4ImportAction(rows: V4ImportRow[]): Promise<V4ValidationResult> {
  await requireAdminAuth(CONTENT_EDITOR_ROLES);
  return validateV4Import(rows);
}

export async function importV4UpsertAction(rows: V4ImportRow[], fileName?: string | null): Promise<V4ImportResult> {
  await requireAdminAuth(CONTENT_EDITOR_ROLES);
  const result = await importV4Upsert(rows, fileName);

  if (result.ok) {
    revalidatePath('/admin/products');
    revalidatePath('/admin/dashboard');
    revalidatePath('/danh-muc');
  }

  return result;
}

