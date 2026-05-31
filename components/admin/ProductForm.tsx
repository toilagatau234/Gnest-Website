'use client';

import { useActionState } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

import {
  createProductAction,
  updateProductAction,
  type AdminFormState,
} from '@/app/admin/(dashboard)/products/actions';
import type { AdminCategory } from '@/lib/services/admin/categories';
import type { AdminProduct } from '@/lib/services/admin/products';

interface ProductFormProps {
  categories: AdminCategory[];
  product?: AdminProduct;
}

const INITIAL_STATE: AdminFormState = { ok: false };
const fieldClass =
  'mt-1.5 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/10';
const labelClass = 'text-sm font-medium text-slate-700';

function getSpecsDefaultValue(product?: AdminProduct) {
  if (!product?.specs || typeof product.specs !== 'object' || Array.isArray(product.specs)) {
    return '{\n  "dungTich": "",\n  "quyCach": ""\n}';
  }

  return JSON.stringify(product.specs, null, 2);
}

export function ProductForm({ categories, product }: ProductFormProps) {
  const action = product ? updateProductAction : createProductAction;
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);
  const activeCategories = categories.filter((category) => category.is_active);

  return (
    <form action={formAction} className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-admin">
      <div className="border-b border-[#EEF2F6] px-5 py-4">
        <h2 className="text-base font-semibold text-[#1B3A6B]">
          {product ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Quản lý thông tin catalog cơ bản. Ảnh, specs nâng cao và giá sỉ có thể tách theo phase riêng.
        </p>
      </div>

      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      <div className="space-y-6 p-5">
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
            <p className="text-sm text-emerald-700">Đã lưu sản phẩm thành công.</p>
          </div>
        ) : null}

        <section>
          <h3 className="text-sm font-semibold text-[#1B3A6B]">Thông tin cơ bản</h3>
          <div className="mt-3 grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Tên sản phẩm</span>
              <input
                name="name"
                required
                defaultValue={product?.name ?? ''}
                className={fieldClass}
                placeholder="VD: Hũ thủy tinh 500ml"
              />
            </label>

            <label className="block">
              <span className={labelClass}>Slug</span>
              <input
                name="slug"
                required
                defaultValue={product?.slug ?? ''}
                className={fieldClass}
                placeholder="hu-thuy-tinh-500ml"
              />
            </label>

            <label className="block">
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

            <div className="flex items-end pb-2">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input name="is_active" type="checkbox" defaultChecked={product?.is_active ?? true} />
                Đang hiển thị
              </label>
            </div>
          </div>
        </section>

        <section className="border-t border-[#EEF2F6] pt-5">
          <h3 className="text-sm font-semibold text-[#1B3A6B]">Giá và tồn kho</h3>
          <div className="mt-3 grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Giá</span>
              <input
                name="price"
                type="number"
                min="0"
                step="100"
                defaultValue={product?.price ?? ''}
                className={fieldClass}
                placeholder="Liên hệ nếu để trống"
              />
            </label>

            <label className="block">
              <span className={labelClass}>Tồn kho</span>
              <input
                name="stock"
                type="number"
                min="0"
                defaultValue={product?.stock ?? 0}
                className={fieldClass}
              />
            </label>
          </div>
        </section>

        <section className="border-t border-[#EEF2F6] pt-5">
          <h3 className="text-sm font-semibold text-[#1B3A6B]">Mô tả và thông số</h3>
          <label className="mt-3 block">
            <span className={labelClass}>Mô tả</span>
            <textarea
              name="description"
              rows={3}
              defaultValue={product?.description ?? ''}
              className={fieldClass}
              placeholder="Mô tả ngắn hiển thị trong catalog"
            />
          </label>

          <label className="mt-4 block">
            <span className={labelClass}>Specs JSON</span>
            <textarea
              name="specs"
              rows={5}
              defaultValue={getSpecsDefaultValue(product)}
              className={`${fieldClass} font-mono text-xs`}
            />
          </label>
        </section>

        <div className="flex justify-end border-t border-[#EEF2F6] pt-5">
          <button
            type="submit"
            disabled={isPending}
            className="admin-focus inline-flex items-center gap-2 rounded-lg bg-[#1B3A6B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16315b] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isPending ? 'Đang lưu...' : product ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
          </button>
        </div>
      </div>
    </form>
  );
}
