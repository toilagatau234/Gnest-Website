'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ImageIcon, Star, Upload, X } from 'lucide-react';

import { SpecsEditor } from '@/components/admin/SpecsEditor';
import { AdminToggle } from '@/components/admin/AdminToggle';
import type { AdminCategory } from '@/lib/services/admin/categories';
import type { ProductFormData } from '@/lib/services/admin/products';
import type { AdminFormState } from '@/app/admin/(dashboard)/products/actions';

interface ProductFormProps {
  formId: string;
  formAction: (payload: FormData) => void;
  state: AdminFormState;
  categories: AdminCategory[];
  product?: ProductFormData;
}

type TabId = 'basic' | 'pricing' | 'specs' | 'media';

const TABS: { id: TabId; label: string }[] = [
  { id: 'basic', label: 'Thông tin cơ bản' },
  { id: 'pricing', label: 'Giá & kho sỉ' },
  { id: 'specs', label: 'Thông số kỹ thuật' },
  { id: 'media', label: 'Hình ảnh' },
];

const fieldClass = 'admin-input text-xs';
const selectClass = 'admin-select text-xs';
const labelClass = 'mb-1.5 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-[#646464]';
const MAX_IMAGES = 10;

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/** Maps a server error message to the tab that owns the offending field. */
function tabForError(error: string): TabId | null {
  const text = error.toLowerCase();
  if (text.includes('specs') || text.includes('json') || text.includes('thông số')) {
    return 'specs';
  }
  if (text.includes('tồn kho') || text.includes('giá') || text.includes('kho')) {
    return 'pricing';
  }
  if (text.includes('tên') || text.includes('slug')) {
    return 'basic';
  }
  return null;
}

export function ProductForm({ formId, formAction, state, categories, product }: ProductFormProps) {
  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const [name, setName] = useState(product?.name ?? '');
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreviews, setImagePreviews] = useState<{ name: string; url: string; size: number }[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const availableTabs = product ? TABS.filter((tab) => tab.id !== 'media') : TABS;
  const activeCategories = categories.filter(
    (category) => category.is_active || category.id === product?.category_id,
  );
  const visibleTab = state.error ? tabForError(state.error) ?? activeTab : activeTab;

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [imagePreviews]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  };

  const handleImagesChange = (files: FileList | null) => {
    imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    const selected = Array.from(files ?? []).slice(0, MAX_IMAGES);
    setImagePreviews(
      selected.map((file) => ({
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
      })),
    );
    setPrimaryImageIndex(0);
  };

  const clearImages = () => {
    imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    setImagePreviews([]);
    setPrimaryImageIndex(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form id={formId} action={formAction} className="flex min-h-[620px] flex-col gap-5">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      {/* Sticky tab bar pinned beneath the modal header. */}
      <div className="sticky -top-5 z-10 -mx-5 -mt-5 mb-1 flex gap-1 overflow-x-auto border-b border-[#EEF2F6] bg-white/95 px-5 pt-2 backdrop-blur">
        {availableTabs.map((tab) => {
          const active = visibleTab === tab.id;
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
            </button>
          );
        })}
      </div>

      {state.error ? (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-[#FFF5F5] px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#E31E24]" />
          <p className="text-xs font-medium text-[#B42318]">{state.error}</p>
        </div>
      ) : null}

      {/* Basic info — kept mounted so all fields submit regardless of active tab */}
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
              onChange={(event) => handleNameChange(event.target.value)}
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
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(event.target.value);
              }}
              className={`${fieldClass} font-mono`}
              placeholder="hu-thuy-tinh-500ml"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className={labelClass}>Danh mục thuộc về</span>
            <select name="category_id" defaultValue={product?.category_id ?? ''} className={selectClass}>
              <option value="">Chưa phân loại</option>
              {activeCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
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
            label="Kích hoạt hiển thị công khai"
            description="Tắt để ẩn sản phẩm khỏi website."
          />
        </div>
      </div>

      {/* Price & stock */}
      <div className={visibleTab === 'pricing' ? 'animate-fade-in flex-1 space-y-4' : 'hidden'}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Giá lẻ tham khảo (VNĐ)</span>
            <input
              name="price"
              type="number"
              min="0"
              step="100"
              defaultValue={product?.price ?? ''}
              className={fieldClass}
              placeholder="Để trống nếu hiển thị “Liên hệ”"
            />
            <span className="mt-1.5 block text-[10px] font-medium text-slate-400">
              Để trống nếu muốn hiển thị chữ “Liên hệ” thay vì giá cụ thể.
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

      {/* Specs tab — kept mounted so the hidden specs JSON input always submits */}
      <div className={visibleTab === 'specs' ? 'animate-fade-in flex-1' : 'hidden'}>
        <SpecsEditor initialSpecs={product?.specs} />
      </div>

      {!product ? (
        <div className={visibleTab === 'media' ? 'animate-fade-in flex-1 space-y-4' : 'hidden'}>
          <input type="hidden" name="primary_image_index" value={primaryImageIndex} />

          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 px-6 py-8 text-center transition hover:border-[#1B3A6B]/50 hover:bg-slate-50">
            <Upload className="h-8 w-8 text-slate-300" />
            <span className="text-xs font-semibold text-slate-600">Chọn nhiều ảnh sản phẩm từ máy tính</span>
            <span className="text-[10px] font-medium text-slate-400">
              JPG, JPEG, PNG, WebP. Tối đa 5 MB/ảnh và {MAX_IMAGES} ảnh mỗi sản phẩm.
            </span>
            <input
              ref={fileInputRef}
              name="product_images"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              onChange={(event) => handleImagesChange(event.target.files)}
            />
          </label>

          {imagePreviews.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold text-slate-700">
                  {imagePreviews.length} ảnh đã chọn. Ảnh đầu tiên mặc định là thumbnail.
                </p>
                <button
                  type="button"
                  onClick={clearImages}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-500 transition hover:border-rose-200 hover:text-rose-600"
                >
                  <X className="h-3.5 w-3.5" />
                  Xóa ảnh đã chọn
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {imagePreviews.map((preview, index) => {
                  const selected = primaryImageIndex === index;
                  return (
                    <button
                      key={`${preview.name}-${index}`}
                      type="button"
                      onClick={() => setPrimaryImageIndex(index)}
                      className={`overflow-hidden rounded-xl border bg-white text-left transition ${
                        selected
                          ? 'border-[#1B3A6B] ring-2 ring-[#1B3A6B]/15'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className="relative aspect-video bg-slate-100 bg-cover bg-center"
                        style={{ backgroundImage: `url(${preview.url})` }}
                      >
                        {selected ? (
                          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-[#1B3A6B] px-2 py-1 text-[10px] font-bold text-white shadow-sm">
                            <Star className="h-3 w-3 fill-white" />
                            Thumbnail
                          </span>
                        ) : null}
                      </div>
                      <div className="space-y-1 p-3">
                        <p className="truncate text-[11px] font-bold text-slate-700" title={preview.name}>
                          {preview.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {(preview.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[#EEF2F6] bg-slate-50/60 px-4 py-3 text-xs leading-relaxed text-slate-500">
              Có thể bỏ qua ảnh khi tạo. Admin vẫn thêm hoặc sắp xếp ảnh sau trong mục Media & Giá sỉ.
            </div>
          )}
        </div>
      ) : null}
    </form>
  );
}
