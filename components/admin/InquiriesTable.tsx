import { AdminStatusChip } from '@/components/admin/AdminStatusChip';
import { AdminTableShell, AdminTh } from '@/components/admin/AdminTableShell';
import type { Inquiry } from '@/lib/services/admin/inquiries';
import type { InquiryStatus } from '@/lib/types/database';

interface InquiriesTableProps {
  inquiries: Inquiry[];
}

const statusConfig: Record<InquiryStatus, { label: string; tone: 'success' | 'alert' | 'neutral' | 'info' | 'warning' }> = {
  new: { label: 'Mới', tone: 'alert' },
  contacted: { label: 'Đã liên hệ', tone: 'info' },
  quoted: { label: 'Đã báo giá', tone: 'warning' },
  closed: { label: 'Đã đóng', tone: 'success' },
  spam: { label: 'Spam', tone: 'neutral' },
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function truncateText(text: string | null | undefined, maxLength = 64) {
  if (!text) {
    return '-';
  }

  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }

  return text;
}

export function InquiriesTable({ inquiries }: InquiriesTableProps) {
  return (
    <AdminTableShell
      minWidth={980}
      head={
        <>
          <AdminTh>Khách hàng</AdminTh>
          <AdminTh>Số điện thoại</AdminTh>
          <AdminTh>Email</AdminTh>
          <AdminTh>Nội dung</AdminTh>
          <AdminTh>Trạng thái</AdminTh>
          <AdminTh>Ngày tạo</AdminTh>
        </>
      }
    >
      {inquiries.map((inquiry) => {
        const status = inquiry.status as InquiryStatus;
        const currentStatus = statusConfig[status] || statusConfig.new;

        return (
          <tr key={inquiry.id} className="transition-colors hover:bg-[#F8FAFC]">
            <td className="px-5 py-4 text-sm font-semibold text-slate-900">{inquiry.customer_name}</td>
            <td className="px-5 py-4 text-sm text-slate-600">
              <a href={`tel:${inquiry.phone}`} className="font-medium text-[#1B3A6B] hover:text-[#E31E24]">
                {inquiry.phone}
              </a>
            </td>
            <td className="px-5 py-4 text-sm text-slate-600">
              {inquiry.email ? (
                <a href={`mailto:${inquiry.email}`} className="break-all text-[#1B3A6B] hover:text-[#E31E24]">
                  {inquiry.email}
                </a>
              ) : (
                '-'
              )}
            </td>
            <td className="px-5 py-4 text-sm leading-6 text-slate-600">
              <span title={inquiry.message || ''}>{truncateText(inquiry.message)}</span>
            </td>
            <td className="px-5 py-4 text-sm">
              <AdminStatusChip tone={currentStatus.tone}>{currentStatus.label}</AdminStatusChip>
            </td>
            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{formatDate(inquiry.created_at)}</td>
          </tr>
        );
      })}
    </AdminTableShell>
  );
}
