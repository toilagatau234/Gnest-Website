import { AlertCircle, Eye, EyeOff, Sparkles } from 'lucide-react';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSection } from '@/components/admin/AdminSection';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { CategoriesTable } from '@/components/admin/CategoriesTable';
import { CategoryFormDialog } from '@/components/admin/CategoryFormDialog';
import { getCategoryPriorityWarnings } from '@/lib/services/category-visibility';
import { getAdminCategories } from '@/lib/services/admin/categories';

export const dynamic = 'force-dynamic';

export default async function ServicesPage() {
  const { data: categories, error } = await getAdminCategories();
  const allCategories = categories || [];
  const safeCategories = allCategories.filter((item) => item.type === 'service');
  const activeCount = safeCategories.filter((item) => item.is_active).length;
  const hiddenCount = safeCategories.length - activeCount;
  const priorityWarnings = getCategoryPriorityWarnings(safeCategories);

  return (
    <AdminSection>
      <AdminPageHeader
        title="Dịch vụ chuyên nghiệp"
        description="Quản lý danh sách dịch vụ chuyên nghiệp, trạng thái hiển thị và thứ tự xuất hiện trên trang chủ."
        action={<CategoryFormDialog categories={safeCategories} fixedType="service" />}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <AdminStatCard
          label="Tổng dịch vụ"
          value={safeCategories.length}
          icon={<Sparkles className="h-4 w-4" />}
          hint="Toàn bộ dịch vụ giới thiệu"
        />
        <AdminStatCard
          label="Đang hiển thị"
          value={activeCount}
          icon={<Eye className="h-4 w-4" />}
          hint="Được xuất hiện trên trang chủ"
        />
        <AdminStatCard
          label="Đang ẩn"
          value={hiddenCount}
          icon={<EyeOff className="h-4 w-4" />}
          hint="Tạm ngưng hiển thị công khai"
          tone="accent"
        />
      </div>

      {priorityWarnings.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-extrabold">Cảnh báo trùng thứ tự hiển thị</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-800">
            Hệ thống vẫn sắp xếp an toàn theo thứ tự trước, sau đó fallback theo tên và slug. Nên kiểm tra các nhóm sau để tránh hiển thị khó đoán trên trang chủ.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {priorityWarnings.slice(0, 6).map((warning) => (
              <span key={`${warning.parentId ?? 'root'}-${warning.sortOrder}`} className="rounded-full border border-amber-300 bg-white px-3 py-1 text-[11px] font-bold text-amber-900">
                Nhóm #{warning.sortOrder}: {warning.categories.map((category) => category.name).join(', ')}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-[#F2C5C7] bg-[#FFF5F5] p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#E31E24]" />
          <div>
            <p className="font-medium text-[#7A271A]">Không thể tải dịch vụ</p>
            <p className="mt-1 text-sm text-[#B42318]">{error}</p>
          </div>
        </div>
      ) : null}

      {!error && safeCategories.length === 0 ? (
        <AdminEmptyState
          icon={<Sparkles className="h-6 w-6" />}
          title="Chưa có dịch vụ nào"
          description="Tạo dịch vụ đầu tiên để hiển thị giới thiệu trên trang chủ."
        />
      ) : null}

      {safeCategories.length > 0 ? <CategoriesTable categories={safeCategories} fixedType="service" /> : null}
    </AdminSection>
  );
}
