'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Image from 'next/image';
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
  clientError?: string;
}

function validateFileClient(file: File): string | null {
  const ext = `.${(file.name.split('.').pop() ?? '').toLowerCase()}`;
  if (!ALLOWED_MIME_TYPES.has(file.type) || !ALLOWED_EXTENSIONS.has(ext)) {
    return 'Chi chap nhan JPG, PNG, WebP.';
  }

  if (file.size > MAX_FILE_BYTES) {
    return `Vuot qua 5 MB (${(file.size / 1024 / 1024).toFixed(1)} MB).`;
  }

  return null;
}

function DropZone({ onFiles, disabled }: { onFiles: (files: File[]) => void; disabled?: boolean }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragOver(false);
    if (disabled) {
      return;
    }

    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      onFiles(files);
    }
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
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) {
          setDragOver(true);
        }
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <Upload className={`h-8 w-8 transition ${dragOver ? 'text-[#1B3A6B]' : 'text-slate-300'}`} />
      <div className="text-center">
        <p className="text-xs font-semibold text-slate-600">
          Keo tha anh vao day, hoac <span className="text-[#1B3A6B] underline underline-offset-2">chon tu may tinh</span>
        </p>
        <p className="mt-0.5 text-[10px] text-slate-400">
          JPG · PNG · WebP · Toi da 5 MB/anh · {MAX_FILES_PER_BATCH} anh moi lan
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 0) {
            onFiles(files);
          }
          event.target.value = '';
        }}
      />
    </label>
  );
}

