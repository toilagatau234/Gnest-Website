'use client';

import { useRef, useState } from 'react';
import { AlertCircle, ImageIcon, Star, Upload, X, Percent } from 'lucide-react';

import { SpecsEditor } from '@/components/admin/SpecsEditor';
import { AdminToggle } from '@/components/admin/AdminToggle';
import { formatCurrencyInput } from '@/lib/utils/currency';
import type { AdminCategory } from '@/lib/services/admin/categories';
import type { ProductFormData } from '@/lib/services/admin/products';
import type { AdminFormState } from '@/app/admin/(dashboard)/products/actions';
import { ProductMediaManager } from '@/components/admin/ProductMediaManager';
import { ProductBulkDiscountManager, type ProductDiscount } from '@/components/admin/ProductBulkDiscountManager';

// ---------------------------------------------------------------------------
// Types exported so ProductFormDialog can share them
// ---------------------------------------------------------------------------

export interface QueuedImageFile {
  localId: string;
  file: File;
  preview: string;
  isPrimary: boolean;
  clientError?: string;
}

export type ExistingProductImage = {
  id: string;
  public_url: string | null;
  alt: string | null;
  sort_order: number;
  is_primary: boolean;
  is_active: boolean;
};

interface ProductFormProps {
  formId: string;
  formAction: (payload: FormData) => void;
  state: AdminFormState;
  categories: AdminCategory[];
  product?: ProductFormData;
  // Create mode: controlled image queue from parent
  imageQueue?: QueuedImageFile[];
  onFilesAdd?: (files: File[]) => void;
  onRemoveQueuedImage?: (localId: string) => void;
  onTogglePrimaryQueuedImage?: (localId: string) => void;
  onClearQueue?: () => void;
  // Edit mode: existing images & discounts
  existingImages?: ExistingProductImage[];
  existingDiscounts?: ProductDiscount[];
  onMutated?: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_IMAGES = 10;

type TabId = 'basic' | 'pricing' | 'specs' | 'media';

const TABS: { id: TabId; label: string }[] = [
  { id: 'basic', label: 'Thông tin cơ bản' },
  { id: 'pricing', label: 'Giá & kho sỉ' },
  { id: 'specs', label: 'Thông số kỹ thuật' },
  { id: 'media', label: 'Media & Giá sỉ' },
];

const fieldClass = 'admin-input text-xs';
const selectClass = 'admin-select text-xs';
const labelClass = 'mb-1.5 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-[#646464]';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function tabForError(error: string): TabId | null {
  const text = error.toLowerCase();
  if (text.includes('specs') || text.includes('json') || text.includes('thông số')) return 'specs';
  if (text.includes('tồn kho') || text.includes('giá') || text.includes('kho')) return 'pricing';
  if (text.includes('tên') || text.includes('slug')) return 'basic';
  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProductForm({
  formId,
  formAction,
  state,
  categories,
  product,
  imageQueue = [],
  onFilesAdd,
  onRemoveQueuedImage,
  onTogglePrimaryQueuedImage,
  onClearQueue,
  existingImages,
  existingDiscounts = [],
  onMutated,
}: ProductFormProps) {
  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const [activeMediaTab, setActiveMediaTab] = useState<'images' | 'discounts'>('images');
  const [name, setName] = useState(product?.name ?? '');
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [price, setPrice] = useState<string>(() => {
    if (product?.price === undefined || product?.price === null) return '';
    return formatCurrencyInput(String(product.price));
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrice(formatCurrencyInput(e.target.value));
  };

  const activeCategories = categories.filter(
    (c) => c.is_active || c.id === product?.category_id,
  );
  const visibleTab = state.error ? (tabForError(state.error) ?? activeTab) : activeTab;

  const validQueueCount = imageQueue.filter((f) => !f.clientError).length;
  const invalidCount = imageQueue.filter((f) => Boolean(f.clientError)).length;
  const mediaBadge = product ? (existingImages?.length ?? 0) : validQueueCount;

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onFilesAdd?.(files);
  }

  return (
    // Outer div holds the layout; the <form> inside uses display:contents so its
    // children participate directly in this flex container. Edit-mode Media & Giá sỉ
    // is rendered outside the <form> to prevent nested <form> elements (IMP-05).
    <div className="flex min-h-[620px] flex-col gap-5">

      {/* Tab bar */}
      <div className="sticky -top-5 z-10 -mx-5 -mt-5 mb-1 flex gap-1 overflow-x-auto border-b border-[#EEF2F6] bg-white/95 px-5 pt-2 backdrop-blur">
        {TABS.map((tab) => {
          const active = visibleTab === tab.id;
          const badge = tab.id === 'media' && mediaBadge > 0 ? mediaBadge : null;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-current={active ? 'true' : undefined}
              className={`-mb-px shrink-0 cursor-pointer border-b-2 px-4 py-2.5 text-xs font-bold transition-colors ${
                active ? 'border-[#4880FF] text-[#3749A6]' : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {badge ? (
                <span className="ml-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#4880FF]/15 px-1 text-[10px] font-black text-[#3749A6]">
                  {badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Error banner */}
      {state.error ? (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-[#FFF5F5] px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#E31E24]" />
          <p className="text-xs font-medium text-[#B42318]">{state.error}</p>
        </div>
      ) : null}

      {/* Product update form — display:contents keeps children as flex items.
          Only wraps product fields; edit-mode media managers live outside. */}
      <form id={formId} action={formAction} className="contents">
        {product ? <input type="hidden" name="id" value={product.id} /> : null}

        {/* ── Basic info ─────────────────────────────────────────────────────── */}
        <div className={visibleTab === 'basic' ? 'animate-fade-in flex-1 space-y-4' : 'hidden'}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>
                Tên sản phẩm <span className="text-[#E31E24]">*</span>
              </span>
              <input
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={fieldClass}
                placeholder="VD: Hũ thủy tinh 500ml"
              />
            </label>

            <label className="block">
              <span className={labelClass}>
                Slug / Link dẫn URL <span className="text-[#E31E24]">*</span>
              </span>
              <input
                name="slug"
                type="text"
                required
                value={slug}
                onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }}
                className={`${fieldClass} font-mono`}
                placeholder="hu-thuy-tinh-500ml"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className={labelClass}>Danh mục thuộc về</span>
              <select name="category_id" defaultValue={product?.category_id ?? ''} className={selectClass}>
                <option value="">Chưa phân loại</option>
                {activeCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className={labelClass}>Mô tả ngắn catalog</span>
            <textarea
              name="description"
              rows={4}
              defaultValue={product?.description ?? ''}
              className="admin-input min-h-28 max-h-48 py-2 text-xs font-normal leading-relaxed"
              placeholder="Mô tả ngắn hiển thị cho đại lý sỉ tham khảo"
            />
          </label>

          <div className="admin-soft-panel px-4 py-3">
            <AdminToggle
              name="is_active"
              defaultChecked={product?.is_active ?? true}
              label="Hiển thị công khai"
              description="Bật để hiển thị công khai trên website, tắt để ẩn khỏi website."
            />
          </div>

          <div className="admin-soft-panel px-4 py-3">
            <AdminToggle
              name="is_featured"
              defaultChecked={product?.is_featured ?? false}
              label="Sản phẩm nổi bật"
              description="Ưu tiên hiển thị sản phẩm này trước các sản phẩm thường trong cùng danh mục."
            />
          </div>
        </div>

        {/* ── Pricing ────────────────────────────────────────────────────────── */}
        <div className={visibleTab === 'pricing' ? 'animate-fade-in flex-1 space-y-4' : 'hidden'}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Giá lẻ tham khảo (VNĐ)</span>
              <input
                name="price"
                type="text"
                value={price}
                onChange={handlePriceChange}
                className={fieldClass}
                placeholder="Ví dụ: 1.000.000"
              />
              <span className="mt-1.5 block text-[10px] font-medium text-slate-400">
                Để trống nếu muốn hiển thị chữ &quot;Liên hệ&quot; thay vì giá cụ thể.
              </span>
            </label>

            <label className="block">
              <span className={labelClass}>Tồn kho sẵn sỉ</span>
              <input name="stock" type="number" min="0" defaultValue={product?.stock ?? 0} className={fieldClass} />
            </label>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-[#EEF2F6] bg-slate-50/60 px-4 py-3 text-xs leading-relaxed text-slate-500">
            <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <p>Ảnh sản phẩm và bảng bậc sỉ được liên kết sẽ kế thừa từ hệ thống Storage Supabase.</p>
          </div>
        </div>

        {/* ── Specs ──────────────────────────────────────────────────────────── */}
        <div className={visibleTab === 'specs' ? 'animate-fade-in flex-1' : 'hidden'}>
          <SpecsEditor initialSpecs={product?.specs} />
        </div>

        {/* ── Media (create mode only — image queue belongs to create form) ─── */}
        {!product ? (
          <div className={visibleTab === 'media' ? 'animate-fade-in flex-1 space-y-4' : 'hidden'}>
            <div className="space-y-3">
              <div className="rounded-xl border border-blue-100 bg-blue-50/40 px-4 py-3 text-xs text-blue-700">
                Bạn đang tạo sản phẩm mới. Vui lòng hoàn tất đăng sản phẩm trước khi thiết lập bậc giá sỉ hoặc quản lý hình ảnh nâng cao.
              </div>
              {/* Drop zone */}
              <label
                className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 px-6 py-8 text-center transition hover:border-[#1B3A6B]/50 hover:bg-slate-50"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
              >
                <Upload className="h-8 w-8 text-slate-300" />
                <span className="text-xs font-semibold text-slate-600">
                  Kéo thả hoặc <span className="text-[#1B3A6B] underline underline-offset-2">chọn ảnh từ máy tính</span>
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  JPG · PNG · WebP · Tối đa 5 MB/ảnh · {MAX_IMAGES} ảnh mỗi sản phẩm
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    if (files.length > 0) onFilesAdd?.(files);
                    e.target.value = '';
                  }}
                />
              </label>

              {imageQueue.length > 0 ? (
                <div className="space-y-3">
                  {/* Summary row */}
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-600">
                      {validQueueCount > 0 ? (
                        <span className="text-slate-700">{validQueueCount} ảnh sẵn sàng tải lên</span>
                      ) : null}
                      {invalidCount > 0 ? (
                        <span className="ml-1.5 text-rose-500">· {invalidCount} ảnh không hợp lệ</span>
                      ) : null}
                    </p>
                    <button
                      type="button"
                      onClick={onClearQueue}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-500 transition hover:border-rose-200 hover:text-rose-600"
                    >
                      <X className="h-3.5 w-3.5" />
                      Xóa tất cả
                    </button>
                  </div>

                  {/* Image grid */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {imageQueue.map((item) => (
                      <div
                        key={item.localId}
                        className={`overflow-hidden rounded-xl border bg-white transition ${
                          item.clientError
                            ? 'border-rose-200 bg-rose-50/40'
                            : item.isPrimary
                              ? 'border-[#1B3A6B] ring-2 ring-[#1B3A6B]/15'
                              : 'border-slate-200'
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="relative aspect-video bg-slate-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.preview}
                            alt={item.file.name}
                            className="h-full w-full object-cover"
                          />
                          {item.isPrimary && !item.clientError ? (
                            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-[#1B3A6B] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                              <Star className="h-2.5 w-2.5 fill-white" />
                              Thumbnail
                            </span>
                          ) : null}
                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => onRemoveQueuedImage?.(item.localId)}
                            className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1 shadow transition hover:bg-red-50 hover:text-red-600"
                            title="Bỏ ảnh này"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Card body */}
                        <div className="space-y-2 p-3">
                          <p className="truncate text-[11px] font-semibold text-slate-700" title={item.file.name}>
                            {item.file.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {(item.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>

                          {item.clientError ? (
                            <p className="flex items-start gap-1 text-[10px] font-semibold text-rose-600">
                              <AlertCircle className="mt-px h-3 w-3 shrink-0" />
                              {item.clientError}
                            </p>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onTogglePrimaryQueuedImage?.(item.localId)}
                              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-semibold transition ${
                                item.isPrimary
                                  ? 'bg-[#1B3A6B]/10 text-[#1B3A6B]'
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              }`}
                            >
                              <Star className={`h-3 w-3 ${item.isPrimary ? 'fill-[#1B3A6B]' : ''}`} />
                              {item.isPrimary ? 'Ảnh chính' : 'Đặt làm ảnh chính'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-[#EEF2F6] bg-slate-50/60 px-4 py-3 text-xs leading-relaxed text-slate-500">
                  Có thể bỏ qua ảnh khi tạo. Thêm hoặc sắp xếp ảnh sau trong mục{' '}
                  <strong>Media &amp; Giá sỉ</strong>.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </form>

      {/* ── Media (edit mode — outside form to prevent nested <form> tags) ──── */}
      {product ? (
        <div className={visibleTab === 'media' ? 'animate-fade-in flex-1 space-y-4' : 'hidden'}>
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveMediaTab('images')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                activeMediaTab === 'images'
                  ? 'border-[#1B3A6B] text-[#1B3A6B]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Media & Hình ảnh sỉ ({existingImages?.length ?? 0})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMediaTab('discounts')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                activeMediaTab === 'discounts'
                  ? 'border-[#1B3A6B] text-[#1B3A6B]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Percent className="w-4 h-4" />
              <span>Bậc chiết khấu giá sỉ ({existingDiscounts?.length ?? 0})</span>
            </button>
          </div>

          <div className="pt-2">
            {activeMediaTab === 'images' ? (
              <ProductMediaManager
                productId={product.id}
                images={existingImages ?? []}
                onMutated={onMutated}
              />
            ) : (
              <ProductBulkDiscountManager
                productId={product.id}
                discounts={existingDiscounts ?? []}
                retailPrice={product.price ?? null}
                onMutated={onMutated}
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
