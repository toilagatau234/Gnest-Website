'use client';

import { useActionState } from 'react';
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
}

const INITIAL_STATE: AdminFormState = { ok: false };

export function CategoryForm({ categories, category }: CategoryFormProps) {
  const action = category ? updateCategoryAction : createCategoryAction;
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);
  const availableParents = categories.filter((item) => item.id !== category?.id);
  const defaultType: CategoryType = category?.type ?? 'product';

  return (
    <form action={formAction} className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-admin">
      <div className="border-b border-[#E2E8F0] bg-slate-50/50 px-5 py-4">
        <h2 className="text-base font-bold text-[#1B3A6B]">
          {category ? 'Cập nhật danh mục' : 'Thêm danh mục'}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
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

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Tên danh mục</span>
            <input
              name="name"
              required
              defaultValue={category?.name ?? ''}
              className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none transition focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/10"
              placeholder="VD: Hũ thủy tinh"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Slug</span>
            <input
              name="slug"
              required
              defaultValue={category?.slug ?? ''}
              className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none transition focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/10"
              placeholder="hu-thuy-tinh"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Loại</span>
            <select
              name="type"
              defaultValue={defaultType}
              className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none transition focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/10"
            >
              <option value="product">Sản phẩm</option>
              <option value="service">Dịch vụ</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Danh mục cha</span>
            <select
              name="parent_id"
              defaultValue={category?.parent_id ?? ''}
              className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none transition focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/10"
            >
              <option value="">Không có</option>
              {availableParents.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Thứ tự</span>
            <input
              name="sort_order"
              type="number"
              defaultValue={category?.sort_order ?? 0}
              className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none transition focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/10"
            />
          </label>

          <div className="flex items-end gap-4 pb-2">
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

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="admin-focus inline-flex items-center gap-2 rounded-lg bg-[#1B3A6B] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#16315b] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isPending ? 'Đang lưu…' : category ? 'Lưu thay đổi' : 'Tạo danh mục'}
          </button>
        </div>
      </div>
    </form>
  );
}