function QueueCard({
  item,
  isFirst,
  onRemove,
  onAltChange,
  onPrimaryChange,
}: {
  item: QueuedFile;
  isFirst: boolean;
  onRemove: (id: string) => void;
  onAltChange: (id: string, alt: string) => void;
  onPrimaryChange: (id: string) => void;
}) {
  const statusColor: Record<FileStatus, string> = {
    pending: 'border-slate-200',
    uploading: 'border-[#1B3A6B] ring-1 ring-[#1B3A6B]/20',
    done: 'border-emerald-300 ring-1 ring-emerald-400/20',
    error: 'border-red-300 ring-1 ring-red-300/20',
  };

  return (
    <div className={`rounded-xl border bg-white p-3 transition ${statusColor[item.status]}`}>
      <div className="flex gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
          <Image src={item.preview} alt={item.alt || item.file.name} fill className="object-cover" unoptimized />
          {item.status === 'uploading' ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 className="h-5 w-5 animate-spin text-[#1B3A6B]" />
            </div>
          ) : null}
          {item.status === 'done' ? (
            <div className="absolute inset-0 flex items-center justify-center bg-emerald-50/80">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-semibold text-slate-700" title={item.file.name}>
              {item.file.name}
            </p>
            {item.status !== 'uploading' && item.status !== 'done' ? (
              <button
                type="button"
                onClick={() => onRemove(item.localId)}
                className="shrink-0 rounded p-0.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                title="Bo anh nay"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <p className="text-[10px] text-slate-400">{(item.file.size / 1024).toFixed(0)} KB</p>

          {item.clientError ? (
            <p className="text-[10px] font-semibold text-red-600">
              <AlertCircle className="mr-0.5 inline h-3 w-3" />
              {item.clientError}
            </p>
          ) : null}

          {item.status === 'error' && item.error ? (
            <p className="text-[10px] font-semibold text-red-600">
              <AlertCircle className="mr-0.5 inline h-3 w-3" />
              {item.error}
            </p>
          ) : null}

          {(item.status === 'pending' || item.status === 'error') && !item.clientError ? (
            <input
              type="text"
              value={item.alt}
              onChange={(event) => onAltChange(item.localId, event.target.value)}
              placeholder="Alt text (tuy chon)"
              className="w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] placeholder-slate-300 focus:border-[#1B3A6B] focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]/20"
            />
          ) : null}
        </div>
      </div>

      {(item.status === 'pending' || item.status === 'error') && !item.clientError ? (
        <label className="mt-2 flex cursor-pointer items-center gap-1.5 text-[10px] font-semibold text-slate-600 select-none">
          <input
            type="checkbox"
            checked={item.isPrimary}
            onChange={() => onPrimaryChange(item.localId)}
            className="rounded border-slate-300 text-[#1B3A6B] focus:ring-[#1B3A6B]/30"
          />
          {isFirst ? 'Dat lam anh dai dien chinh' : 'Anh dai dien chinh'}
        </label>
      ) : null}
    </div>
  );
}

export function ProductMediaManager({ productId, images }: ProductMediaManagerProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [editAlt, setEditAlt] = useState('');
  const [editSortOrder, setEditSortOrder] = useState(0);
  const [editIsActive, setEditIsActive] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    return () => {
      queue.forEach((item) => URL.revokeObjectURL(item.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleNewFiles(files: File[]) {
    const remaining = MAX_FILES_PER_BATCH - queue.length;
    if (remaining <= 0) {
      toast(`Toi da ${MAX_FILES_PER_BATCH} anh moi lan tai len.`, 'error');
      return;
    }

    const accepted = files.slice(0, remaining);
    const newItems: QueuedFile[] = accepted.map((file) => ({
      localId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      preview: URL.createObjectURL(file),
      alt: '',
      isPrimary: false,
      status: 'pending',
      clientError: validateFileClient(file) ?? undefined,
    }));

    setQueue((prev) => [...prev, ...newItems]);

    if (files.length > remaining) {
      toast(`Chi them duoc ${remaining} anh do da dat gioi han ${MAX_FILES_PER_BATCH}.`, 'info');
    }
  }

  function removeFromQueue(localId: string) {
    setQueue((prev) => {
      const item = prev.find((entry) => entry.localId === localId);
      if (item) {
        URL.revokeObjectURL(item.preview);
      }
      return prev.filter((entry) => entry.localId !== localId);
    });
  }

  function updateQueueAlt(localId: string, alt: string) {
    setQueue((prev) => prev.map((entry) => (entry.localId === localId ? { ...entry, alt } : entry)));
  }

  function toggleQueuePrimary(localId: string) {
    setQueue((prev) =>
      prev.map((entry) =>
        entry.localId === localId ? { ...entry, isPrimary: !entry.isPrimary } : { ...entry, isPrimary: false },
      ),
    );
  }

  async function uploadAll() {
    const uploadable = queue.filter(
      (entry) => !entry.clientError && (entry.status === 'pending' || entry.status === 'error'),
    );
    if (uploadable.length === 0) {
      return;
    }

    setIsUploading(true);

    let successCount = 0;
    let nextSortOrder = images.length;

    for (const item of uploadable) {
      setQueue((prev) =>
        prev.map((entry) =>
          entry.localId === item.localId ? { ...entry, status: 'uploading', error: undefined } : entry,
        ),
      );

      const formData = new FormData();
      formData.append('file', item.file);
      formData.append('product_id', productId);
      formData.append('alt', item.alt.trim());
      formData.append('sort_order', String(nextSortOrder));
      formData.append('is_primary', String(item.isPrimary));

      const result: ActionState = await uploadProductImageAction({ ok: false }, formData);

      if (result.ok) {
        successCount += 1;
        nextSortOrder += 1;
        setQueue((prev) =>
          prev.map((entry) => (entry.localId === item.localId ? { ...entry, status: 'done' } : entry)),
        );
      } else {
        setQueue((prev) =>
          prev.map((entry) =>
            entry.localId === item.localId
              ? { ...entry, status: 'error', error: result.error ?? 'Tai len that bai.' }
              : entry,
          ),
        );
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      toast(
        successCount === uploadable.length
          ? `Da tai len ${successCount} anh thanh cong.`
          : `Tai len ${successCount}/${uploadable.length} anh thanh cong.`,
        successCount === uploadable.length ? 'success' : 'error',
      );
      router.refresh();
      setTimeout(() => {
        setQueue((prev) => {
          prev.filter((entry) => entry.status === 'done').forEach((entry) => URL.revokeObjectURL(entry.preview));
          return prev.filter((entry) => entry.status !== 'done');
        });
      }, 1200);
    } else {
      toast('Tat ca anh deu tai len that bai. Vui long thu lai.', 'error');
    }
  }

  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order);
  const pendingCount = queue.filter(
    (entry) => !entry.clientError && (entry.status === 'pending' || entry.status === 'error'),
  ).length;
  const invalidCount = queue.filter((entry) => Boolean(entry.clientError)).length;

  function handleSetPrimary(imageId: string) {
    startTransition(async () => {
      const result = await setProductPrimaryImageAction(productId, imageId);
      if (result.ok) {
        toast('Da thiet lap lam anh chinh.', 'success');
        router.refresh();
      } else {
        toast(result.error || 'Khong the thiet lap anh chinh.', 'error');
      }
    });
  }

  function handleToggleActive(imageId: string, currentActive: boolean) {
    startTransition(async () => {
      const result = await toggleProductImageActiveAction(imageId, !currentActive);
      if (result.ok) {
        toast(!currentActive ? 'Da hien thi hinh anh.' : 'Da an hinh anh.', 'success');
        router.refresh();
      } else {
        toast(result.error || 'Khong the thay doi trang thai hinh anh.', 'error');
      }
    });
  }

  function handleMove(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedImages.length) {
      return;
    }

    startTransition(async () => {
      const reordered = [...sortedImages];
      const temp = reordered[index];
      reordered[index] = reordered[targetIndex];
      reordered[targetIndex] = temp;

      const result = await reorderProductImagesAction(productId, reordered.map((image) => image.id));
      if (result.ok) {
        toast('Da thay doi thu tu hinh anh.', 'success');
        router.refresh();
      } else {
        toast(result.error || 'Khong the thay doi thu tu.', 'error');
      }
    });
  }

  async function handleSaveEdit() {
    if (!editingImageId) {
      return;
    }

    setIsSavingEdit(true);
    setEditError(null);

    const formData = new FormData();
    formData.append('id', editingImageId);
    formData.append('alt', editAlt);
    formData.append('sort_order', String(editSortOrder));
    formData.append('is_active', String(editIsActive));

    const result = await updateProductImageAction({ ok: false }, formData);
    setIsSavingEdit(false);

    if (result.ok) {
      toast('Da cap nhat hinh anh.', 'success');
      setEditingImageId(null);
      router.refresh();
    } else {
      setEditError(result.error ?? 'Cap nhat that bai.');
    }
  }

  return (
    <div className="space-y-6 text-xs text-slate-700">
      <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#1B3A6B]">
              <ImageIcon className="h-4 w-4 text-blue-600" />
              Tai len hinh anh moi
            </h4>
            <p className="mt-1 text-[10px] font-medium leading-relaxed text-slate-500">
              Uu tien danh dau anh dai dien ngay trong hang doi de san pham luon co thumbnail dung sau khi upload.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-3 text-[10px] font-medium text-slate-500 sm:grid-cols-4">
            <div>
              <p className="text-slate-400">Tong anh</p>
              <p className="mt-1 text-sm font-bold text-slate-800">{sortedImages.length}</p>
            </div>
            <div>
              <p className="text-slate-400">Anh chinh</p>
              <p className="mt-1 text-sm font-bold text-slate-800">
                {sortedImages.some((image) => image.is_primary) ? 'Da co' : 'Chua co'}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Dang hien</p>
              <p className="mt-1 text-sm font-bold text-emerald-700">
                {sortedImages.filter((image) => image.is_active).length}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Dang an</p>
              <p className="mt-1 text-sm font-bold text-slate-600">
                {sortedImages.filter((image) => !image.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <DropZone onFiles={handleNewFiles} disabled={isUploading || queue.length >= MAX_FILES_PER_BATCH} />

        {queue.length > 0 ? (
          <div className="space-y-2">
            {queue.map((item, index) => (
              <QueueCard
                key={item.localId}
                item={item}
                isFirst={index === 0 && !item.clientError}
                onRemove={removeFromQueue}
                onAltChange={updateQueueAlt}
                onPrimaryChange={toggleQueuePrimary}
              />
            ))}

            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-[10px] text-slate-500">
                {pendingCount > 0 ? <span>{pendingCount} anh san sang tai len</span> : null}
                {invalidCount > 0 ? (
                  <span className="ml-2 text-red-500">· {invalidCount} anh khong hop le (se bo qua)</span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    queue.forEach((item) => URL.revokeObjectURL(item.preview));
                    setQueue([]);
                  }}
                  disabled={isUploading}
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Xoa tat ca
                </button>
                <button
                  type="button"
                  onClick={uploadAll}
                  disabled={isUploading || pendingCount === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#1B3A6B] px-4 py-2 text-[11px] font-bold text-white shadow-sm transition hover:bg-[#0c1a30] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  {isUploading ? 'Dang tai len...' : `Tai len ${pendingCount} anh`}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {editingImageId ? (
        <div className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/20 p-4">
          <h4 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#1B3A6B]">
            Cap nhat chi tiet anh
          </h4>

          {editError ? (
            <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-xs font-medium text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {editError}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block font-bold text-slate-700">Mo ta anh (Alt text)</label>
              <input
                type="text"
                value={editAlt}
                onChange={(event) => setEditAlt(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white p-2 focus:border-[#1B3A6B] focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]/20"
              />
            </div>

            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <label className="block font-bold text-slate-700">Thu tu sap xep</label>
                <input
                  type="number"
                  min="0"
                  value={editSortOrder}
                  onChange={(event) => setEditSortOrder(Math.max(0, parseInt(event.target.value) || 0))}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 font-mono font-bold focus:border-[#1B3A6B] focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]/20"
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 pb-2 text-xs font-bold text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(event) => setEditIsActive(event.target.checked)}
                  className="rounded border-slate-300 text-[#1B3A6B] focus:ring-[#1B3A6B]/30"
                />
                Hien thi
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setEditingImageId(null);
                setEditError(null);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Huy
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={isSavingEdit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Luu thay doi
            </button>
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-xs font-extrabold text-slate-800">Danh sach hinh anh hien co ({sortedImages.length})</h4>
          <span className="text-[10px] font-medium text-slate-400">Keo thu tu, dat anh chinh, hoac an anh khong dung.</span>
        </div>

        {sortedImages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/20 p-8 text-center text-slate-400">
            <ImageIcon className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            <p className="font-bold">San pham nay chua co hinh anh nao.</p>
            <p className="mt-0.5 text-[10px]">Tai len hinh anh dau tien o khu vuc ben tren.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {sortedImages.map((image, index) => (
              <div
                key={image.id}
                className={`relative flex flex-col justify-between rounded-xl border bg-white p-3 transition hover:shadow-md ${
                  image.is_primary
                    ? 'border-blue-200 bg-blue-50/5 shadow-xs ring-1 ring-blue-500/25'
                    : 'border-slate-200'
                }`}
              >
                <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
                  {image.is_primary ? (
                    <span className="flex items-center gap-0.5 rounded bg-blue-600 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-white shadow-sm">
                      <Star className="h-2.5 w-2.5 shrink-0 fill-white" />
                      Anh dai dien
                    </span>
                  ) : null}
                  {!image.is_active ? (
                    <span className="rounded bg-slate-500 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-white shadow-sm">
                      Dang an
                    </span>
                  ) : null}
                </div>

                <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                  {image.public_url ? (
                    <Image
                      src={image.public_url}
                      alt={image.alt || 'Anh san pham'}
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

                <div className="mb-3 flex flex-1 flex-col justify-between space-y-2">
                  <div>
                    <p className="line-clamp-1 font-bold text-slate-800" title={image.alt || 'Khong co mo ta'}>
                      {image.alt || <span className="font-medium italic text-slate-400">Khong co mo ta (alt)</span>}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                      Lop xep: <span className="font-bold text-slate-700">#{image.sort_order}</span>
                    </p>
                  </div>

                  <div className="flex gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0 || isPending}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                      title="Di chuyen len truoc"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                      Len
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === sortedImages.length - 1 || isPending}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                      title="Di chuyen xuong sau"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                      Xuong
                    </button>
                  </div>
                </div>

                <div className={`grid gap-2 border-t border-slate-100 pt-3 ${image.is_primary ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  {!image.is_primary ? (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(image.id)}
                      disabled={isPending || !image.is_active}
                      className="inline-flex items-center justify-center rounded-md bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-700 transition hover:bg-blue-100 disabled:opacity-40"
                    >
                      Dat anh chinh
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => handleToggleActive(image.id, image.is_active)}
                    disabled={isPending}
                    className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-500 transition hover:bg-slate-100"
                    title={image.is_active ? 'An anh' : 'Hien anh'}
                  >
                    {image.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {image.is_active ? 'An anh' : 'Hien anh'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingImageId(image.id);
                      setEditAlt(image.alt || '');
                      setEditSortOrder(image.sort_order);
                      setEditIsActive(image.is_active);
                      setEditError(null);
                    }}
                    disabled={isPending}
                    className="inline-flex items-center justify-center rounded-md bg-slate-100 px-3 py-2 text-[10px] font-bold text-slate-600 transition hover:bg-slate-200"
                  >
                    Chinh sua
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(image.id)}
                    disabled={isPending}
                    className="inline-flex items-center justify-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-bold text-red-600 transition hover:bg-red-100"
                    title="Xoa hinh anh"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Xoa anh
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AdminConfirmDialog
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        title="Xoa hinh anh san pham"
        description="Hanh dong nay se xoa vinh vien hinh anh khoi du lieu va don dep bo nho Storage. Ban co chac chan muon tiep tuc?"
        itemName="Hinh anh da chon"
        confirmLabel="Xoa hinh anh"
        onConfirm={async () => {
          if (!confirmDeleteId) {
            return { ok: false, error: 'Thieu ID hinh anh.' };
          }

          return deleteProductImageAction(confirmDeleteId);
        }}
        onSuccess={() => {
          toast('Da xoa hinh anh san pham.', 'success');
          setConfirmDeleteId(null);
          router.refresh();
        }}
      />
    </div>
  );
}
