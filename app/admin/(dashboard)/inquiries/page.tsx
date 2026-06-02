import { AlertCircle, MessageSquare } from 'lucide-react';

import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSection } from '@/components/admin/AdminSection';
import { InquiriesTable } from '@/components/admin/InquiriesTable';
import { getAdminUsers } from '@/lib/services/admin/admin-users';
import { getInquiries, getInquiryStats } from '@/lib/services/admin/inquiries';
import { getAdminUserIfExists } from '@/lib/services/admin/auth';

export const revalidate = 60;

export default async function AdminInquiriesPage() {
  const [
    { data: inquiries, error: inquiriesError },
    { data: adminUsers, error: adminUsersError },
    { data: stats },
    adminUser,
  ] = await Promise.all([
    getInquiries({ limit: 100 }),
    getAdminUsers(),
    getInquiryStats(),
    getAdminUserIfExists(),
  ]);
  const safeInquiries = inquiries ?? [];
  const safeAdminUsers = adminUsers.filter(
    (user) => user.is_active && ['super_admin', 'admin', 'editor'].includes(user.role)
  );
  const canMutateWorkflow = adminUser ? ['super_admin', 'admin', 'editor'].includes(adminUser.role) : false;
  const error = inquiriesError || adminUsersError;

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

      {!error && safeInquiries.length === 0 ? (
        <AdminEmptyState
          icon={<MessageSquare className="h-6 w-6" />}
          title="Chưa có yêu cầu báo giá nào"
          description="Khi khách hàng gửi form từ website, yêu cầu sẽ hiển thị tại đây."
        />
      ) : null}

      {!error && safeInquiries.length > 0 ? (
        <InquiriesTable
          adminUsers={safeAdminUsers}
          inquiries={safeInquiries}
          stats={stats}
          canMutateWorkflow={canMutateWorkflow}
        />
      ) : null}
    </AdminSection>
  );
}
