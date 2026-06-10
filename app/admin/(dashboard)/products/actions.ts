'use server';

import { revalidatePath } from 'next/cache';
import {
  createAdminProduct,
  deleteAdminProduct,
  getAdminProductDetail,
  setAdminProductActive,
  updateAdminProduct,
  type AdminProduct,
  type ProductPayload,
} from '@/lib/services/admin/products';
import { getRequestContext } from '@/lib/services/admin/audit-metadata';
import { requireAdminAuth } from '@/lib/services/admin/auth';
import { CONTENT_EDITOR_ROLES } from '@/lib/services/admin/permissions';
import type { Json } from '@/lib/types/database';
import { validateSpecs, type TemplateRegistry } from '@/lib/product-spec-templates';
import { getActiveSpecTemplates } from '@/lib/services/admin/product-spec-templates';

export type AdminFormState = { ok: boolean; error?: string; productId?: string };

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function readBoolean(formData: FormData, key: string) {
  return formData.get(key) === 'on' || formData.get(key) === 'true';
}

function parseNumber(value: string) {
  if (!value) {
    return null;
  }

  const clean = value.replace(/\D/g, '');
  if (!clean) {
    return null;
  }

  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseSpecs(value: string, registry: TemplateRegistry): Json {
  if (!value) return {};

  // Step 1: parse JSON — give a clear syntax error.
  let parsed: Json;
  try {
    parsed = JSON.parse(value) as Json;
  } catch {
    throw new Error('Specs không đúng định dạng JSON. Ví dụ: {"dungTich":"500ml"}');
  }

  // Step 2: must be a plain object.
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Specs phải là object JSON, không phải mảng hay giá trị đơn.');
  }

  // Step 3: template-aware field validation against the active DB registry.
  validateSpecs(parsed as Record<string, unknown>, registry);

  return parsed;
}


async function readProductPayload(formData: FormData, registry: TemplateRegistry): Promise<ProductPayload> {
  const name = readString(formData, 'name');
  const slug = readString(formData, 'slug');
  const categoryId = readString(formData, 'category_id');
  const price = parseNumber(readString(formData, 'price'));
  const stock = Number(readString(formData, 'stock') || 0);
  const isFeatured = readBoolean(formData, 'is_featured');

  if (!name) {
    throw new Error('Tên sản phẩm là bắt buộc.');
  }

  if (!slug) {
    throw new Error('Slug sản phẩm là bắt buộc.');
  }

  if (!Number.isFinite(stock) || stock < 0) {
    throw new Error('Tồn kho phải là số không âm.');
  }

  return {
    category_id: categoryId || null,
    name,
    slug,
    description: readString(formData, 'description') || null,
    price,
    stock,
    specs: parseSpecs(readString(formData, 'specs'), registry),
    is_active: readBoolean(formData, 'is_active'),
    is_featured: isFeatured,
  };
}

