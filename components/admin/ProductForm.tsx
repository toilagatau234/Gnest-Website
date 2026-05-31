'use client';

import { useActionState, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, ImageIcon, Loader2 } from 'lucide-react';

import { SpecsEditor } from '@/components/admin/SpecsEditor';
import type { AdminCategory } from '@/lib/services/admin/categories';
import type { AdminProduct } from '@/lib/services/admin/products';

import {
  createProductAction,
  updateProductAction,
  type AdminFormState,
} from '@/app/admin/(dashboard)/products/actions';

interface ProductFormProps {
  categories: AdminCategory[];
  product?: AdminProduct;
  onSuccess?: () => void;
}

const INITIAL_STATE: AdminFormState = { ok: false };

type TabId = 'basic' | 'pricing' | 'specs';

const TABS: { id: TabId; label: string }[] = [
  { id: 'basic', label: 'Thông tin cơ bản' },
  { id: 'pricing', label: 'Giá & kho' },
  { id: 'specs', label: 'Thông số kỹ thuật' },
];

const fieldClass =
  'admin-focus h-10 w-full rounded-lg border border-[#E2E8F0] px-3 text-sm text-slate-700 transition-colors focus:border-[#1B3A6B]';
const labelClass = 'mb-1 block text-sm font-medium text-slate-700';

export function ProductForm({ categories, product, onSuccess }: ProductFormProps) {
  const action = product ? updateProductAction : createProductAction;
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);
  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const activeCategories = categories.filter((category) => category.is_active);

  useEffect(() => {
    if (state.ok) {
      onSuccess?.();
    }
  }, [state.ok, onSuccess]);

  return (
    <form action={formAction} className="space-y-5">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      {state.error ? (
        <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-[#F2C5C7] bg-[#FFF5F5] px-3.5 py-2.5">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#E31E24]" />
          <p className="text-sm text-[#B42318]">{state.error}</p>
        </div>
      ) : null}

      {state.ok ? (
        <div role="status" className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
          <p className="text-sm text-emerald-700">Đã lưu sản phẩm thành công.</p>
        </div>
      ) : null}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#EEF2F6]">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-current={active ? 'true' : undefined}
              className={`admin-focus -mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'border-[#1B3A6B] text-[#1B3A6B]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Basic info — kept mounted so all fields submit regardless of active tab */}
      <div className={activeTab === 'basic' ? 'space-y-4' : 'hidden'}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Tên sản phẩm</span>
            <input name="name" defaultValue={product?.name ?? ''} className={fieldClass} placeholder="VD: Hũ thủy tinh 500ml" />
          </label>

          <label className="block">
            <span className={labelClass}>Slug</span>
            <input name="slug" defaultValue={product?.slug ?? ''} className={fieldClass} placeholder="hu-thuy-tinh-500ml" />
          </label>

          <label className="block sm:col-span-2">
            <span className={labelClass}>Danh mục</span>
            <select name="category_id" defaultValue={product?.category_id ?? ''} className={fieldClass}>
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
          <span className={labelClass}>Mô tả</span>
          <textarea
            name="description"
            rows={3}
            defaultValue={product?.description ?? ''}
            className="admin-focus w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm text-slate-700 transition-colors focus:border-[#1B3A6B]"
            placeholder="Mô tả ngắn hiển thị trong catalog"
          />
        </label>

        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input name="is_active" type="checkbox" defaultChecked={product?.is_active ?? true} className="h-4 w-4 rounded border-slate-300 text-[#1B3A6B]" />
          Đang hiển thị trên catalog
        </label>
      </div>

      {/* Price & stock */}
      <div className={activeTab === 'pricing' ? 'space-y-4' : 'hidden'}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Giá (VNĐ)</span>
            <input name="price" type="number" min="0" step="100" defaultValue={product?.price ?? ''} className={fieldClass} placeholder="Để trống nếu “Liên hệ”" />
            <span className="mt-1 block text-xs text-slate-400">Bỏ trống để hiển thị “Liên hệ” trên catalog.</span>
          </label>

          <label className="block">
            <span className={labelClass}>Tồn kho</span>
            <input name="stock" type="number" min="0" defaultValue={product?.stock ?? 0} className={fieldClass} />
          </label>
        </div>

        <div className="flex items-start gap-2.5 rounded-lg border border-[#EEF2F6] bg-slate-50/60 px-4 py-3 text-sm text-slate-500">
          <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <p>Hình ảnh và giá sỉ sẽ được quản lý ở phase Storage sắp tới.</p>
        </div>
      </div>

      {/* Specs */}
      <div className={activeTab === 'specs' ? '' : 'hidden'}>
        <SpecsEditor initialSpecs={product?.specs} />
      </div>

      <div className="flex justify-end border-t border-[#EEF2F6] pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="admin-focus inline-flex h-10 items-center gap-2 rounded-lg bg-[#1B3A6B] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#16315b] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isPending ? 'Đang lưu…' : product ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
        </button>
      </div>
    </form>
  );
}
