'use client';

import { Badge } from '@/components/ui/badge';
import type { Inquiry } from '@/lib/services/admin/inquiries';
import type { InquiryStatus } from '@/lib/types/database';
import type { BadgeVariant } from '@/components/ui/badge';

interface InquiriesTableProps {
  inquiries: Inquiry[];
}

const statusConfig: Record<InquiryStatus, { label: string; variant: BadgeVariant }> = {
  new: { label: 'Mới', variant: 'default' },
  contacted: { label: 'Đã liên hệ', variant: 'secondary' },
  quoted: { label: 'Đã báo giá', variant: 'outline' },
  closed: { label: 'Đóng', variant: 'secondary' },
  spam: { label: 'Spam', variant: 'destructive' },
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function truncateText(text: string | null | undefined, maxLength: number = 60) {
  if (!text) return '—';
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
}

export function InquiriesTable({ inquiries }: InquiriesTableProps) {
  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
              Khách hàng
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
              Số điện thoại
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
              Nội dung
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
              Trạng thái
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
              Ngày tạo
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {inquiries.map((inquiry) => {
            const status = inquiry.status as InquiryStatus;
            const statusConfig_ = statusConfig[status] || statusConfig.new;

            return (
              <tr key={inquiry.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {inquiry.customer_name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <a
                    href={`tel:${inquiry.phone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {inquiry.phone}
                  </a>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {inquiry.email ? (
                    <a
                      href={`mailto:${inquiry.email}`}
                      className="text-blue-600 hover:underline break-all"
                    >
                      {inquiry.email}
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <span title={inquiry.message || ''}>
                    {truncateText(inquiry.message, 50)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <Badge
                    variant={statusConfig_.variant}
                    className="whitespace-nowrap"
                  >
                    {statusConfig_.label}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
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