export async function createProductAction(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdminAuth(CONTENT_EDITOR_ROLES);
  try {
    const activeRegistry = await getActiveSpecTemplates();
    const payload = await readProductPayload(formData, activeRegistry);
    const requestContext = await getRequestContext();
    const { data, error } = await createAdminProduct(payload, requestContext);

    if (error) return { ok: false, error };
    if (!data?.id) return { ok: false, error: 'Không thể xác định sản phẩm vừa tạo.' };

    revalidatePath('/admin/products');
    revalidatePath('/admin/dashboard');
    revalidatePath('/danh-muc');
    return { ok: true, productId: data.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Không thể tạo sản phẩm.' };
  }
}

export async function updateProductAction(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdminAuth(CONTENT_EDITOR_ROLES);
  try {
    const productId = readString(formData, 'id');

    if (!productId) {
      return { ok: false, error: 'Thiếu ID sản phẩm.' };
    }

    const activeRegistry = await getActiveSpecTemplates();
    const payload = await readProductPayload(formData, activeRegistry);
    const requestContext = await getRequestContext();
    const { error } = await updateAdminProduct(productId, payload, requestContext);

    if (error) {
      return { ok: false, error };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Không thể cập nhật sản phẩm.' };
  }

  revalidatePath('/admin/products');
  revalidatePath('/admin/dashboard');
  revalidatePath('/danh-muc');
  return { ok: true };
}

export async function deleteProductAction(productId: string): Promise<AdminFormState> {
  await requireAdminAuth(CONTENT_EDITOR_ROLES);

  if (!productId) {
    return { ok: false, error: 'Thiếu ID sản phẩm.' };
  }

  try {
    const requestContext = await getRequestContext();
    const { error } = await deleteAdminProduct(productId, requestContext);

    if (error) {
      return { ok: false, error };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Không thể xóa sản phẩm.' };
  }

  revalidatePath('/admin/products');
  revalidatePath('/admin/dashboard');
  revalidatePath('/danh-muc');
  return { ok: true };
}

export async function fetchProductDetailAction(productId: string): Promise<{ data: AdminProduct | null; error: string | null }> {
  return getAdminProductDetail(productId);
}

export async function toggleProductActiveAction(formData: FormData) {
  await requireAdminAuth(CONTENT_EDITOR_ROLES);

  const productId = readString(formData, 'id');
  const isActive = readString(formData, 'next_is_active') === 'true';

  if (!productId) {
    throw new Error('Thiếu ID sản phẩm.');
  }

  const requestContext = await getRequestContext();
  const { error } = await setAdminProductActive(productId, isActive, requestContext);

  if (error) {
    throw new Error(error);
  }

  revalidatePath('/admin/products');
  revalidatePath('/admin/dashboard');
  revalidatePath('/danh-muc');
}

// ---------------------------------------------------------------------------
// Bulk create (manual table)
// ---------------------------------------------------------------------------

export type BulkRowPayload = {
  clientId: string;
  name: string;
  slug: string;
  category_id: string | null;
  price: number | null;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  description: string | null;
};

export type BulkRowResult = {
  clientId: string;
  ok: boolean;
  productId?: string;
  error?: string;
};

const MAX_BULK_ROWS = 50;

export async function bulkCreateProductsAction(rows: BulkRowPayload[]): Promise<BulkRowResult[]> {
  await requireAdminAuth(CONTENT_EDITOR_ROLES);

  if (!Array.isArray(rows) || rows.length === 0 || rows.length > MAX_BULK_ROWS) {
    return [{ clientId: '', ok: false, error: `Tối đa ${MAX_BULK_ROWS} sản phẩm mỗi lần.` }];
  }

  const requestContext = await getRequestContext();
  const results: BulkRowResult[] = [];

  for (const row of rows) {
    try {
      if (!row.name?.trim()) throw new Error('Tên sản phẩm là bắt buộc.');
      if (!row.slug?.trim()) throw new Error('Slug sản phẩm là bắt buộc.');

      const payload: ProductPayload = {
        category_id: row.category_id || null,
        name: row.name.trim(),
        slug: row.slug.trim(),
        description: row.description?.trim() || null,
        price: row.price,
        stock: Math.max(0, Math.floor(row.stock ?? 0)),
        specs: {} as Json,
        is_active: row.is_active,
        is_featured: row.is_featured,
      };

      const { data, error } = await createAdminProduct(payload, requestContext);

      if (error || !data) {
        results.push({ clientId: row.clientId, ok: false, error: error ?? 'Không thể tạo sản phẩm.' });
      } else {
        results.push({ clientId: row.clientId, ok: true, productId: data.id });
      }
    } catch (err) {
      results.push({
        clientId: row.clientId,
        ok: false,
        error: err instanceof Error ? err.message : 'Lỗi không xác định.',
      });
    }
  }

  revalidatePath('/admin/products');
  revalidatePath('/admin/dashboard');
  revalidatePath('/danh-muc');

  return results;
}
