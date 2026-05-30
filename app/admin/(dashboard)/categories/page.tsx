import { AlertCircle, FolderTree } from 'lucide-react';

import { CategoryForm } from '@/components/admin/CategoryForm';
import { CategoriesTable } from '@/components/admin/CategoriesTable';
import { getAdminCategories } from '@/lib/services/admin/categories';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const { data: categories, error } = await getAdminCategories();
  const safeCategories = categories || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1B3A6B]">Danh mục</h1>
          <p className="mt-2 text-slate-600">Quản lý danh mục sản phẩm, dịch vụ và cây danh mục cha/con.</p>
        </div>
        <div className="rounded-2xl border border-[#D7E0EC] bg-white px-4 py-3 text-sm shadow-sm">
          <p className="font-semibold text-[#1B3A6B]">{safeCategories.length} danh mục</p>
          <p className="text-slate-500">{safeCategories.filter((item) => item.is_active).length} đang hiển thị</p>
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-[#F2C5C7] bg-[#FFF5F5] p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#E31E24]" />
          <div>
            <p className="font-medium text-[#7A271A]">Không thể tải danh mục</p>
            <p className="mt-1 text-sm text-[#B42318]">{error}</p>
          </div>
        </div>
      ) : null}

      <CategoryForm categories={safeCategories} />

      {!error && safeCategories.length === 0 ? (
        <div className="rounded-2xl border border-[#D7E0EC] bg-white p-12 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-[#F4F7FB] p-3">
              <FolderTree className="h-6 w-6 text-[#1B3A6B]" />
            </div>
          </div>
          <p className="text-slate-700">Chưa có danh mục nào</p>
          <p className="mt-2 text-sm text-slate-500">Tạo danh mục đầu tiên để gán sản phẩm vào catalog.</p>
        </div>
      ) : null}

      {safeCategories.length > 0 ? <CategoriesTable categories={safeCategories} /> : null}
    </div>
  );
}
