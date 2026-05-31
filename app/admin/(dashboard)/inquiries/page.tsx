import { AlertCircle, MessageSquare } from 'lucide-react';

import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSection } from '@/components/admin/AdminSection';
import { InquiriesTable } from '@/components/admin/InquiriesTable';
import { getInquiries } from '@/lib/services/admin/inquiries';

export const revalidate = 60;

export default async function AdminInquiriesPage() {
  const { data: inquiries, error } = await getInquiries({ limit: 100 });
<<<<<<< HEAD
  const safeInquiries = inquiries || [];
  const newCount = safeInquiries.filter((item) => item.status === 'new').length;
=======
  const safeInquiries = inquiries ?? [];
>>>>>>> 3b38c8f142158fddd39741ee7b80a71a7f60a0d6

  return (
    <AdminSection>
      <AdminPageHeader
        title="Yêu cầu báo giá"
<<<<<<< HEAD
        description="Theo dõi và xử lý các yêu cầu gửi từ khách hàng trên website."
        action={
          <div className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm shadow-admin">
            <p className="font-semibold text-[#1B3A6B]">{safeInquiries.length} yêu cầu</p>
            <p className="text-slate-500">{newCount} yêu cầu mới</p>
          </div>
        }
      />

      {error ? (
        <div className="flex items-start gap-3 rounded-xl border border-[#F2C5C7] bg-[#FFF5F5] p-4">
=======
        description="Theo dõi và xử lý các yêu cầu gửi từ khách hàng như một mini-CRM."
      />

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-[#F2C5C7] bg-[#FFF5F5] p-4">
>>>>>>> 3b38c8f142158fddd39741ee7b80a71a7f60a0d6
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
<<<<<<< HEAD
          description="Khi khách hàng gửi form, dữ liệu sẽ hiển thị tại đây."
=======
          description="Khi khách hàng gửi form từ website, yêu cầu sẽ hiển thị tại đây."
>>>>>>> 3b38c8f142158fddd39741ee7b80a71a7f60a0d6
        />
      ) : null}

      {!error && safeInquiries.length > 0 ? <InquiriesTable inquiries={safeInquiries} /> : null}
    </AdminSection>
  );
}
