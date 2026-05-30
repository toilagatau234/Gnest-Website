import { Badge } from '@/components/ui/badge';
import { CategoryForm } from '@/components/admin/CategoryForm';
import type { AdminCategory } from '@/lib/services/admin/categories';

import { toggleCategoryActiveAction } from '@/app/admin/(dashboard)/categories/actions';

interface CategoriesTableProps {
  categories: AdminCategory[];
}

function getParentName(categories: AdminCategory[], parentId: string | null) {
  if (!parentId) {
    return '-';
  }

  return categories.find((category) => category.id === parentId)?.name ?? '-';
}

export function CategoriesTable({ categories }: CategoriesTableProps) {
  return (
    <div className="rounded-2xl border border-[#D7E0EC] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead className="border-b border-[#D7E0EC] bg-[#F4F7FB]">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#1B3A6B]">Tên</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#1B3A6B]">Slug</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#1B3A6B]">Loại</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#1B3A6B]">Danh mục cha</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#1B3A6B]">Thứ tự</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#1B3A6B]">Trạng thái</th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#1B3A6B]">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF2F6]">
            {categories.map((category) => (
              <tr key={category.id} className="transition-colors hover:bg-[#FFF9F9]">
                <td className="px-5 py-4 text-sm font-semibold text-slate-900">{category.name}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{category.slug}</td>
                <td className="px-5 py-4 text-sm text-slate-600">
                  {category.type === 'service' ? 'Dịch vụ' : 'Sản phẩm'}
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">{getParentName(categories, category.parent_id)}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{category.sort_order}</td>
                <td className="px-5 py-4 text-sm">
                  <Badge variant={category.is_active ? 'default' : 'secondary'}>
                    {category.is_active ? 'Hiển thị' : 'Ẩn'}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-right text-sm">
                  <div className="flex justify-end gap-2">
                    <details className="text-left">
                      <summary className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[#1B3A6B] hover:text-[#1B3A6B]">
                        Sửa
                      </summary>
                      <div className="fixed inset-x-4 top-20 z-50 mx-auto max-w-3xl rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-slate-200">
                        <CategoryForm categories={categories} category={category} />
                      </div>
                    </details>
                    <form action={toggleCategoryActiveAction}>
                      <input type="hidden" name="id" value={category.id} />
                      <input type="hidden" name="next_is_active" value={String(!category.is_active)} />
                      <button
                        type="submit"
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[#E31E24] hover:text-[#E31E24]"
                      >
                        {category.is_active ? 'Ẩn' : 'Hiện'}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
