import { AlertCircle, Eye, EyeOff, FolderTree, Layers3 } from 'lucide-react';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSection } from '@/components/admin/AdminSection';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { CategoriesTable } from '@/components/admin/CategoriesTable';
import { CategoryFormDialog } from '@/components/admin/CategoryFormDialog';
import { getAdminCategories } from '@/lib/services/admin/categories';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const { data: categories, error } = await getAdminCategories();
  const safeCategories = categories || [];
  const activeCount = safeCategories.filter((item) => item.is_active).length;
  const hiddenCount = safeCategories.length - activeCount;
  const parentCount = safeCategories.filter((item) => !item.parent_id).length;
  const childCount = safeCategories.length - parentCount;

  return (
    <AdminSection>
      <AdminPageHeader
        title="Danh mục"
        description="Quản lý cấu trúc danh mục sản phẩm/dịch vụ, trạng thái hiển thị và thứ tự xuất hiện trên website."
        action={<CategoryFormDialog categories={safeCategories} />}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Tổng danh mục"
          value={safeCategories.length}
          icon={<FolderTree className="h-4 w-4" />}
          hint="Toàn bộ cấu trúc catalog"
        />
        <AdminStatCard
          label="Đang hiển thị"
          value={activeCount}
          icon={<Eye className="h-4 w-4" />}
          hint="Được xuất hiện trên website"
        />
        <AdminStatCard
          label="Đang ẩn"
          value={hiddenCount}
          icon={<EyeOff className="h-4 w-4" />}
          hint="Tạm ngưng hiển thị công khai"
          tone="accent"
        />
        <AdminStatCard
          label="Cấu trúc cây"
          value={`${parentCount}/${childCount}`}
          icon={<Layers3 className="h-4 w-4" />}
          hint="Danh mục cha / danh mục con"
        />
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
