import { AdminStatusChip } from '@/components/admin/AdminStatusChip';
import { AdminTableShell, AdminTh } from '@/components/admin/AdminTableShell';
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
    <AdminTableShell
      minWidth={820}
      head={
        <>
          <AdminTh>Tên</AdminTh>
          <AdminTh>Slug</AdminTh>
          <AdminTh>Loại</AdminTh>
          <AdminTh>Danh mục cha</AdminTh>
          <AdminTh>Thứ tự</AdminTh>
          <AdminTh>Trạng thái</AdminTh>
          <AdminTh align="right">Thao tác</AdminTh>
        </>
      }
    >
      {categories.map((category) => (
        <tr key={category.id} className="transition-colors hover:bg-[#F1F5F9]">
          <td className="px-5 py-3 text-sm font-semibold text-slate-900">{category.name}</td>
          <td className="px-5 py-3 text-sm text-slate-600">{category.slug}</td>
          <td className="px-5 py-3 text-sm text-slate-600">
            {category.type === 'service' ? 'Dịch vụ' : 'Sản phẩm'}
          </td>
          <td className="px-5 py-3 text-sm text-slate-600">{getParentName(categories, category.parent_id)}</td>
          <td className="px-5 py-3 text-sm text-slate-600">{category.sort_order}</td>
          <td className="px-5 py-3 text-sm">
            <AdminStatusChip tone={category.is_active ? 'success' : 'neutral'}>
              {category.is_active ? 'Hiển thị' : 'Ẩn'}
            </AdminStatusChip>
          </td>
          <td className="px-5 py-3 text-right text-sm">
            <div className="flex justify-end gap-2">
              <details className="text-left">
                <summary className="admin-focus cursor-pointer rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[#1B3A6B] hover:text-[#1B3A6B]">
                  Sửa
                </summary>
                <div className="fixed inset-x-4 top-20 z-50 mx-auto max-w-3xl rounded-2xl bg-white p-2 shadow-admin-pop ring-1 ring-[#E2E8F0]">
                  <CategoryForm categories={categories} category={category} />
                </div>
              </details>
              <form action={toggleCategoryActiveAction}>
                <input type="hidden" name="id" value={category.id} />
                <input type="hidden" name="next_is_active" value={String(!category.is_active)} />
                <button
                  type="submit"
                  className="admin-focus rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[#E31E24] hover:text-[#E31E24]"
                >
                  {category.is_active ? 'Ẩn' : 'Hiện'}
                </button>
              </form>
            </div>
          </td>
        </tr>
      ))}
    </AdminTableShell>
  );
}
