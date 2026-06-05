'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  ImageIcon,
  Loader2,
  Plus,
  Star,
  Trash2,
  X,
} from 'lucide-react';

import {
  bulkCreateProductsAction,
  type BulkRowPayload,
} from '@/app/admin/(dashboard)/products/actions';
import { uploadProductImageAction } from '@/app/admin/(dashboard)/products/media-discount-actions';
import type { AdminCategory } from '@/lib/services/admin/categories';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RowStatus =
  | 'draft'
  | 'invalid'
  | 'creating'
  | 'uploading_images'
  | 'success'
  | 'partial_success'
  | 'failed';

interface RowImage {
  localId: string;
  file: File;
  preview: string;
  isPrimary: boolean;
  clientError?: string;
}

interface BulkRow {
  clientId: string;
  name: string;
  slug: string;
  category_id: string;
  price: string;
  stock: string;
  is_active: boolean;
  images: RowImage[];
  expandImages: boolean;
  status: RowStatus;
  errors: Record<string, string>;
  serverError?: string;
  productId?: string;
  failedImages?: string[];
}

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const MAX_IMG_BYTES = 5 * 1024 * 1024;
const MAX_IMGS_PER_ROW = 5;
const BATCH_SIZE = 10;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function slugify(v: string) {
  return v
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function emptyRow(): BulkRow {
  return {
    clientId: uid(),
    name: '',
    slug: '',
    category_id: '',
    price: '',
    stock: '0',
    is_active: true,
    images: [],
    expandImages: false,
    status: 'draft',
    errors: {},
  };
}

function validateRow(row: BulkRow, allRows: BulkRow[]): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!row.name.trim()) errs.name = 'Tên là bắt buộc';
  if (!row.slug.trim()) {
    errs.slug = 'Slug là bắt buộc';
  } else if (!SLUG_RE.test(row.slug)) {
    errs.slug = 'Chỉ a-z, 0-9, dấu gạch ngang';
  } else if (allRows.some((r) => r.clientId !== row.clientId && r.slug === row.slug)) {
    errs.slug = 'Slug trùng trong bảng';
  }
  if (row.price !== '' && (isNaN(Number(row.price)) || Number(row.price) < 0)) {
    errs.price = 'Giá >= 0';
  }
  if (row.stock !== '' && (!Number.isInteger(Number(row.stock)) || Number(row.stock) < 0)) {
    errs.stock = 'Số nguyên >= 0';
  }
  if (row.images.some((img) => img.clientError)) {
    errs.images = 'Hàng có ảnh không hợp lệ';
  }
  return errs;
}

function validateImage(file: File): string | null {
  const ext = `.${(file.name.split('.').pop() ?? '').toLowerCase()}`;
  if (!ALLOWED_MIME.has(file.type) || !ALLOWED_EXT.has(ext)) return 'Chỉ JPG, PNG, WebP';
  if (file.size > MAX_IMG_BYTES) return `Quá 5 MB (${(file.size / 1024 / 1024).toFixed(1)} MB)`;
  return null;
}

async function runConcurrent<T>(
  items: T[],
  worker: (item: T) => Promise<void>,
  limit: number,
) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift()!;
      await worker(item);
    }
  });
  await Promise.all(workers);
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<RowStatus, string> = {
  draft: 'Nháp',
  invalid: 'Lỗi nhập liệu',
  creating: 'Đang tạo…',
  uploading_images: 'Đang tải ảnh…',
  success: 'Thành công',
  partial_success: 'Lỗi ảnh',
  failed: 'Thất bại',
};

const STATUS_COLORS: Record<RowStatus, string> = {
  draft: 'bg-slate-100 text-slate-500',
  invalid: 'bg-red-50 text-red-600',
  creating: 'bg-blue-50 text-blue-600',
  uploading_images: 'bg-indigo-50 text-indigo-600',
  success: 'bg-emerald-50 text-emerald-700',
  partial_success: 'bg-amber-50 text-amber-700',
  failed: 'bg-red-50 text-red-600',
};

