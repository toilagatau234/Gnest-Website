import { AlertCircle, Briefcase, Eye, EyeOff, MapPin } from 'lucide-react';

import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSection } from '@/components/admin/AdminSection';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { JobFormDialog } from '@/components/admin/JobFormDialog';
import { JobsTable } from '@/components/admin/JobsTable';
import { getAdminJobs } from '@/lib/services/admin/jobs';

export const dynamic = 'force-dynamic';

export default async function JobsPage() {
  const { data: jobs, error } = await getAdminJobs();
  const safeJobs = jobs || [];
  
  const activeCount = safeJobs.filter((job) => job.is_active).length;
  const hiddenCount = safeJobs.length - activeCount;
  const locationCount = safeJobs.filter((job) => Boolean(job.location)).length;

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
          value={safeJobs.length}
          icon={<Briefcase className="h-4 w-4" />}
          hint="Tổng vị trí tuyển dụng"
        />
        <AdminStatCard
          label="Đang hiển thị"
          value={activeCount}
          icon={<Eye className="h-4 w-4" />}
          hint="Công khai trên website"
        />
        <AdminStatCard
          label="Đã ẩn"
          value={hiddenCount}
          icon={<EyeOff className="h-4 w-4" />}
          hint="Tạm dừng tuyển dụng"
          tone="accent"
        />
        <AdminStatCard
          label="Tin có địa điểm"
          value={locationCount}
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

      {!error && safeJobs.length === 0 ? (
        <AdminEmptyState
          icon={<Briefcase className="h-6 w-6" />}
          title="Chưa có tin tuyển dụng nào"
          description="Đăng tuyển vị trí đầu tiên để thu hút và tìm kiếm nhân tài cho Đại Tài Lợi."
        />
      ) : null}

      {safeJobs.length > 0 ? <JobsTable jobs={safeJobs} /> : null}
    </AdminSection>
  );
}
