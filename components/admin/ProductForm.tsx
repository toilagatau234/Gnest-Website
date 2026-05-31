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
  { id: 'pricing', label: 'Giá & kho sỉ' },
  { id: 'specs', label: 'Thông số kỹ thuật' },
];

const fieldClass =
  'w-full bg-white border border-slate-250 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] rounded-lg px-3 py-2 text-slate-800 text-xs font-medium transition-all';
const labelClass = 'mb-1 block text-xs font-bold text-slate-500 uppercase tracking-wide';

export function ProductForm({ categories, product, onSuccess }: ProductFormProps) {
  const action = product ? updateProductAction : createProductAction;
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);
  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const activeCategories = categories.filter((category) => category.is_active || category.id === product?.category_id);

  useEffect(() => {
    if (state.ok) {
      onSuccess?.();
    }
  }, [state.ok, onSuccess]);

  return (
    <form action={formAction} className="space-y-6">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      {state.error ? (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-[#FFF5F5] px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#E31E24]" />
          <p className="text-xs text-[#B42318] font-medium">{state.error}</p>
        </div>
      ) : null}

      {state.ok ? (
        <div role="status" className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
          <p className="text-xs text-emerald-700 font-semibold">Đã lưu sản phẩm thành công.</p>
        </div>
      ) : null}

      {/* Tabs Layout matching template styling */}
      <div className="flex gap-1 border-b border-slate-100">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-current={active ? 'true' : undefined}
              className={`-mb-px border-b-2 px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
                active
                  ? 'border-[#1B3A6B] text-[#1B3A6B]'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
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
            <input 
              name="name" 
              type="text"
              required
              defaultValue={product?.name ?? ''} 
              className={fieldClass} 
              placeholder="VD: Hũ thủy tinh 500ml" 
            />
          </label>

          <label className="block">
            <span className={labelClass}>Slug / Link dẫn URL</span>
            <input 
              name="slug" 
              type="text"
              required
              defaultValue={product?.slug ?? ''} 
              className={fieldClass} 
              placeholder="hu-thuy-tinh-500ml" 
            />
          </label>

          <label className="block sm:col-span-2">
            <span className={labelClass}>Danh mục thuộc về</span>
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
          <span className={labelClass}>Mô tả ngắn catalog</span>
          <textarea
            name="description"
            rows={4}
            defaultValue={product?.description ?? ''}
            className="w-full bg-white border border-slate-250 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] rounded-lg px-3 py-2 text-slate-800 text-xs font-normal transition-all leading-relaxed"
            placeholder="Mô tả ngắn hiển thị cho đại lý sỉ tham khảo"
          />
        </label>

        <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-medium hover:bg-slate-100 transition-colors">
          <input 
            name="is_active" 
            type="checkbox" 
            defaultChecked={product?.is_active ?? true} 
            className="h-4 w-4 rounded border-slate-300 text-[#1B3A6B] focus:ring-[#1B3A6B]" 
          />
          <span className="text-xs text-slate-700 font-semibold select-none">Kích hoạt hiển thị công khai trên website</span>
        </label>
      </div>

      {/* Price & stock */}
      <div className={activeTab === 'pricing' ? 'space-y-4' : 'hidden'}>
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
            <span className="mt-1.5 block text-[10px] text-slate-400 font-medium">Để trống nếu muốn hiển thị chữ “Liên hệ” thay vì giá cụ thể.</span>
          </label>

          <label className="block">
            <span className={labelClass}>Tồn kho sẵn sỉ</span>
            <input 
              name="stock" 
              type="number" 
              min="0" 
              defaultValue={product?.stock ?? 0} 
              className={fieldClass} 
            />
          </label>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-[#EEF2F6] bg-slate-50/60 px-4 py-3 text-xs text-slate-500 leading-relaxed">
          <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <p>Ảnh sản phẩm và bảng bậc sỉ được liên kết sẽ kế thừa từ hệ thống Storage Supabase.</p>
        </div>
      </div>

      {/* Specs tab wrap */}
      <div className={activeTab === 'specs' ? '' : 'hidden'}>
        <SpecsEditor initialSpecs={product?.specs} />
      </div>

      {/* Form Action Buttons Bar */}
      <div className="flex justify-end border-t border-[#EEF2F6] pt-4 gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#1B3A6B] hover:bg-[#16315b] px-6 text-xs font-extrabold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : null}
          {isPending ? 'Đang lưu sỉ...' : product ? 'Cập Nhật Thay Đổi' : 'Đăng Sản Phẩm Mới'}
        </button>
      </div>
    </form>
  );
}