function StatusBadge({ row }: { row: BulkRow }) {
  const hasErrors = Object.keys(row.errors).length > 0;

  if (hasErrors || row.status === 'invalid') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
        <AlertCircle className="h-2.5 w-2.5" /> Lỗi nhập liệu
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[row.status]}`}
    >
      {(row.status === 'creating' || row.status === 'uploading_images') && (
        <Loader2 className="h-2.5 w-2.5 animate-spin" />
      )}
      {row.status === 'success' && <CheckCircle2 className="h-2.5 w-2.5" />}
      {row.status === 'partial_success' && <AlertCircle className="h-2.5 w-2.5" />}
      {STATUS_LABELS[row.status]}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Row image panel
// ---------------------------------------------------------------------------

function RowImagePanel({
  images,
  disabled,
  onAddFiles,
  onRemove,
  onSetPrimary,
}: {
  images: RowImage[];
  disabled: boolean;
  onAddFiles: (files: FileList) => void;
  onRemove: (localId: string) => void;
  onSetPrimary: (localId: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {images.map((img) => (
          <div key={img.localId} className="relative flex-shrink-0">
            <div
              className={`relative h-14 w-14 overflow-hidden rounded-lg border-2 ${
                img.isPrimary ? 'border-[#1B3A6B]' : 'border-[#E5E9EF]'
              } ${img.clientError ? 'opacity-60' : ''}`}
            >
              <Image
                src={img.preview}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
              {img.clientError && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </div>
              )}
            </div>
            {!disabled && (
              <>
                <button
                  type="button"
                  onClick={() => onRemove(img.localId)}
                  className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 hover:bg-red-50 hover:text-red-500"
                  title="Xóa ảnh"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
                {!img.isPrimary && !img.clientError && (
                  <button
                    type="button"
                    onClick={() => onSetPrimary(img.localId)}
                    className="absolute -bottom-1.5 -left-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 hover:bg-amber-50 hover:text-amber-500"
                    title="Đặt làm ảnh chính"
                  >
                    <Star className="h-2.5 w-2.5" />
                  </button>
                )}
              </>
            )}
            {img.isPrimary && (
              <Star className="absolute -bottom-1.5 -left-1.5 h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            )}
          </div>
        ))}

        {images.length < MAX_IMGS_PER_ROW && !disabled && (
          <>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-[#E5E9EF] text-slate-300 hover:border-[#1B3A6B]/50 hover:text-[#1B3A6B]/50"
              title="Thêm ảnh"
            >
              <Plus className="h-5 w-5" />
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) {
                  onAddFiles(e.target.files);
                  e.target.value = '';
                }
              }}
            />
          </>
        )}

        <span className="text-[10px] text-slate-400">
          {images.length}/{MAX_IMGS_PER_ROW} ảnh · ★ = ảnh chính
        </span>
      </div>

      {images.some((img) => img.clientError) && (
        <div className="flex flex-col gap-1 text-[10px] text-red-500 mt-1">
          {images
            .filter((img) => img.clientError)
            .map((img) => (
              <p key={img.localId} className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <span>
                  <strong>{img.file.name}</strong>: {img.clientError}
                </span>
              </p>
            ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single row editor
// ---------------------------------------------------------------------------

interface RowEditorProps {
  row: BulkRow;
  rowIndex: number;
  categories: AdminCategory[];
  disabled: boolean;
  onNameChange: (v: string) => void;
  onFieldChange: (field: keyof BulkRow, value: unknown) => void;
  onToggleImages: () => void;
  onAddImages: (files: FileList) => void;
  onRemoveImage: (localId: string) => void;
  onSetPrimary: (localId: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function RowEditor({
  row,
  rowIndex,
  categories,
  disabled,
  onNameChange,
  onFieldChange,
  onToggleImages,
  onAddImages,
  onRemoveImage,
  onSetPrimary,
  onDuplicate,
  onDelete,
}: RowEditorProps) {
  const hasErrors = Object.keys(row.errors).length > 0;
  const isLocked = row.status === 'creating' || row.status === 'uploading_images';
  // success and partial_success are both terminal — product already exists in DB
  const isDone = row.status === 'success' || row.status === 'partial_success';

  const rowBg = isDone
    ? row.status === 'success'
      ? 'bg-emerald-50/40'
      : 'bg-amber-50/40'
    : hasErrors || row.status === 'invalid'
      ? 'bg-red-50/40'
      : row.status === 'failed'
        ? 'bg-red-50/20'
        : '';

  const inp = (hasError?: boolean) =>
    `w-full rounded-lg border px-2 py-1.5 text-xs outline-none transition-colors focus:border-[#4880FF] focus-visible:ring-2 focus-visible:ring-[#4880ff]/35 ${
      hasError
        ? 'border-red-300 bg-red-50'
        : 'border-[#E5E7EF] bg-white disabled:bg-slate-50 disabled:text-slate-400'
    }`;

  return (
    <>
      <tr className={`border-b border-[#EEF2F6] last:border-0 ${rowBg}`}>
        {/* Row number */}
        <td className="w-8 px-2 py-2 text-center text-xs text-slate-400">{rowIndex + 1}</td>

        {/* Name */}
        <td className="px-2 py-1.5">
          <input
            type="text"
            value={row.name}
            onChange={(e) => onNameChange(e.target.value)}
            disabled={disabled || isLocked || isDone}
            placeholder="Tên sản phẩm"
            className={inp(!!row.errors.name)}
          />
          {row.errors.name && (
            <p className="mt-0.5 text-[10px] text-red-500">{row.errors.name}</p>
          )}
        </td>

        {/* Slug */}
        <td className="px-2 py-1.5">
          <input
            type="text"
            value={row.slug}
            onChange={(e) => onFieldChange('slug', e.target.value.toLowerCase())}
            disabled={disabled || isLocked || isDone}
            placeholder="url-slug"
            className={`font-mono ${inp(!!row.errors.slug)}`}
          />
          {row.errors.slug && (
            <p className="mt-0.5 text-[10px] text-red-500">{row.errors.slug}</p>
          )}
        </td>

        {/* Category */}
        <td className="px-2 py-1.5">
          <select
            value={row.category_id}
            onChange={(e) => onFieldChange('category_id', e.target.value)}
            disabled={disabled || isLocked || isDone}
            className="admin-select h-8 text-xs"
          >
            <option value="">— Không có —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </td>

        {/* Price */}
        <td className="px-2 py-1.5">
          <input
            type="text"
            value={row.price}
            onChange={(e) => onFieldChange('price', e.target.value)}
            disabled={disabled || isLocked || isDone}
            placeholder="Liên hệ"
            className={inp(!!row.errors.price)}
          />
          {row.errors.price && (
            <p className="mt-0.5 text-[10px] text-red-500">{row.errors.price}</p>
          )}
        </td>

        {/* Stock */}
        <td className="px-2 py-1.5">
          <input
            type="number"
            min={0}
            step={1}
            value={row.stock}
            onChange={(e) => onFieldChange('stock', e.target.value)}
            disabled={disabled || isLocked || isDone}
            className={inp(!!row.errors.stock)}
          />
          {row.errors.stock && (
            <p className="mt-0.5 text-[10px] text-red-500">{row.errors.stock}</p>
          )}
        </td>

        {/* Is active */}
        <td className="px-2 py-1.5 text-center">
          <input
            type="checkbox"
            checked={row.is_active}
            onChange={(e) => onFieldChange('is_active', e.target.checked)}
            disabled={disabled || isLocked || isDone}
            className="h-4 w-4 cursor-pointer rounded border-[#E5E7EF] text-[#4880FF] focus:ring-[#4880ff]/35"
          />
        </td>

        {/* Image toggle */}
        <td className="px-2 py-1.5 text-center">
          <button
            type="button"
            onClick={onToggleImages}
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition ${
              row.errors.images
                ? 'bg-red-50 text-red-600 hover:bg-red-100 ring-1 ring-red-300'
                : row.images.length > 0
                  ? 'bg-[#1B3A6B]/10 text-[#1B3A6B] hover:bg-[#1B3A6B]/20'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
            title={row.errors.images ? row.errors.images : row.expandImages ? 'Ẩn bảng ảnh' : 'Xem/thêm ảnh'}
          >
            <ImageIcon className="h-3 w-3" />
            {row.images.length > 0 ? row.images.length : '+'}
          </button>
          {row.errors.images && (
            <p className="mt-0.5 text-[9px] text-red-500 leading-none">{row.errors.images}</p>
          )}
        </td>

        {/* Status */}
        <td className="px-2 py-1.5">
          <div className="flex flex-col gap-0.5">
            <StatusBadge row={row} />
            {row.serverError && (
              <p className="text-[10px] text-red-500" title={row.serverError}>
                {row.serverError.slice(0, 40)}
                {row.serverError.length > 40 ? '…' : ''}
              </p>
            )}
            {row.failedImages && row.failedImages.length > 0 && (
              <p className="text-[10px] text-amber-600">
                Ảnh lỗi: {row.failedImages.join(', ')}
              </p>
            )}
            {row.status === 'partial_success' && (
              <p className="text-[10px] text-amber-700">
                Vào Media &amp; Giá sỉ để tải lại ảnh.
              </p>
            )}
          </div>
        </td>

        {/* Row actions */}
        <td className="px-2 py-1.5">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onDuplicate}
              disabled={isLocked}
              title="Nhân đôi dòng"
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={isLocked}
              title="Xóa dòng"
              className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>

      {/* Expandable image panel */}
      {row.expandImages && (
        <tr className={`border-b border-[#EEF2F6] ${rowBg}`}>
          <td colSpan={10} className="px-4 pb-3 pt-1">
            <RowImagePanel
              images={row.images}
              disabled={isLocked || isDone}
              onAddFiles={onAddImages}
              onRemove={onRemoveImage}
              onSetPrimary={onSetPrimary}
            />
          </td>
        </tr>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface ProductBulkManualTableProps {
  categories: AdminCategory[];
}

export function ProductBulkManualTable({ categories }: ProductBulkManualTableProps) {
  const router = useRouter();
  const [rows, setRows] = useState<BulkRow[]>([emptyRow()]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Row mutations ---

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function deleteRow(clientId: string) {
    setRows((prev) => prev.filter((r) => r.clientId !== clientId));
  }

  function duplicateRow(clientId: string) {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.clientId === clientId);
      if (idx === -1) return prev;
      const src = prev[idx];
      const copy: BulkRow = {
        ...src,
        clientId: uid(),
        slug: src.slug ? `${src.slug}-copy` : '',
        images: src.images.map((img) => ({ ...img, localId: uid() })),
        status: 'draft',
        errors: {},
        serverError: undefined,
        productId: undefined,
        failedImages: undefined,
      };
      return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)];
    });
  }

  function patchRow(clientId: string, patch: Partial<BulkRow>) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.clientId !== clientId) return r;
        const next = { ...r, ...patch };
        // Clear the edited field's error
        const nextErrors = { ...r.errors };
        for (const key of Object.keys(patch)) {
          delete nextErrors[key];
        }
        next.errors = nextErrors;

        // When the user edits a field on an invalid or failed row, reset it back to draft
        if ((r.status === 'invalid' || r.status === 'failed') && !('status' in patch)) {
          next.status = 'draft';
        }
        return next;
      }),
    );
  }

  function handleNameChange(clientId: string, name: string) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.clientId !== clientId) return r;
        const autoSlug = r.slug === '' || r.slug === slugify(r.name);
        const nextErrors = { ...r.errors };
        delete nextErrors.name;
        if (autoSlug) {
          delete nextErrors.slug;
        }
        return {
          ...r,
          name,
          slug: autoSlug ? slugify(name) : r.slug,
          // Reset invalid/failed → draft when the user starts correcting the row
          status: r.status === 'invalid' || r.status === 'failed' ? 'draft' : r.status,
          errors: nextErrors,
        };
      }),
    );
  }

  // --- Image mutations ---

  function addImages(clientId: string, files: FileList) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.clientId !== clientId) return r;
        const remaining = MAX_IMGS_PER_ROW - r.images.filter((i) => !i.clientError).length;
        const newImgs: RowImage[] = [];
        for (let i = 0; i < Math.min(files.length, remaining); i++) {
          const file = files[i];
          newImgs.push({
            localId: uid(),
            file,
            preview: URL.createObjectURL(file),
            isPrimary: r.images.length === 0 && i === 0,
            clientError: validateImage(file) ?? undefined,
          });
        }
        const updatedImages = [...r.images, ...newImgs];

        // Revalidate image errors on row
        const nextErrors = { ...r.errors };
        if (updatedImages.some((img) => img.clientError)) {
          nextErrors.images = 'Hàng có ảnh không hợp lệ';
        } else {
          delete nextErrors.images;
        }

        return {
          ...r,
          images: updatedImages,
          status: r.status === 'invalid' || r.status === 'failed' ? 'draft' : r.status,
          errors: nextErrors,
        };
      }),
    );
  }

  function removeImage(clientId: string, localId: string) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.clientId !== clientId) return r;
        const removed = r.images.find((i) => i.localId === localId);
        const rest = r.images.filter((i) => i.localId !== localId);
        if (removed?.isPrimary && rest.length > 0) {
          rest[0] = { ...rest[0], isPrimary: true };
        }

        // Revalidate image errors on row
        const nextErrors = { ...r.errors };
        if (rest.some((img) => img.clientError)) {
          nextErrors.images = 'Hàng có ảnh không hợp lệ';
        } else {
          delete nextErrors.images;
        }

        return {
          ...r,
          images: rest,
          status: r.status === 'invalid' || r.status === 'failed' ? 'draft' : r.status,
          errors: nextErrors,
        };
      }),
    );
  }

  function setPrimary(clientId: string, localId: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.clientId !== clientId
          ? r
          : { ...r, images: r.images.map((i) => ({ ...i, isPrimary: i.localId === localId })) },
      ),
    );
  }

  // --- Submit ---

  async function handleSubmit() {
    if (isSubmitting) return;

    // Validate all non-terminal rows and set explicit `invalid` status
    const validated = rows.map((row) => {
      if (row.status === 'success' || row.status === 'partial_success') return row;
      const errors = validateRow(row, rows);
      const hasErrs = Object.keys(errors).length > 0;
      return {
        ...row,
        errors,
        status: hasErrs ? ('invalid' as RowStatus) : row.status,
      };
    });
    setRows(validated);

    // Only process rows that are clean and haven't already produced a product
    const pending = validated.filter(
      (r) =>
        r.status !== 'success' &&
        r.status !== 'partial_success' &&
        r.status !== 'invalid' &&
        Object.keys(r.errors).length === 0,
    );
    if (pending.length === 0) return;

    setIsSubmitting(true);
    try {
      for (let i = 0; i < pending.length; i += BATCH_SIZE) {
        const batch = pending.slice(i, i + BATCH_SIZE);

        setRows((prev) =>
          prev.map((r) =>
            batch.some((b) => b.clientId === r.clientId) ? { ...r, status: 'creating' } : r,
          ),
        );

        const payloads: BulkRowPayload[] = batch.map((row) => ({
          clientId: row.clientId,
          name: row.name.trim(),
          slug: row.slug.trim(),
          category_id: row.category_id || null,
          price: row.price !== '' ? Number(row.price) : null,
          stock: Math.max(0, Math.floor(Number(row.stock) || 0)),
          is_active: row.is_active,
          description: null,
        }));

        const results = await bulkCreateProductsAction(payloads);

        for (const result of results) {
          const srcRow = batch.find((r) => r.clientId === result.clientId);
          if (!srcRow) continue;

          if (!result.ok || !result.productId) {
            setRows((prev) =>
              prev.map((r) =>
                r.clientId === result.clientId
                  ? { ...r, status: 'failed', serverError: result.error }
                  : r,
              ),
            );
            continue;
          }

          const validImgs = srcRow.images.filter((i) => !i.clientError);

          if (validImgs.length === 0) {
            setRows((prev) =>
              prev.map((r) =>
                r.clientId === result.clientId
                  ? { ...r, status: 'success', productId: result.productId }
                  : r,
              ),
            );
            continue;
          }

          setRows((prev) =>
            prev.map((r) =>
              r.clientId === result.clientId
                ? { ...r, status: 'uploading_images', productId: result.productId }
                : r,
            ),
          );

          const failedImages: string[] = [];

          // Build indexed image pairs before upload for stable sort order in concurrent execution
          const imagesWithSortOrder = validImgs.map((img, idx) => ({
            img,
            sortOrder: idx,
          }));

          await runConcurrent(
            imagesWithSortOrder,
            async ({ img, sortOrder }) => {
              const fd = new FormData();
              fd.append('product_id', result.productId!);
              fd.append('file', img.file);
              fd.append('alt', '');
              fd.append('sort_order', String(sortOrder));
              fd.append('is_primary', String(img.isPrimary));
              const res = await uploadProductImageAction({ ok: false }, fd);
              if (!res.ok) failedImages.push(img.file.name);
            },
            2,
          );

          setRows((prev) =>
            prev.map((r) => {
              if (r.clientId !== result.clientId) return r;
              return failedImages.length > 0
                ? { ...r, status: 'partial_success', failedImages }
                : { ...r, status: 'success' };
            }),
          );
        }
      }

      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  // --- Derived counts ---

  const successCount = rows.filter((r) => r.status === 'success').length;
  const partialCount = rows.filter((r) => r.status === 'partial_success').length;
  const failedCount = rows.filter((r) => r.status === 'failed').length;
  const invalidCount = rows.filter(
    (r) => r.status === 'invalid' || Object.keys(r.errors).length > 0,
  ).length;
  // Only rows that haven't yet produced a product and have no errors are "pending"
  const pendingCount = rows.filter(
    (r) =>
      r.status !== 'success' &&
      r.status !== 'partial_success' &&
      r.status !== 'invalid' &&
      Object.keys(r.errors).length === 0,
  ).length;
  const processingCount = rows.filter(
    (r) => r.status === 'creating' || r.status === 'uploading_images',
  ).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Result summary strip */}
      {(successCount > 0 || partialCount > 0 || failedCount > 0) && (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[#EEF2F6] bg-[#F7F9FB] px-4 py-2.5 text-xs">
          {successCount > 0 && (
            <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {successCount} thành công
            </span>
          )}
          {partialCount > 0 && (
            <span className="flex items-center gap-1.5 font-semibold text-amber-700">
              <AlertCircle className="h-3.5 w-3.5" />
              {partialCount} tạo được nhưng ảnh lỗi — vào Media &amp; Giá sỉ để tải lại
            </span>
          )}
          {failedCount > 0 && (
            <span className="flex items-center gap-1.5 font-semibold text-red-600">
              <AlertCircle className="h-3.5 w-3.5" />
              {failedCount} thất bại — có thể sửa và thử lại
            </span>
          )}
        </div>
      )}

      {/* Add row button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={addRow}
          disabled={isSubmitting}
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-[#1B3A6B]/30 px-3 py-1.5 text-xs font-semibold text-[#1B3A6B] hover:border-[#1B3A6B]/60 hover:bg-[#1B3A6B]/5 disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Thêm dòng
        </button>
        <span className="text-xs text-slate-400">{rows.length} dòng</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[#EEF2F6]">
        <table className="w-full min-w-[860px]">
          <thead>
            <tr className="border-b border-[#EEF2F6] bg-[#F7F9FB] text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <th className="w-8 px-2 py-2.5 text-center">#</th>
              <th className="min-w-[160px] px-2 py-2.5">Tên *</th>
              <th className="min-w-[140px] px-2 py-2.5">Slug *</th>
              <th className="min-w-[120px] px-2 py-2.5">Danh mục</th>
              <th className="w-24 px-2 py-2.5">Giá (đ)</th>
              <th className="w-20 px-2 py-2.5">Kho</th>
              <th className="w-12 px-2 py-2.5 text-center">Hiện</th>
              <th className="w-16 px-2 py-2.5 text-center">Ảnh</th>
              <th className="w-28 px-2 py-2.5">Trạng thái</th>
              <th className="w-14 px-2 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <RowEditor
                key={row.clientId}
                row={row}
                rowIndex={idx}
                categories={categories}
                disabled={isSubmitting}
                onNameChange={(v) => handleNameChange(row.clientId, v)}
                onFieldChange={(field, value) =>
                  patchRow(row.clientId, { [field]: value } as Partial<BulkRow>)
                }
                onToggleImages={() => patchRow(row.clientId, { expandImages: !row.expandImages })}
                onAddImages={(files) => addImages(row.clientId, files)}
                onRemoveImage={(localId) => removeImage(row.clientId, localId)}
                onSetPrimary={(localId) => setPrimary(row.clientId, localId)}
                onDuplicate={() => duplicateRow(row.clientId)}
                onDelete={() => deleteRow(row.clientId)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Add row below table */}
      <button
        type="button"
        onClick={addRow}
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#EEF2F6] py-2 text-xs font-medium text-slate-400 hover:border-[#1B3A6B]/30 hover:text-[#1B3A6B] disabled:opacity-50"
      >
        <Plus className="h-3.5 w-3.5" />
        Thêm dòng mới
      </button>

      {/* Validation warning */}
      {invalidCount > 0 && !isSubmitting && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {invalidCount} dòng có lỗi — sửa trước khi tạo sản phẩm.
        </div>
      )}

      {/* Sticky-ish footer */}
      <div className="flex items-center justify-end gap-3 border-t border-[#EEF2F6] pt-4">
        {processingCount > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Đang xử lý {processingCount} dòng…
          </span>
        )}
        {processingCount === 0 && pendingCount > 0 && (
          <span className="text-xs text-slate-400">{pendingCount} dòng hợp lệ sẵn sàng tạo</span>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || pendingCount === 0}
          className="admin-button-primary flex items-center gap-2 px-5 text-xs disabled:opacity-50"
        >
          {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {isSubmitting ? 'Đang tạo…' : `Tạo ${pendingCount} sản phẩm`}
        </button>
      </div>
    </div>
  );
}
