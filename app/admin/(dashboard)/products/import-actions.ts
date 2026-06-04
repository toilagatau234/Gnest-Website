'use server';

import { revalidatePath } from 'next/cache';

import { getRequestContext } from '@/lib/services/admin/audit-metadata';
import {
  bulkImportProducts,
  validateProductImportRows,
  type ImportResult,
  type ImportRow,
  type ImportRowError,
  type ImportRowWarning,
  type ValidationResult,
} from '@/lib/services/admin/product-import';

export type { ImportResult, ImportRow, ImportRowError, ImportRowWarning, ValidationResult };

export async function validateProductsImportAction(rows: ImportRow[]): Promise<ValidationResult> {
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
