import { AlertCircle, Megaphone, Eye, EyeOff, LayoutList } from 'lucide-react';

import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSection } from '@/components/admin/AdminSection';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { BannerFormDialog } from '@/components/admin/BannerFormDialog';
import { BannersTable } from '@/components/admin/BannersTable';
import { getAdminBannersPage, getAdminBannerStats } from '@/lib/services/admin/banners';

export const dynamic = 'force-dynamic';

export default async function BannersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const pageSize = 20;

  const [pageResult, statsResult] = await Promise.all([
    getAdminBannersPage({ page, pageSize }),
    getAdminBannerStats(),
  ]);

  const { data: banners, error: pageError, pageCount, total } = pageResult;
  const { data: stats } = statsResult;
  const safeBanners = banners ?? [];
  const error = pageError;

  return (
    <AdminSection>
      <AdminPageHeader
        title="Banner quảng cáo"
        description="Quản lý các banner thông báo, ưu đãi chạy ngang trên thanh đầu website."
        action={<BannerFormDialog />}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <AdminStatCard
          label="Tổng số banner"
          value={stats.total}
          icon={<LayoutList className="h-4 w-4" />}
          hint="Toàn bộ các chương trình ưu đãi"
        />
        <AdminStatCard
          label="Đang kích hoạt"
          value={stats.activeCount}
          icon={<Eye className="h-4 w-4" />}
          hint="Hiển thị công khai trên website"
        />
        <AdminStatCard
          label="Đang tạm ẩn"
          value={stats.hiddenCount}
          icon={<EyeOff className="h-4 w-4" />}
          hint="Tạm ngưng truyền thông"
          tone="accent"
        />
      </div>

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-[#F2C5C7] bg-[#FFF5F5] p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#E31E24]" />
          <div>
            <p className="font-medium text-[#7A271A]">Không thể tải danh sách banner</p>
            <p className="mt-1 text-sm text-[#B42318]">{error}</p>
          </div>
        </div>
      ) : null}

      {!error && total === 0 ? (
        <AdminEmptyState
          icon={<Megaphone className="h-6 w-6" />}
          title="Chưa có banner quảng cáo nào"
          description="Tạo banner quảng cáo đầu tiên để thông tin khuyến mãi đến khách hàng một cách trực quan nhất."
        />
      ) : null}

      {!error && total > 0 ? (
        <BannersTable
          banners={safeBanners}
          page={page}
          pageSize={pageSize}
          pageCount={pageCount}
          total={total}
        />
      ) : null}
    </AdminSection>
  );
}
