'use client';

import { useActionState, useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2, Pencil, Plus } from 'lucide-react';

import { AdminActionButton } from '@/components/admin/AdminActionButton';
import { AdminModal } from '@/components/admin/AdminModal';
import { ProductForm, type ExistingProductImage, type QueuedImageFile } from '@/components/admin/ProductForm';
import { useToast } from '@/components/admin/AdminToast';
import type { AdminCategory } from '@/lib/services/admin/categories';
import type { ProductFormData } from '@/lib/services/admin/products';
import {
  createProductAction,
  fetchProductDetailAction,
  updateProductAction,
  type AdminFormState,
} from '@/app/admin/(dashboard)/products/actions';
import { uploadProductImageAction } from '@/app/admin/(dashboard)/products/media-discount-actions';

// ---------------------------------------------------------------------------
// Constants (mirror values in media-discount-actions)
// ---------------------------------------------------------------------------

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_QUEUE = 10;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UploadResult {
  name: string;
  ok: boolean;
  error?: string;
}

type UploadPhase = 'idle' | 'uploading' | 'done';

interface ProductFormDialogProps {
  categories: AdminCategory[];
  product?: { id: string; name?: string };
}

const INITIAL_STATE: AdminFormState = { ok: false };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validateFileClient(file: File): string | undefined {
  const ext = `.${(file.name.split('.').pop() ?? '').toLowerCase()}`;
  if (!ALLOWED_MIME.has(file.type) || !ALLOWED_EXTS.has(ext)) {
    return 'Chỉ chấp nhận JPG, PNG, WebP.';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `Vượt 5 MB (${(file.size / 1024 / 1024).toFixed(1)} MB).`;
  }
  return undefined;
}

