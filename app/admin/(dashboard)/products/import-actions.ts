'use server';

import { revalidatePath } from 'next/cache';

import { bulkImportProducts, type ImportResult, type ImportRow } from '@/lib/services/admin/product-import';

export type { ImportResult, ImportRow };

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

  const result = await bulkImportProducts(rows);

  if (result.ok) {
    revalidatePath('/admin/products');
    revalidatePath('/admin/dashboard');
    revalidatePath('/danh-muc');
  }

  return result;
}
