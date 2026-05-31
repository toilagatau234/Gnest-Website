import { AlertCircle, FolderTree } from 'lucide-react';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSection } from '@/components/admin/AdminSection';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { CategoryForm } from '@/components/admin/CategoryForm';
import { CategoriesTable } from '@/components/admin/CategoriesTable';
import { getAdminCategories } from '@/lib/services/admin/categories';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const { data: categories, error } = await getAdminCategories();
  const safeCategories = categories || [];
  const activeCount = safeCategories.filter((item) => item.is_active).length;

  return (
    <AdminSection>
      <AdminPageHeader
        title="Danh mục"
        description="Quản lý danh mục sản phẩm, dịch vụ và cây danh mục cha/con."
        action={
          <div className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm shadow-admin">
            <p className="font-semibold text-[#1B3A6B]">{safeCategories.length} danh mục</p>
            <p className="text-slate-500">{activeCount} đang hiển thị</p>
          </div>
        }
      />

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
        <AdminEmptyState
          icon={<FolderTree className="h-6 w-6" />}
          title="Chưa có danh mục nào"
          description="Tạo danh mục đầu tiên để gán sản phẩm vào catalog."
        />
      ) : null}

      {safeCategories.length > 0 ? <CategoriesTable categories={safeCategories} /> : null}
    </AdminSection>
  );
}
