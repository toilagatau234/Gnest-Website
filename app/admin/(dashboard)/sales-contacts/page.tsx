import { AlertCircle, Eye, EyeOff, Phone, PhoneCall, UserRound } from 'lucide-react';

import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSection } from '@/components/admin/AdminSection';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { SalesContactFormDialog } from '@/components/admin/SalesContactFormDialog';
import { SalesContactsTable } from '@/components/admin/SalesContactsTable';
import {
  getAdminSalesContacts,
  getAdminSalesContactsPage,
  getAdminSalesContactStats,
} from '@/lib/services/admin/sales-contacts';

export const dynamic = 'force-dynamic';

export default async function SalesContactsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const pageSize = 20;

  const [pageResult, statsResult, allContactsResult] = await Promise.all([
    getAdminSalesContactsPage({ page, pageSize }),
    getAdminSalesContactStats(),
    getAdminSalesContacts(),
  ]);

  const { data: contacts, error: pageError, pageCount, total } = pageResult;
  const { data: stats } = statsResult;
  const safeContacts = contacts ?? [];
  const allContacts = allContactsResult.data ?? [];
  const error = pageError ?? allContactsResult.error;

  return (
    <AdminSection>
      <AdminPageHeader
        title="Liên hệ bán hàng"
        description="Quản lý hotline, Zalo và nhân sự tư vấn hiển thị trên website."
        action={<SalesContactFormDialog />}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Tổng liên hệ"
          value={stats.total}
          icon={<PhoneCall className="h-4 w-4" />}
          hint="Toàn bộ nhân sự tư vấn"
        />
        <AdminStatCard
          label="Đang hiển thị"
          value={stats.activeCount}
          icon={<Eye className="h-4 w-4" />}
          hint="Xuất hiện trên website"
        />
        <AdminStatCard
          label="Đang ẩn"
          value={stats.hiddenCount}
          icon={<EyeOff className="h-4 w-4" />}
          hint="Tạm ngưng công khai"
          tone="accent"
        />
        <AdminStatCard
          label="Có Zalo"
          value={stats.zaloReadyCount}
          icon={<UserRound className="h-4 w-4" />}
          hint="Sẵn sàng tư vấn nhanh"
        />
      </div>

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-[#F2C5C7] bg-[#FFF5F5] p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#E31E24]" />
          <div>
            <p className="font-medium text-[#7A271A]">Không thể tải liên hệ bán hàng</p>
            <p className="mt-1 text-sm text-[#B42318]">{error}</p>
          </div>
        </div>
      ) : null}

      {!error && total === 0 ? (
        <AdminEmptyState
          icon={<Phone className="h-6 w-6" />}
          title="Chưa có liên hệ bán hàng nào"
          description="Thêm nhân sự tư vấn đầu tiên để hiển thị hotline và Zalo trên website."
        />
      ) : null}

      {!error && total > 0 ? (
        <SalesContactsTable
          contacts={safeContacts}
          allContacts={allContacts}
          page={page}
          pageSize={pageSize}
          pageCount={pageCount}
          total={total}
        />
      ) : null}
    </AdminSection>
  );
}
