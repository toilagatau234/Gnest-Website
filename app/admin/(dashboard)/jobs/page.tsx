import { AlertCircle, Briefcase, Eye, EyeOff, MapPin } from 'lucide-react';

import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSection } from '@/components/admin/AdminSection';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { JobFormDialog } from '@/components/admin/JobFormDialog';
import { JobsTable } from '@/components/admin/JobsTable';
import { getAdminJobs, getAdminJobsPage, getAdminJobStats } from '@/lib/services/admin/jobs';

export const dynamic = 'force-dynamic';

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const pageSize = 20;

  const [pageResult, statsResult, allJobsResult] = await Promise.all([
    getAdminJobsPage({ page, pageSize }),
    getAdminJobStats(),
    getAdminJobs(),
  ]);

  const { data: jobs, error: pageError, pageCount, total } = pageResult;
  const { data: stats } = statsResult;
  const safeJobs = jobs ?? [];
  const allJobs = allJobsResult.data ?? [];
  const error = pageError ?? allJobsResult.error;

  return (
    <AdminSection>
      <AdminPageHeader
        title="Tin Tuyển Dụng"
        description="Quản lý tin tuyển dụng và vị trí ứng tuyển hiển thị trên trang /tuyen-dung ngoài website."
        action={<JobFormDialog />}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Tổng tin đăng"
          value={stats.total}
          icon={<Briefcase className="h-4 w-4" />}
          hint="Tổng vị trí tuyển dụng"
        />
        <AdminStatCard
          label="Đang hiển thị"
          value={stats.activeCount}
          icon={<Eye className="h-4 w-4" />}
          hint="Công khai trên website"
        />
        <AdminStatCard
          label="Đã ẩn"
          value={stats.hiddenCount}
          icon={<EyeOff className="h-4 w-4" />}
          hint="Tạm dừng tuyển dụng"
          tone="accent"
        />
        <AdminStatCard
          label="Tin có địa điểm"
          value={stats.locationCount}
          icon={<MapPin className="h-4 w-4" />}
          hint="Giúp ứng viên định vị"
        />
      </div>

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-[#F2C5C7] bg-[#FFF5F5] p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#E31E24]" />
          <div>
            <p className="font-medium text-[#7A271A]">Không thể tải tin tuyển dụng</p>
            <p className="mt-1 text-sm text-[#B42318]">{error}</p>
          </div>
        </div>
      ) : null}

      {!error && total === 0 ? (
        <AdminEmptyState
          icon={<Briefcase className="h-6 w-6" />}
          title="Chưa có tin tuyển dụng nào"
          description="Đăng tuyển vị trí đầu tiên để thu hút và tìm kiếm nhân tài cho Đại Tài Lợi."
        />
      ) : null}

      {!error && total > 0 ? (
        <JobsTable
          jobs={safeJobs}
          allJobs={allJobs}
          page={page}
          pageSize={pageSize}
          pageCount={pageCount}
          total={total}
        />
      ) : null}
    </AdminSection>
  );
}
