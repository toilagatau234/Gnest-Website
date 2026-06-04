import { AlertCircle, MessageSquare } from 'lucide-react';

import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSection } from '@/components/admin/AdminSection';
import { InquiriesTable } from '@/components/admin/InquiriesTable';
import { getAdminUsers } from '@/lib/services/admin/admin-users';
import { getInquiriesPage, getInquiryStats } from '@/lib/services/admin/inquiries';
import { getAdminUserIfExists } from '@/lib/services/admin/auth';
import type { InquiryStatus } from '@/lib/types/database';
import type { InquiryPriority } from '@/lib/services/admin/inquiries';

export const dynamic = 'force-dynamic';

function parseStatus(v: unknown): InquiryStatus | undefined {
  const VALID: InquiryStatus[] = ['new', 'contacted', 'quoted', 'closed', 'spam'];
  return typeof v === 'string' && VALID.includes(v as InquiryStatus) ? (v as InquiryStatus) : undefined;
}

function parsePriority(v: unknown): InquiryPriority | undefined {
  return v === 'low' || v === 'normal' || v === 'high' ? v : undefined;
}

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(sp.pageSize) || 20));
  const q = typeof sp.q === 'string' && sp.q ? sp.q : undefined;
  const status = parseStatus(sp.status);
  const assignedTo = typeof sp.assignedTo === 'string' && sp.assignedTo ? sp.assignedTo : undefined;
  const priority = parsePriority(sp.priority);
  const dateFrom = typeof sp.dateFrom === 'string' && sp.dateFrom ? sp.dateFrom : undefined;
  const dateTo = typeof sp.dateTo === 'string' && sp.dateTo ? sp.dateTo : undefined;

  const [
    inquiriesResult,
    { data: adminUsers, error: adminUsersError },
    { data: stats },
    adminUser,
  ] = await Promise.all([
    getInquiriesPage({ page, pageSize, q, status, assignedTo, priority, dateFrom, dateTo }),
    getAdminUsers(),
    getInquiryStats(),
    getAdminUserIfExists(),
  ]);

  const { data: inquiries, error: inquiriesError, total, pageCount } = inquiriesResult;
  const safeInquiries = inquiries ?? [];
  const safeAdminUsers = adminUsers.filter(
    (user) => user.is_active && ['super_admin', 'admin', 'editor'].includes(user.role),
  );
  const canMutateWorkflow = adminUser
    ? ['super_admin', 'admin', 'editor'].includes(adminUser.role)
    : false;
  const error = inquiriesError || adminUsersError;
  const hasActiveFilter = !!(q || status);

  return (
    <AdminSection>
      <AdminPageHeader
        title="Yêu cầu báo giá"
        description="Theo dõi và xử lý các yêu cầu gửi từ khách hàng như một mini-CRM."
      />

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-[#F2C5C7] bg-[#FFF5F5] p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#E31E24]" />
          <div>
            <p className="font-medium text-[#7A271A]">Không thể tải yêu cầu báo giá</p>
            <p className="mt-1 text-sm text-[#B42318]">{error}</p>
          </div>
        </div>
      ) : null}

      {!error && total === 0 && !hasActiveFilter ? (
        <AdminEmptyState
          icon={<MessageSquare className="h-6 w-6" />}
          title="Chưa có yêu cầu báo giá nào"
          description="Khi khách hàng gửi form từ website, yêu cầu sẽ hiển thị tại đây."
        />
      ) : null}

      {!error && (total > 0 || hasActiveFilter) ? (
        <InquiriesTable
          adminUsers={safeAdminUsers}
          inquiries={safeInquiries}
          stats={stats}
          canMutateWorkflow={canMutateWorkflow}
          page={page}
          pageCount={pageCount}
          total={total}
          currentQ={q}
          currentStatus={status}
        />
      ) : null}
    </AdminSection>
  );
}
