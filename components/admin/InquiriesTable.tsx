'use client';

import type { BadgeVariant } from '@/components/ui/badge';
import { Badge } from '@/components/ui/badge';
import type { Inquiry } from '@/lib/services/admin/inquiries';
import type { InquiryStatus } from '@/lib/types/database';

interface InquiriesTableProps {
  inquiries: Inquiry[];
}

const statusConfig: Record<InquiryStatus, { label: string; variant: BadgeVariant }> = {
  new: { label: 'Mới', variant: 'default' },
  contacted: { label: 'Đã liên hệ', variant: 'secondary' },
  quoted: { label: 'Đã báo giá', variant: 'outline' },
  closed: { label: 'Đã đóng', variant: 'secondary' },
  spam: { label: 'Spam', variant: 'destructive' },
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function truncateText(text: string | null | undefined, maxLength = 60) {
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
    <div className="overflow-x-auto rounded-2xl border border-[#D7E0EC] bg-white">
      <table className="w-full">
        <thead className="border-b border-[#D7E0EC] bg-[#F4F7FB]">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#1B3A6B]">
              Khách hàng
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#1B3A6B]">
              Số điện thoại
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#1B3A6B]">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#1B3A6B]">
              Nội dung
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#1B3A6B]">
              Trạng thái
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#1B3A6B]">
              Ngày tạo
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EEF2F6]">
          {inquiries.map((inquiry) => {
            const status = inquiry.status as InquiryStatus;
            const currentStatus = statusConfig[status] || statusConfig.new;

            return (
              <tr key={inquiry.id} className="transition-colors hover:bg-[#FFF9F9]">
                <td className="px-6 py-4 text-sm font-medium text-slate-900">
                  {inquiry.customer_name}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <a href={`tel:${inquiry.phone}`} className="text-[#E31E24] hover:underline">
                    {inquiry.phone}
                  </a>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {inquiry.email ? (
                    <a
                      href={`mailto:${inquiry.email}`}
                      className="break-all text-[#1B3A6B] hover:underline"
                    >
                      {inquiry.email}
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <span title={inquiry.message || ''}>{truncateText(inquiry.message, 50)}</span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <Badge variant={currentStatus.variant} className="whitespace-nowrap">
                    {currentStatus.label}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm whitespace-nowrap text-slate-600">
                  {formatDate(inquiry.created_at)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
