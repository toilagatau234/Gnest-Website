'use server';

import { revalidatePath } from 'next/cache';

import { requireAdminAuth } from '@/lib/services/admin/auth';
import { CONTENT_EDITOR_ROLES } from '@/lib/services/admin/permissions';
import {
  validateV4Import,
  importV4Upsert,
  type V4ImportRow,
  type V4ValidationResult,
  type V4ImportResult,
} from '@/lib/services/admin/product-import';
import {
  uploadImportImage,
  finalizeImportJobImages,
  type UploadImportImageStatus,
} from '@/lib/services/admin/product-image-import';

export type {
  V4ImportRow,
  V4ValidationResult,
  V4ImportResult,
};

function revalidateProductPaths() {
  revalidatePath('/admin/products');
  revalidatePath('/admin/dashboard');
  revalidatePath('/danh-muc');
  revalidatePath('/');
}

// ── V4 Excel import (SKU upsert + local-folder images) ─────────────────────────

export async function validateV4ImportAction(rows: V4ImportRow[]): Promise<V4ValidationResult> {
  await requireAdminAuth(CONTENT_EDITOR_ROLES);
  return validateV4Import(rows);
}

export async function importV4UpsertAction(
  rows: V4ImportRow[],
  fileName?: string | null,
): Promise<V4ImportResult> {
  await requireAdminAuth(CONTENT_EDITOR_ROLES);
  const result = await importV4Upsert(rows, fileName);

  if (result.ok) {
    revalidateProductPaths();
  }

  return result;
}

export interface ImportImageActionResult {
  status: UploadImportImageStatus;
  error?: string;
}

/**
 * Uploads one local image into Supabase Storage for an import run (Phase 8/9).
 * One request per file keeps each payload small (≤5 MB) and lets the client run
 * a concurrency-limited queue across thousands of images.
 */
export async function uploadImportImageAction(
  _prev: ImportImageActionResult,
  formData: FormData,
): Promise<ImportImageActionResult> {
  await requireAdminAuth(CONTENT_EDITOR_ROLES);

  const jobIdRaw = (formData.get('job_id') as string | null)?.trim() ?? '';
  const productId = (formData.get('product_id') as string | null)?.trim() ?? '';
  const sku = (formData.get('sku') as string | null)?.trim() ?? '';
  const sortOrder = Number(formData.get('sort_order') ?? '0');
  const isPrimary = formData.get('is_primary') === 'true';
  const contentHash = (formData.get('content_hash') as string | null)?.trim() ?? '';
  const file = formData.get('file');

  if (!productId) return { status: 'failed', error: 'Thiếu ID sản phẩm.' };
  if (!sku) return { status: 'failed', error: 'Thiếu SKU.' };
  if (!(file instanceof File) || file.size === 0) {
    return { status: 'failed', error: 'Tệp ảnh không hợp lệ.' };
  }

  const bytes = await file.arrayBuffer();
  const result = await uploadImportImage({
    jobId: jobIdRaw || null,
    productId,
    sku,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    bytes,
    sortOrder: Number.isFinite(sortOrder) && sortOrder >= 0 ? Math.floor(sortOrder) : 0,
    isPrimary,
    contentHash,
  });

  return { status: result.status, error: result.error };
}

/**
 * Finalizes the image phase of an import run: updates the job's image counter
 * and revalidates product-facing pages so new thumbnails appear.
 */
export async function finalizeImportImagesAction(
  jobId: string | null,
  counts: { uploaded: number; skipped: number; failed: number },
): Promise<{ ok: boolean }> {
  await requireAdminAuth(CONTENT_EDITOR_ROLES);

  if (jobId) {
    await finalizeImportJobImages(jobId, counts);
  }
  revalidateProductPaths();
  return { ok: true };
}
