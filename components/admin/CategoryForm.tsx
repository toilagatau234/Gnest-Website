'use client';

import { useActionState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

import type { AdminCategory } from '@/lib/services/admin/categories';
import type { CategoryType } from '@/lib/types/database';

import {
  createCategoryAction,
  updateCategoryAction,
  type AdminFormState,
} from '@/app/admin/(dashboard)/categories/actions';

interface CategoryFormProps {
  categories: AdminCategory[];
  category?: AdminCategory;
  onSuccess?: () => void;
}

const INITIAL_STATE: AdminFormState = { ok: false };

const fieldClass =
  'admin-focus h-10 w-full rounded-lg border border-[#E2E8F0] px-3 text-sm text-slate-700 transition-colors focus:border-[#1B3A6B]';
const labelClass = 'mb-1 block text-sm font-medium text-slate-700';

export function CategoryForm({ categories, category, onSuccess }: CategoryFormProps) {
  const action = category ? updateCategoryAction : createCategoryAction;
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);
  const availableParents = categories.filter((item) => item.id !== category?.id);
  const defaultType: CategoryType = category?.type ?? 'product';

  useEffect(() => {
    if (state.ok) {
      onSuccess?.();
    }
  }, [state.ok, onSuccess]);

  return (
    <form action={formAction} className="space-y-5">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}

      {state.error ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-[#F2C5C7] bg-[#FFF5F5] px-3.5 py-2.5"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#E31E24]" />
          <p className="text-sm text-[#B42318]">{state.error}</p>
        </div>
      ) : null}

      {state.ok ? (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
          <p className="text-sm text-emerald-700">Đã lưu danh mục thành công.</p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Tên danh mục</span>
          <input name="name" required defaultValue={category?.name ?? ''} className={fieldClass} placeholder="VD: Hũ thủy tinh" />
        </label>

        <label className="block">
          <span className={labelClass}>Slug</span>
          <input name="slug" required defaultValue={category?.slug ?? ''} className={fieldClass} placeholder="hu-thuy-tinh" />
        </label>

        <label className="block">
          <span className={labelClass}>Loại</span>
          <select name="type" defaultValue={defaultType} className={fieldClass}>
            <option value="product">Sản phẩm</option>
            <option value="service">Dịch vụ</option>
          </select>
        </label>

        <label className="block">
          <span className={labelClass}>Danh mục cha</span>
          <select name="parent_id" defaultValue={category?.parent_id ?? ''} className={fieldClass}>
            <option value="">Không có (danh mục gốc)</option>
            {availableParents.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={labelClass}>Thứ tự hiển thị</span>
          <input name="sort_order" type="number" defaultValue={category?.sort_order ?? 0} className={fieldClass} />
        </label>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-3 rounded-lg border border-[#EEF2F6] bg-slate-50/60 px-4 py-3">
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input name="has_filters" type="checkbox" defaultChecked={category?.has_filters ?? false} className="h-4 w-4 rounded border-slate-300 text-[#1B3A6B]" />
          Có bộ lọc
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input name="is_active" type="checkbox" defaultChecked={category?.is_active ?? true} className="h-4 w-4 rounded border-slate-300 text-[#1B3A6B]" />
          Đang hiển thị
        </label>
      </div>

      <div className="flex justify-end border-t border-[#EEF2F6] pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="admin-focus inline-flex h-10 items-center gap-2 rounded-lg bg-[#1B3A6B] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#16315b] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isPending ? 'Đang lưu…' : category ? 'Lưu thay đổi' : 'Tạo danh mục'}
        </button>
      </div>
    </form>
  );
}
