'use client';

import { useState } from 'react';
import { AlertCircle, ImageIcon } from 'lucide-react';

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

type TabId = 'basic' | 'pricing' | 'specs';

const TABS: { id: TabId; label: string }[] = [
  { id: 'basic', label: 'Thông tin cơ bản' },
  { id: 'pricing', label: 'Giá & kho sỉ' },
  { id: 'specs', label: 'Thông số kỹ thuật' },
];

const fieldClass = 'admin-input text-xs';
const selectClass = 'admin-select text-xs';
const labelClass = 'mb-1.5 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-[#646464]';

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
  const activeCategories = categories.filter(
    (category) => category.is_active || category.id === product?.category_id,
  );
  const visibleTab = state.error ? tabForError(state.error) ?? activeTab : activeTab;

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  };

  return (
    <form id={formId} action={formAction} className="flex min-h-[620px] flex-col gap-5">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      {/* Sticky tab bar pinned beneath the modal header. */}
      <div className="sticky -top-5 z-10 -mx-5 -mt-5 mb-1 flex gap-1 overflow-x-auto border-b border-[#EEF2F6] bg-white/95 px-5 pt-2 backdrop-blur">
        {TABS.map((tab) => {
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
    </form>
  );
}
