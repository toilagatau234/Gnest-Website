'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import Image from 'next/image';

import { AdminConfirmDialog } from '@/components/admin/AdminConfirmDialog';
import { useToast } from '@/components/admin/AdminToast';
import {
  deleteProductImageAction,
  reorderProductImagesAction,
  setProductPrimaryImageAction,
  toggleProductImageActiveAction,
  updateProductImageAction,
  uploadProductImageAction,
  type ActionState,
} from '@/app/admin/(dashboard)/products/media-discount-actions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProductImage {
  id: string;
  public_url: string | null;
  alt: string | null;
  sort_order: number;
  is_primary: boolean;
  is_active: boolean;
}

interface ProductMediaManagerProps {
  productId: string;
  images: ProductImage[];
}

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_FILES_PER_BATCH = 10;

type FileStatus = 'pending' | 'uploading' | 'done' | 'error';

interface QueuedFile {
  localId: string;
  file: File;
  preview: string;
  alt: string;
  isPrimary: boolean;
  status: FileStatus;
  error?: string;
  clientError?: string; // pre-upload validation error
}

function validateFileClient(file: File): string | null {
  const ext = '.' + (file.name.split('.').pop() ?? '').toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(file.type) || !ALLOWED_EXTENSIONS.has(ext)) {
    return 'Chỉ chấp nhận JPG, PNG, WebP.';
  }
  if (file.size > MAX_FILE_BYTES) {
    return `Vượt quá 5 MB (${(file.size / 1024 / 1024).toFixed(1)} MB).`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Drop Zone subcomponent
// ---------------------------------------------------------------------------

interface DropZoneProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}

