import type { AdminCategory } from '@/lib/services/admin/categories';
import type { CategoryType } from '@/lib/types/database';

import { createCategoryAction, updateCategoryAction } from '@/app/admin/(dashboard)/categories/actions';

interface CategoryFormProps {
  categories: AdminCategory[];
  category?: AdminCategory;
}

function toInputDateValue(value: boolean) {
  return value ? 'true' : 'false';
}

export function CategoryForm({ categories, category }: CategoryFormProps) {
  const action = category ? updateCategoryAction : createCategoryAction;
  const availableParents = categories.filter((item) => item.id !== category?.id);
  const defaultType: CategoryType = category?.type ?? 'product';

  return (
    <form action={action} className="rounded-2xl border border-[#D7E0EC] bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-[#1B3A6B]">
          {category ? 'Cập nhật danh mục' : 'Thêm danh mục'}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Quản lý danh mục cha/con hiển thị trên catalog.
        </p>
      </div>

      {category ? <input type="hidden" name="id" value={category.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Tên danh mục</span>
          <input
            name="name"
            required
            defaultValue={category?.name ?? ''}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/10"
            placeholder="VD: Hũ thủy tinh"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Slug</span>
          <input
            name="slug"
            required
            defaultValue={category?.slug ?? ''}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/10"
            placeholder="hu-thuy-tinh"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Loại</span>
          <select
            name="type"
            defaultValue={defaultType}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/10"
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
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/10"
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
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/10"
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
          <input type="hidden" name="_active_value" value={toInputDateValue(category?.is_active ?? true)} />
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          className="rounded-xl bg-[#E31E24] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#C9181E]"
        >
          {category ? 'Lưu thay đổi' : 'Tạo danh mục'}
        </button>
      </div>
    </form>
  );
}
