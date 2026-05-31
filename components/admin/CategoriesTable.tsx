'use client';

import { useMemo, useState } from 'react';
import { CornerDownRight } from 'lucide-react';

import { AdminFilterBar, AdminSelect } from '@/components/admin/AdminFilterBar';
import { AdminSearchInput } from '@/components/admin/AdminSearchInput';
import { AdminStatusChip } from '@/components/admin/AdminStatusChip';
import { AdminTableShell, AdminTh } from '@/components/admin/AdminTableShell';
import { CategoryFormDialog } from '@/components/admin/CategoryFormDialog';
import type { AdminCategory } from '@/lib/services/admin/categories';

import { toggleCategoryActiveAction } from '@/app/admin/(dashboard)/categories/actions';

interface CategoriesTableProps {
  categories: AdminCategory[];
}

type TypeFilter = 'all' | 'product' | 'service';
type StatusFilter = 'all' | 'active' | 'hidden';

function getParentName(categories: AdminCategory[], parentId: string | null) {
  if (!parentId) {
    return '—';
  }
  return categories.find((category) => category.id === parentId)?.name ?? '—';
}

/** Order rows so children follow their parent (tree-ish grouping). */
function buildTreeOrder(filtered: AdminCategory[]): AdminCategory[] {
  const inFilter = new Set(filtered.map((category) => category.id));
  const childrenByParent = new Map<string, AdminCategory[]>();
  const roots: AdminCategory[] = [];

  for (const category of filtered) {
    if (category.parent_id && inFilter.has(category.parent_id)) {
      const siblings = childrenByParent.get(category.parent_id) ?? [];
      siblings.push(category);
      childrenByParent.set(category.parent_id, siblings);
    } else {
      roots.push(category);
    }
  }

  const ordered: AdminCategory[] = [];
  for (const root of roots) {
    ordered.push(root);
    for (const child of childrenByParent.get(root.id) ?? []) {
      ordered.push(child);
    }
  }
  return ordered;
}

export function CategoriesTable({ categories }: CategoriesTableProps) {
<<<<<<< HEAD
  return (
    <AdminTableShell
      minWidth={840}
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
        <tr key={category.id} className="transition-colors hover:bg-[#F8FAFC]">
          <td className="px-5 py-4 text-sm font-semibold text-slate-900">{category.name}</td>
          <td className="px-5 py-4 text-sm text-slate-500">{category.slug}</td>
          <td className="px-5 py-4 text-sm text-slate-600">
            {category.type === 'service' ? 'Dịch vụ' : 'Sản phẩm'}
          </td>
          <td className="px-5 py-4 text-sm text-slate-600">{getParentName(categories, category.parent_id)}</td>
          <td className="px-5 py-4 text-sm text-slate-600">{category.sort_order}</td>
          <td className="px-5 py-4 text-sm">
            <AdminStatusChip tone={category.is_active ? 'success' : 'neutral'}>
              {category.is_active ? 'Hiển thị' : 'Ẩn'}
            </AdminStatusChip>
          </td>
          <td className="px-5 py-4 text-right text-sm">
            <div className="flex justify-end gap-2">
              <details className="text-left">
                <summary className="admin-focus cursor-pointer rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1B3A6B] hover:text-[#1B3A6B]">
                  Sửa
                </summary>
                <div className="fixed inset-x-4 top-20 z-50 mx-auto max-w-3xl rounded-xl bg-white p-2 shadow-admin-pop ring-1 ring-[#E2E8F0]">
                  <CategoryForm categories={categories} category={category} />
                </div>
              </details>
              <form action={toggleCategoryActiveAction}>
                <input type="hidden" name="id" value={category.id} />
                <input type="hidden" name="next_is_active" value={String(!category.is_active)} />
                <button
                  type="submit"
                  className="admin-focus rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#E31E24] hover:text-[#E31E24]"
                >
                  {category.is_active ? 'Ẩn' : 'Hiện'}
                </button>
              </form>
            </div>
          </td>
        </tr>
      ))}
    </AdminTableShell>
=======
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const ordered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = categories.filter((category) => {
      if (typeFilter !== 'all' && category.type !== typeFilter) {
        return false;
      }
      if (statusFilter === 'active' && !category.is_active) {
        return false;
      }
      if (statusFilter === 'hidden' && category.is_active) {
        return false;
      }
      if (normalized) {
        return (
          category.name.toLowerCase().includes(normalized) ||
          category.slug.toLowerCase().includes(normalized)
        );
      }
      return true;
    });
    return buildTreeOrder(filtered);
  }, [categories, query, typeFilter, statusFilter]);

  return (
    <div className="space-y-4">
      <AdminFilterBar
        trailing={
          <>
            <AdminSelect label="Lọc theo loại" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}>
              <option value="all">Tất cả loại</option>
              <option value="product">Sản phẩm</option>
              <option value="service">Dịch vụ</option>
            </AdminSelect>
            <AdminSelect label="Lọc theo trạng thái" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
              <option value="all">Mọi trạng thái</option>
              <option value="active">Đang hiển thị</option>
              <option value="hidden">Đang ẩn</option>
            </AdminSelect>
          </>
        }
      >
        <AdminSearchInput value={query} onChange={setQuery} placeholder="Tìm theo tên hoặc slug…" />
        <span className="text-sm text-slate-400">{ordered.length} danh mục</span>
      </AdminFilterBar>

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
        {ordered.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-500">
              Không tìm thấy danh mục phù hợp.
            </td>
          </tr>
        ) : (
          ordered.map((category) => {
            const isChild = Boolean(category.parent_id);
            return (
              <tr key={category.id} className="transition-colors hover:bg-[#F8FAFC]">
                <td className="px-5 py-3 text-sm font-semibold text-slate-900">
                  <span className={`flex items-center gap-1.5 ${isChild ? 'pl-5 font-medium text-slate-700' : ''}`}>
                    {isChild && <CornerDownRight className="h-3.5 w-3.5 text-slate-300" />}
                    {category.name}
                  </span>
                </td>
                <td className="px-5 py-3 font-mono text-xs text-slate-500">{category.slug}</td>
                <td className="px-5 py-3 text-sm text-slate-600">
                  {category.type === 'service' ? 'Dịch vụ' : 'Sản phẩm'}
                </td>
                <td className="px-5 py-3 text-sm text-slate-600">{getParentName(categories, category.parent_id)}</td>
                <td className="px-5 py-3 text-sm tabular-nums text-slate-500">{category.sort_order}</td>
                <td className="px-5 py-3 text-sm">
                  <AdminStatusChip tone={category.is_active ? 'success' : 'neutral'} dot>
                    {category.is_active ? 'Hiển thị' : 'Ẩn'}
                  </AdminStatusChip>
                </td>
                <td className="px-5 py-3 text-right text-sm">
                  <div className="flex justify-end gap-2">
                    <CategoryFormDialog categories={categories} category={category} />
                    <form action={toggleCategoryActiveAction}>
                      <input type="hidden" name="id" value={category.id} />
                      <input type="hidden" name="next_is_active" value={String(!category.is_active)} />
                      <button
                        type="submit"
                        className="admin-focus h-8 rounded-lg border border-[#E2E8F0] px-3 text-xs font-semibold text-slate-600 transition hover:border-[#E31E24] hover:text-[#E31E24]"
                      >
                        {category.is_active ? 'Ẩn' : 'Hiện'}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </AdminTableShell>
    </div>
>>>>>>> 3b38c8f142158fddd39741ee7b80a71a7f60a0d6
  );
}