function DropZone({ onFiles, disabled }: DropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles(files);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onFiles(files);
    // Reset input so the same file can be re-selected after removal
    e.target.value = '';
  }

  return (
    <label
      className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-8 transition ${
        disabled
          ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'
          : dragOver
            ? 'border-[#1B3A6B] bg-[#1B3A6B]/5'
            : 'border-slate-300 bg-slate-50/60 hover:border-[#1B3A6B]/50 hover:bg-slate-50'
      }`}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <Upload className={`h-8 w-8 transition ${dragOver ? 'text-[#1B3A6B]' : 'text-slate-300'}`} />
      <div className="text-center">
        <p className="text-xs font-semibold text-slate-600">
          Kéo thả ảnh vào đây, hoặc{' '}
          <span className="text-[#1B3A6B] underline underline-offset-2">chọn từ máy tính</span>
        </p>
        <p className="mt-0.5 text-[10px] text-slate-400">
          JPG · PNG · WebP · Tối đa 5 MB/ảnh · {MAX_FILES_PER_BATCH} ảnh mỗi lần
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={disabled}
        className="sr-only"
        onChange={handleInputChange}
      />
    </label>
  );
}

// ---------------------------------------------------------------------------
// Queued file card
// ---------------------------------------------------------------------------

interface QueueCardProps {
  item: QueuedFile;
  isFirst: boolean;
  onRemove: (id: string) => void;
  onAltChange: (id: string, alt: string) => void;
  onPrimaryChange: (id: string) => void;
}

function QueueCard({ item, isFirst, onRemove, onAltChange, onPrimaryChange }: QueueCardProps) {
  const statusColor: Record<FileStatus, string> = {
    pending: 'border-slate-200',
    uploading: 'border-[#1B3A6B] ring-1 ring-[#1B3A6B]/20',
    done: 'border-emerald-300 ring-1 ring-emerald-400/20',
    error: 'border-red-300 ring-1 ring-red-300/20',
  };

  return (
    <div className={`rounded-xl border bg-white p-3 transition ${statusColor[item.status]}`}>
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
          <Image src={item.preview} alt={item.alt || item.file.name} fill className="object-cover" unoptimized />
          {item.status === 'uploading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 className="h-5 w-5 animate-spin text-[#1B3A6B]" />
            </div>
          )}
          {item.status === 'done' && (
            <div className="absolute inset-0 flex items-center justify-center bg-emerald-50/80">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-semibold text-slate-700" title={item.file.name}>
              {item.file.name}
            </p>
            {item.status !== 'uploading' && item.status !== 'done' && (
              <button
                type="button"
                onClick={() => onRemove(item.localId)}
                className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition"
                title="Bỏ ảnh này"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <p className="text-[10px] text-slate-400">
            {(item.file.size / 1024).toFixed(0)} KB
          </p>

          {/* Client-side validation error */}
          {item.clientError && (
            <p className="text-[10px] font-semibold text-red-600">
              <AlertCircle className="mr-0.5 inline h-3 w-3" />
              {item.clientError}
            </p>
          )}

          {/* Upload error */}
          {item.status === 'error' && item.error && (
            <p className="text-[10px] font-semibold text-red-600">
              <AlertCircle className="mr-0.5 inline h-3 w-3" />
              {item.error}
            </p>
          )}

          {/* Alt text input (only when pending/error) */}
          {(item.status === 'pending' || item.status === 'error') && !item.clientError && (
            <input
              type="text"
              value={item.alt}
              onChange={(e) => onAltChange(item.localId, e.target.value)}
              placeholder="Alt text (tùy chọn)"
              className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] placeholder-slate-300 focus:border-[#1B3A6B] focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]/20"
            />
          )}
        </div>
      </div>

      {/* Primary toggle */}
      {(item.status === 'pending' || item.status === 'error') && !item.clientError && (
        <label className="mt-2 flex cursor-pointer items-center gap-1.5 text-[10px] font-semibold text-slate-600 select-none">
          <input
            type="checkbox"
            checked={item.isPrimary}
            onChange={() => onPrimaryChange(item.localId)}
            className="rounded border-slate-300 text-[#1B3A6B] focus:ring-[#1B3A6B]/30"
          />
          {isFirst ? 'Đặt làm ảnh đại diện chính' : 'Ảnh đại diện chính'}
        </label>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ProductMediaManager({ productId, images }: ProductMediaManagerProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Gallery interaction states
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [editAlt, setEditAlt] = useState('');
  const [editSortOrder, setEditSortOrder] = useState(0);
  const [editIsActive, setEditIsActive] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Upload queue
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => {
      queue.forEach((f) => URL.revokeObjectURL(f.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Drop zone handler
  // ---------------------------------------------------------------------------

  function handleNewFiles(files: File[]) {
    const current = queue.length;
    const remaining = MAX_FILES_PER_BATCH - current;
    if (remaining <= 0) {
      toast(`Tối đa ${MAX_FILES_PER_BATCH} ảnh mỗi lần tải lên.`, 'error');
      return;
    }
    const accepted = files.slice(0, remaining);
    const newItems: QueuedFile[] = accepted.map((file) => ({
      localId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      preview: URL.createObjectURL(file),
      alt: '',
      isPrimary: false,
      status: 'pending' as FileStatus,
      clientError: validateFileClient(file) ?? undefined,
    }));
    setQueue((prev) => [...prev, ...newItems]);
    if (files.length > remaining) {
      toast(`Chỉ thêm được ${remaining} ảnh (đã đạt giới hạn ${MAX_FILES_PER_BATCH}).`, 'info');
    }
  }

  function removeFromQueue(localId: string) {
    setQueue((prev) => {
      const item = prev.find((f) => f.localId === localId);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((f) => f.localId !== localId);
    });
  }

  function updateQueueAlt(localId: string, alt: string) {
    setQueue((prev) => prev.map((f) => (f.localId === localId ? { ...f, alt } : f)));
  }

  function toggleQueuePrimary(localId: string) {
    setQueue((prev) =>
      prev.map((f) =>
        f.localId === localId ? { ...f, isPrimary: !f.isPrimary } : { ...f, isPrimary: false },
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Batch upload
  // ---------------------------------------------------------------------------

  async function uploadAll() {
    const uploadable = queue.filter((f) => !f.clientError && (f.status === 'pending' || f.status === 'error'));
    if (uploadable.length === 0) return;

    setIsUploading(true);

    let successCount = 0;
    let nextSortOrder = images.length;

    for (const item of uploadable) {
      // Mark as uploading
      setQueue((prev) =>
        prev.map((f) => (f.localId === item.localId ? { ...f, status: 'uploading', error: undefined } : f)),
      );

      const formData = new FormData();
      formData.append('file', item.file);
      formData.append('product_id', productId);
      formData.append('alt', item.alt.trim());
      formData.append('sort_order', String(nextSortOrder));
      formData.append('is_primary', String(item.isPrimary));

      const result: ActionState = await uploadProductImageAction({ ok: false }, formData);

      if (result.ok) {
        successCount++;
        nextSortOrder++;
        setQueue((prev) =>
          prev.map((f) => (f.localId === item.localId ? { ...f, status: 'done' } : f)),
        );
      } else {
        setQueue((prev) =>
          prev.map((f) =>
            f.localId === item.localId
              ? { ...f, status: 'error', error: result.error ?? 'Tải lên thất bại.' }
              : f,
          ),
        );
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      toast(
        successCount === uploadable.length
          ? `Đã tải lên ${successCount} ảnh thành công.`
          : `Tải lên ${successCount}/${uploadable.length} ảnh thành công.`,
        successCount === uploadable.length ? 'success' : 'error',
      );
      router.refresh();
      // Purge successfully uploaded items from queue after a short delay
      setTimeout(() => {
        setQueue((prev) => {
          prev.filter((f) => f.status === 'done').forEach((f) => URL.revokeObjectURL(f.preview));
          return prev.filter((f) => f.status !== 'done');
        });
      }, 1200);
    } else {
      toast('Tất cả ảnh đều tải lên thất bại. Vui lòng thử lại.', 'error');
    }
  }

  // ---------------------------------------------------------------------------
  // Gallery actions
  // ---------------------------------------------------------------------------

  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order);

  function handleSetPrimary(imageId: string) {
    startTransition(async () => {
      const res = await setProductPrimaryImageAction(productId, imageId);
      if (res.ok) {
        toast('Đã thiết lập làm ảnh chính.', 'success');
        router.refresh();
      } else {
        toast(res.error || 'Không thể thiết lập ảnh chính.', 'error');
      }
    });
  }

  function handleToggleActive(imageId: string, currentActive: boolean) {
    startTransition(async () => {
      const res = await toggleProductImageActiveAction(imageId, !currentActive);
      if (res.ok) {
        toast(!currentActive ? 'Đã hiển thị hình ảnh.' : 'Đã ẩn hình ảnh.', 'success');
        router.refresh();
      } else {
        toast(res.error || 'Không thể thay đổi trạng thái hình ảnh.', 'error');
      }
    });
  }

  function handleMove(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedImages.length) return;

    startTransition(async () => {
      const reordered = [...sortedImages];
      const temp = reordered[index];
      reordered[index] = reordered[targetIndex];
      reordered[targetIndex] = temp;

      const res = await reorderProductImagesAction(productId, reordered.map((img) => img.id));
      if (res.ok) {
        toast('Đã thay đổi thứ tự hình ảnh.', 'success');
        router.refresh();
      } else {
        toast(res.error || 'Không thể thay đổi thứ tự.', 'error');
      }
    });
  }

  async function handleSaveEdit() {
    if (!editingImageId) return;
    setIsSavingEdit(true);
    setEditError(null);

    const formData = new FormData();
    formData.append('id', editingImageId);
    formData.append('alt', editAlt);
    formData.append('sort_order', String(editSortOrder));
    formData.append('is_active', String(editIsActive));

    const res = await updateProductImageAction({ ok: false }, formData);
    setIsSavingEdit(false);

    if (res.ok) {
      toast('Đã cập nhật hình ảnh.', 'success');
      setEditingImageId(null);
      router.refresh();
    } else {
      setEditError(res.error ?? 'Cập nhật thất bại.');
    }
  }

  // ---------------------------------------------------------------------------
  // Derived counts for queue status display
  // ---------------------------------------------------------------------------

  const pendingCount = queue.filter((f) => !f.clientError && (f.status === 'pending' || f.status === 'error')).length;
  const invalidCount = queue.filter((f) => !!f.clientError).length;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6 text-xs text-slate-700">

      {/* ------------------------------------------------------------------ */}
      {/* Upload area                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
        <h4 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#1B3A6B]">
          <ImageIcon className="h-4 w-4 text-blue-600" />
          Tải lên hình ảnh mới
        </h4>

        <DropZone onFiles={handleNewFiles} disabled={isUploading || queue.length >= MAX_FILES_PER_BATCH} />

        {/* Queue cards */}
        {queue.length > 0 && (
          <div className="space-y-2">
            {queue.map((item, i) => (
              <QueueCard
                key={item.localId}
                item={item}
                isFirst={i === 0 && !item.clientError}
                onRemove={removeFromQueue}
                onAltChange={updateQueueAlt}
                onPrimaryChange={toggleQueuePrimary}
              />
            ))}

            <div className="flex items-center justify-between pt-1">
              <div className="text-[10px] text-slate-500">
                {pendingCount > 0 && (
                  <span>{pendingCount} ảnh sẵn sàng tải lên</span>
                )}
                {invalidCount > 0 && (
                  <span className="ml-2 text-red-500">· {invalidCount} ảnh không hợp lệ (sẽ bỏ qua)</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    queue.forEach((f) => URL.revokeObjectURL(f.preview));
                    setQueue([]);
                  }}
                  disabled={isUploading}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition"
                >
                  Xóa tất cả
                </button>
                <button
                  type="button"
                  onClick={uploadAll}
                  disabled={isUploading || pendingCount === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B3A6B] px-4 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-[#0c1a30] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  {isUploading ? 'Đang tải lên…' : `Tải lên ${pendingCount} ảnh`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Inline edit form                                                    */}
      {/* ------------------------------------------------------------------ */}
      {editingImageId && (
        <div className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/20 p-4">
          <h4 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#1B3A6B]">
            Cập nhật chi tiết ảnh
          </h4>

          {editError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-xs font-medium text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {editError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block font-bold text-slate-700">Mô tả ảnh (Alt text):</label>
              <input
                type="text"
                value={editAlt}
                onChange={(e) => setEditAlt(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white p-2 focus:border-[#1B3A6B] focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]/20"
              />
            </div>

            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <label className="block font-bold text-slate-700">Thứ tự sắp xếp:</label>
                <input
                  type="number"
                  min="0"
                  value={editSortOrder}
                  onChange={(e) => setEditSortOrder(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 font-mono font-bold focus:border-[#1B3A6B] focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]/20"
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 pb-2 text-xs font-bold select-none text-slate-700">
                <input
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="rounded border-slate-300 text-[#1B3A6B] focus:ring-[#1B3A6B]/30"
                />
                Hiển thị
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => { setEditingImageId(null); setEditError(null); }}
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={isSavingEdit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Lưu thay đổi
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Image gallery                                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-3">
        <h4 className="text-xs font-extrabold text-slate-800">
          Danh sách hình ảnh hiện có ({sortedImages.length})
        </h4>

        {sortedImages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/20 p-8 text-center text-slate-400">
            <ImageIcon className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            <p className="font-bold">Sản phẩm này chưa có hình ảnh nào.</p>
            <p className="mt-0.5 text-[10px]">Tải lên hình ảnh đầu tiên ở trên.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {sortedImages.map((img, index) => (
              <div
                key={img.id}
                className={`relative flex flex-col justify-between rounded-xl border bg-white p-3 transition hover:shadow-md ${
                  img.is_primary
                    ? 'border-blue-200 bg-blue-50/5 shadow-xs ring-1 ring-blue-500/25'
                    : 'border-slate-200'
                }`}
              >
                {/* Badges */}
                <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
                  {img.is_primary && (
                    <span className="flex items-center gap-0.5 rounded bg-blue-600 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-white shadow-sm">
                      <Star className="h-2.5 w-2.5 shrink-0 fill-white" /> Ảnh đại diện
                    </span>
                  )}
                  {!img.is_active && (
                    <span className="rounded bg-slate-500 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-white shadow-sm">
                      Đang ẩn
                    </span>
                  )}
                </div>

                {/* Thumbnail */}
                <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                  {img.public_url ? (
                    <Image
                      src={img.public_url}
                      alt={img.alt || 'Ảnh sản phẩm'}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-slate-300" />
                    </div>
                  )}
                </div>

                {/* Meta + reorder */}
                <div className="mb-3 flex flex-1 flex-col justify-between space-y-1.5">
                  <div>
                    <p className="line-clamp-1 font-bold text-slate-800" title={img.alt || 'Không có mô tả'}>
                      {img.alt || <span className="font-medium italic text-slate-400">Không có mô tả (alt)</span>}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                      Lớp xếp: <span className="font-bold text-slate-700">#{img.sort_order}</span>
                    </p>
                  </div>

                  <div className="flex gap-1 pt-1.5">
                    <button
                      type="button"
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0 || isPending}
                      className="rounded bg-slate-100 p-1 text-slate-600 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 transition"
                      title="Di chuyển lên trước"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === sortedImages.length - 1 || isPending}
                      className="rounded bg-slate-100 p-1 text-slate-600 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 transition"
                      title="Di chuyển xuống sau"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Action row */}
                <div className="flex items-center gap-1 border-t border-slate-100 pt-2">
                  {!img.is_primary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(img.id)}
                      disabled={isPending || !img.is_active}
                      className="flex-1 rounded py-1 text-center text-[9px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition disabled:opacity-40"
                    >
                      Đặt chính
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleToggleActive(img.id, img.is_active)}
                    disabled={isPending}
                    className="rounded border border-slate-200 bg-slate-50 p-1 text-slate-500 hover:bg-slate-100 transition"
                    title={img.is_active ? 'Ẩn ảnh' : 'Hiện ảnh'}
                  >
                    {img.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingImageId(img.id);
                      setEditAlt(img.alt || '');
                      setEditSortOrder(img.sort_order);
                      setEditIsActive(img.is_active);
                      setEditError(null);
                    }}
                    disabled={isPending}
                    className="flex-1 rounded bg-slate-100 py-1 text-center text-[9px] font-bold text-slate-600 hover:bg-slate-200 transition"
                  >
                    Sửa
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(img.id)}
                    disabled={isPending}
                    className="rounded border border-red-200 bg-red-50 p-1 text-red-600 hover:bg-red-100 transition"
                    title="Xóa hình ảnh"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Delete confirm dialog                                               */}
      {/* ------------------------------------------------------------------ */}
      <AdminConfirmDialog
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        title="Xóa hình ảnh sản phẩm"
        description="Hành động này sẽ xóa vĩnh viễn hình ảnh khỏi dữ liệu và dọn dẹp bộ nhớ Storage. Bạn có chắc chắn muốn tiếp tục?"
        itemName="Hình ảnh đã chọn"
        confirmLabel="Xóa hình ảnh"
        onConfirm={async () => {
          if (!confirmDeleteId) return { ok: false, error: 'Thiếu ID hình ảnh.' };
          return deleteProductImageAction(confirmDeleteId);
        }}
        onSuccess={() => {
          toast('Đã xóa hình ảnh sản phẩm.', 'success');
          setConfirmDeleteId(null);
          router.refresh();
        }}
      />
    </div>
  );
}