function ensureOnePrimary(queue: QueuedImageFile[]): QueuedImageFile[] {
  const valid = queue.filter((f) => !f.clientError);
  if (valid.length === 0 || valid.some((f) => f.isPrimary)) return queue;
  return queue.map((f) =>
    !f.clientError && f.localId === valid[0].localId ? { ...f, isPrimary: true } : f,
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProductFormDialog({ categories, product }: ProductFormDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const formId = useId();
  const isEdit = Boolean(product?.id);

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<ProductFormData | null>(null);
  const [loadingForm, setLoadingForm] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [existingImages, setExistingImages] = useState<ExistingProductImage[]>([]);

  // Image queue (create mode only)
  const [imageQueue, setImageQueue] = useState<QueuedImageFile[]>([]);

  // Upload phase (after product creation)
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle');
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);

  const action = isEdit ? updateProductAction : createProductAction;
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);
  const handledOk = useRef(false);
  // Keep ref to the latest queue so the effect can read it without being a dependency
  const imageQueueRef = useRef<QueuedImageFile[]>([]);
  imageQueueRef.current = imageQueue;

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      imageQueueRef.current.forEach((f) => URL.revokeObjectURL(f.preview));
    };
  }, []);

  // Handle successful form submission
  useEffect(() => {
    if (!open || !state.ok || handledOk.current) return;
    handledOk.current = true;

    if (isEdit) {
      toast('Đã cập nhật sản phẩm.', 'success');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
      router.refresh();
      return;
    }

    // Create mode: check if there are valid images to upload
    const validItems = imageQueueRef.current.filter((f) => !f.clientError);
    if (state.productId && validItems.length > 0) {
      void runImageUploads(state.productId, validItems);
    } else {
      toast('Đã đăng sản phẩm mới.', 'success');
      cleanupQueue();
      setOpen(false);
      router.refresh();
    }
  }, [open, state.ok, state.productId, isEdit]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Queue management ──────────────────────────────────────────────────────

  function handleFilesAdd(files: File[]) {
    setImageQueue((prev) => {
      const remaining = MAX_QUEUE - prev.length;
      if (remaining <= 0) {
        toast(`Tối đa ${MAX_QUEUE} ảnh mỗi sản phẩm.`, 'error');
        return prev;
      }
      const toAdd = files.slice(0, remaining);
      if (files.length > remaining) {
        toast(`Chỉ thêm được ${remaining} ảnh do đã đạt giới hạn ${MAX_QUEUE}.`, 'info');
      }
      const newItems: QueuedImageFile[] = toAdd.map((file) => ({
        localId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
        isPrimary: false,
        clientError: validateFileClient(file),
      }));
      return ensureOnePrimary([...prev, ...newItems]);
    });
  }

  function handleRemoveQueuedImage(localId: string) {
    setImageQueue((prev) => {
      const item = prev.find((f) => f.localId === localId);
      if (item) URL.revokeObjectURL(item.preview);
      return ensureOnePrimary(prev.filter((f) => f.localId !== localId));
    });
  }

  function handleTogglePrimary(localId: string) {
    setImageQueue((prev) =>
      prev.map((f) =>
        f.clientError ? f : { ...f, isPrimary: f.localId === localId },
      ),
    );
  }

  function cleanupQueue() {
    setImageQueue((prev) => {
      prev.forEach((f) => URL.revokeObjectURL(f.preview));
      return [];
    });
  }

  // ── Upload phase ──────────────────────────────────────────────────────────

  async function runImageUploads(productId: string, items: QueuedImageFile[]) {
    setUploadPhase('uploading');
    setUploadProgress({ done: 0, total: items.length });

    const results: UploadResult[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const fd = new FormData();
      fd.append('file', item.file);
      fd.append('product_id', productId);
      fd.append('alt', '');
      fd.append('sort_order', String(i));
      fd.append('is_primary', String(item.isPrimary));

      const result = await uploadProductImageAction({ ok: false }, fd);
      results.push({ name: item.file.name, ok: result.ok, error: result.error });
      setUploadProgress({ done: i + 1, total: items.length });
    }

    setUploadResults(results);
    setUploadPhase('done');

    const failCount = results.filter((r) => !r.ok).length;
    const okCount = results.filter((r) => r.ok).length;

    if (failCount === 0) {
      toast(`Đã đăng sản phẩm và tải lên ${okCount} ảnh thành công.`, 'success');
      cleanupQueue();
      setOpen(false);
    } else {
      toast(
        okCount > 0
          ? `Đã tạo sản phẩm. ${okCount}/${items.length} ảnh OK · ${failCount} thất bại.`
          : `Đã tạo sản phẩm nhưng không tải lên được ảnh nào. Thử lại từ Media & Giá sỉ.`,
        'error',
      );
    }

    router.refresh();
  }

  // ── Dialog lifecycle ──────────────────────────────────────────────────────

  const openDialog = async () => {
    handledOk.current = false;
    setFetchError(null);
    cleanupQueue();
    setUploadPhase('idle');
    setUploadResults([]);
    setUploadProgress({ done: 0, total: 0 });
    setExistingImages([]);

    if (isEdit && product?.id) {
      setLoadingForm(true);
      setFormData(null);
      setOpen(true);

      const result = await fetchProductDetailAction(product.id);
      if (result.error || !result.data) {
        setFetchError(result.error ?? 'Không tìm thấy sản phẩm');
      } else {
        const d = result.data;
        setFormData({
          id: d.id,
          name: d.name,
          slug: d.slug,
          category_id: d.category_id,
          price: d.price,
          stock: d.stock,
          is_active: d.is_active,
          description: d.description,
          specs: d.specs,
        });
        setExistingImages(d.product_images ?? []);
      }
      setLoadingForm(false);
    } else {
      setFormData(null);
      setOpen(true);
    }
  };

  const closeDialog = () => {
    if (isPending || uploadPhase === 'uploading') return;
    cleanupQueue();
    setUploadPhase('idle');
    setUploadResults([]);
    setOpen(false);
  };

  const isUploading = uploadPhase === 'uploading';
  const uploadDoneWithFailures = uploadPhase === 'done' && uploadResults.some((r) => !r.ok);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {isEdit ? (
        <AdminActionButton variant="secondary" size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={openDialog}>
          Sửa
        </AdminActionButton>
      ) : (
        <AdminActionButton icon={<Plus className="h-4 w-4" />} onClick={openDialog}>
          Thêm sản phẩm
        </AdminActionButton>
      )}

      <AdminModal
        open={open}
        onClose={closeDialog}
        title={isEdit ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}
        description="Thông tin cơ bản, giá & kho, thông số kỹ thuật và hình ảnh."
        size="2xl"
        dismissible={!isPending && !isUploading}
        footer={
          loadingForm || fetchError ? undefined : isUploading ? (
            <div className="flex w-full items-center justify-center gap-2 text-xs font-semibold text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-[#4880FF]" />
              Đang tải ảnh lên… ({uploadProgress.done}/{uploadProgress.total})
            </div>
          ) : uploadDoneWithFailures ? (
            <button
              type="button"
              onClick={closeDialog}
              className="admin-button-secondary px-6 text-xs"
            >
              Đóng
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={closeDialog}
                disabled={isPending}
                className="admin-button-secondary px-5 text-xs"
              >
                Hủy
              </button>
              <button
                type="submit"
                form={formId}
                disabled={isPending}
                className="admin-button-primary px-6 text-xs"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isPending ? 'Đang lưu…' : isEdit ? 'Cập nhật sản phẩm' : 'Đăng sản phẩm'}
              </button>
            </>
          )
        }
      >
        {loadingForm ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-[#4880FF]" />
            <span className="ml-2 text-sm text-slate-500">Đang tải thông tin sản phẩm…</span>
          </div>
        ) : fetchError ? (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-[#FFF5F5] px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#E31E24]" />
            <p className="text-xs font-medium text-[#B42318]">{fetchError}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Upload progress overlay */}
            {isUploading ? (
              <div className="flex items-center gap-3 rounded-xl border border-[#4880FF]/30 bg-[#4880FF]/5 px-4 py-3 text-xs font-semibold text-[#3749A6]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải lên ảnh {uploadProgress.done + 1}/{uploadProgress.total}…
                <span className="ml-auto text-[10px] font-medium text-slate-400">
                  Sản phẩm đã được tạo thành công
                </span>
              </div>
            ) : null}

            {/* Upload failure summary */}
            {uploadDoneWithFailures ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs">
                <p className="flex items-center gap-1.5 font-bold text-amber-800">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Sản phẩm đã được tạo — một số ảnh chưa tải lên được
                </p>
                <ul className="mt-2 space-y-1">
                  {uploadResults.map((r, i) => (
                    <li key={i} className={`flex items-start gap-1.5 ${r.ok ? 'text-emerald-700' : 'text-red-700'}`}>
                      {r.ok
                        ? <CheckCircle2 className="mt-px h-3 w-3 shrink-0" />
                        : <AlertCircle className="mt-px h-3 w-3 shrink-0" />}
                      <span className="font-medium">{r.name}</span>
                      {r.error ? <span className="ml-1 text-[10px] opacity-80">— {r.error}</span> : null}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[10px] text-amber-700">
                  Thêm ảnh thất bại sau từ nút <strong>Media &amp; Giá sỉ</strong> trong danh sách sản phẩm.
                </p>
              </div>
            ) : null}

            <ProductForm
              formId={formId}
              formAction={formAction}
              state={state}
              categories={categories}
              product={formData ?? undefined}
              imageQueue={imageQueue}
              onFilesAdd={handleFilesAdd}
              onRemoveQueuedImage={handleRemoveQueuedImage}
              onTogglePrimaryQueuedImage={handleTogglePrimary}
              onClearQueue={cleanupQueue}
              existingImages={existingImages}
            />
          </div>
        )}
      </AdminModal>
    </>
  );
}
