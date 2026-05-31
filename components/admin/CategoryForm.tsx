'use client';

import { useActionState } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

import {
  createCategoryAction,
  updateCategoryAction,
  type AdminFormState,
} from '@/app/admin/(dashboard)/categories/actions';
import type { AdminCategory } from '@/lib/services/admin/categories';
import type { CategoryType } from '@/lib/types/database';

interface CategoryFormProps {
  categories: AdminCategory[];
  category?: AdminCategory;
}

const INITIAL_STATE: AdminFormState = { ok: false };
const fieldClass =
  'mt-1.5 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/10';
const labelClass = 'text-sm font-medium text-slate-700';

export function CategoryForm({ categories, category }: CategoryFormProps) {
  const action = category ? updateCategoryAction : createCategoryAction;
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);
  const availableParents = categories.filter((item) => item.id !== category?.id);
  const defaultType: CategoryType = category?.type ?? 'product';

  return (
    <form action={formAction} className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-admin">
      <div className="border-b border-[#EEF2F6] px-5 py-4">
        <h2 className="text-base font-semibold text-[#1B3A6B]">
          {category ? 'Cập nhật danh mục' : 'Thêm danh mục'}
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Quản lý danh mục cha/con hiển thị trên catalog.
        </p>
      </div>

      {category ? <input type="hidden" name="id" value={category.id} /> : null}

      <div className="p-5">
        {state.error ? (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2.5 rounded-lg border border-[#F2C5C7] bg-[#FFF5F5] px-3.5 py-2.5"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#E31E24]" />
            <p className="text-sm text-[#B42318]">{state.error}</p>
          </div>
        ) : null}

        {state.ok ? (
          <div
            role="status"
            className="mb-4 flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
            <p className="text-sm text-emerald-700">Đã lưu danh mục thành công.</p>
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Tên danh mục</span>
            <input
              name="name"
              required
              defaultValue={category?.name ?? ''}
              className={fieldClass}
              placeholder="VD: Hũ thủy tinh"
            />
          </label>

          <label className="block">
            <span className={labelClass}>Slug</span>
            <input
              name="slug"
              required
              defaultValue={category?.slug ?? ''}
              className={fieldClass}
              placeholder="hu-thuy-tinh"
            />
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
              <option value="">Không có</option>
              {availableParents.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Thứ tự</span>
            <input
              name="sort_order"
              type="number"
              defaultValue={category?.sort_order ?? 0}
              className={fieldClass}
            />
          </label>

          <div className="flex items-end gap-5 pb-2">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input name="has_filters" type="checkbox" defaultChecked={category?.has_filters ?? false} />
              Có bộ lọc
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input name="is_active" type="checkbox" defaultChecked={category?.is_active ?? true} />
              Đang hiển thị
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="admin-focus inline-flex items-center gap-2 rounded-lg bg-[#1B3A6B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16315b] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isPending ? 'Đang lưu...' : category ? 'Lưu thay đổi' : 'Tạo danh mục'}
          </button>
        </div>
      </div>
    </form>
  );
}
