<<<<<<< HEAD
import { AdminStatusChip } from '@/components/admin/AdminStatusChip';
=======
'use client';

import { useMemo, useState } from 'react';
import { Eye, Mail, MessageCircle, Phone } from 'lucide-react';

import { AdminFilterBar } from '@/components/admin/AdminFilterBar';
import { AdminModal } from '@/components/admin/AdminModal';
import { AdminSearchInput } from '@/components/admin/AdminSearchInput';
import { AdminStatusChip, type AdminStatusTone } from '@/components/admin/AdminStatusChip';
>>>>>>> 3b38c8f142158fddd39741ee7b80a71a7f60a0d6
import { AdminTableShell, AdminTh } from '@/components/admin/AdminTableShell';
import type { Inquiry } from '@/lib/services/admin/inquiries';
import type { InquiryStatus } from '@/lib/types/database';

interface InquiriesTableProps {
  inquiries: Inquiry[];
}

<<<<<<< HEAD
const statusConfig: Record<InquiryStatus, { label: string; tone: 'success' | 'alert' | 'neutral' | 'info' | 'warning' }> = {
  new: { label: 'Mới', tone: 'alert' },
  contacted: { label: 'Đã liên hệ', tone: 'info' },
  quoted: { label: 'Đã báo giá', tone: 'warning' },
  closed: { label: 'Đã đóng', tone: 'success' },
  spam: { label: 'Spam', tone: 'neutral' },
=======
type TabId = 'all' | InquiryStatus;

const STATUS_META: Record<InquiryStatus, { label: string; tone: AdminStatusTone }> = {
  new: { label: 'Mới', tone: 'info' },
  contacted: { label: 'Đã liên hệ', tone: 'warning' },
  quoted: { label: 'Đã báo giá', tone: 'success' },
  closed: { label: 'Đã đóng', tone: 'neutral' },
  spam: { label: 'Spam', tone: 'alert' },
>>>>>>> 3b38c8f142158fddd39741ee7b80a71a7f60a0d6
};

const TABS: { id: TabId; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'new', label: 'Mới' },
  { id: 'contacted', label: 'Đã liên hệ' },
  { id: 'quoted', label: 'Đã báo giá' },
  { id: 'closed', label: 'Đã đóng' },
  { id: 'spam', label: 'Spam' },
];

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

<<<<<<< HEAD
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
=======
function zaloLink(phone: string) {
  return `https://zalo.me/${phone.replace(/\D/g, '')}`;
}

function statusMeta(status: string) {
  return STATUS_META[status as InquiryStatus] ?? STATUS_META.new;
}

function QuickActions({ inquiry, compact = false }: { inquiry: Inquiry; compact?: boolean }) {
  const size = compact ? 'h-8 w-8' : 'h-9 w-9';
  return (
    <div className="flex items-center gap-1.5">
      <a
        href={`tel:${inquiry.phone}`}
        title="Gọi điện"
        aria-label="Gọi điện"
        className={`admin-focus flex ${size} items-center justify-center rounded-lg border border-[#E2E8F0] text-slate-500 transition-colors hover:border-[#1B3A6B] hover:text-[#1B3A6B]`}
      >
        <Phone className="h-4 w-4" />
      </a>
      <a
        href={zaloLink(inquiry.phone)}
        target="_blank"
        rel="noopener noreferrer"
        title="Nhắn Zalo"
        aria-label="Nhắn Zalo"
        className={`admin-focus flex ${size} items-center justify-center rounded-lg border border-[#E2E8F0] text-slate-500 transition-colors hover:border-[#1B3A6B] hover:text-[#1B3A6B]`}
      >
        <MessageCircle className="h-4 w-4" />
      </a>
      {inquiry.email ? (
        <a
          href={`mailto:${inquiry.email}`}
          title="Gửi email"
          aria-label="Gửi email"
          className={`admin-focus flex ${size} items-center justify-center rounded-lg border border-[#E2E8F0] text-slate-500 transition-colors hover:border-[#1B3A6B] hover:text-[#1B3A6B]`}
        >
          <Mail className="h-4 w-4" />
        </a>
      ) : null}
    </div>
  );
}

export function InquiriesTable({ inquiries }: InquiriesTableProps) {
  const [tab, setTab] = useState<TabId>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Inquiry | null>(null);

  const counts = useMemo(() => {
    const map: Record<TabId, number> = { all: inquiries.length, new: 0, contacted: 0, quoted: 0, closed: 0, spam: 0 };
    for (const inquiry of inquiries) {
      const status = inquiry.status as InquiryStatus;
      if (status in map) {
        map[status] += 1;
      }
    }
    return map;
  }, [inquiries]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return inquiries.filter((inquiry) => {
      if (tab !== 'all' && inquiry.status !== tab) {
        return false;
      }
      if (normalized) {
        return (
          inquiry.customer_name.toLowerCase().includes(normalized) ||
          inquiry.phone.toLowerCase().includes(normalized) ||
          (inquiry.message ?? '').toLowerCase().includes(normalized)
        );
      }
      return true;
    });
  }, [inquiries, tab, query]);

  return (
    <div className="space-y-4">
      {/* Status tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-[#EEF2F6] pb-px">
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`admin-focus -mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? 'border-[#1B3A6B] text-[#1B3A6B]' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {item.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                  active ? 'bg-[#1B3A6B]/10 text-[#1B3A6B]' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {counts[item.id]}
              </span>
            </button>
          );
        })}
      </div>

      <AdminFilterBar>
        <AdminSearchInput value={query} onChange={setQuery} placeholder="Tìm theo tên, SĐT hoặc nội dung…" />
        <span className="text-sm text-slate-400">{filtered.length} yêu cầu</span>
      </AdminFilterBar>

      <AdminTableShell
        minWidth={880}
        head={
          <>
            <AdminTh>Khách hàng</AdminTh>
            <AdminTh>Liên hệ</AdminTh>
            <AdminTh>Nội dung</AdminTh>
            <AdminTh>Trạng thái</AdminTh>
            <AdminTh>Ngày gửi</AdminTh>
            <AdminTh align="right">Thao tác</AdminTh>
          </>
        }
      >
        {filtered.length === 0 ? (
          <tr>
            <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
              Không có yêu cầu nào trong mục này.
            </td>
          </tr>
        ) : (
          filtered.map((inquiry) => {
            const meta = statusMeta(inquiry.status);
            const isNew = inquiry.status === 'new';
            return (
              <tr key={inquiry.id} className={`transition-colors hover:bg-[#F8FAFC] ${isNew ? 'bg-[#1B3A6B]/[0.02]' : ''}`}>
                <td className="px-5 py-3 text-sm font-semibold text-slate-900">{inquiry.customer_name}</td>
                <td className="px-5 py-3 text-sm">
                  <a href={`tel:${inquiry.phone}`} className="font-medium text-[#1B3A6B] hover:underline">
                    {inquiry.phone}
                  </a>
                  {inquiry.email ? <p className="truncate text-xs text-slate-400">{inquiry.email}</p> : null}
                </td>
                <td className="max-w-xs px-5 py-3 text-sm text-slate-600">
                  <span className="line-clamp-1">{inquiry.message || '—'}</span>
                </td>
                <td className="px-5 py-3 text-sm">
                  <AdminStatusChip tone={meta.tone} dot={isNew}>
                    {meta.label}
                  </AdminStatusChip>
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-sm text-slate-500">{formatDateTime(inquiry.created_at)}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <QuickActions inquiry={inquiry} compact />
                    <button
                      type="button"
                      onClick={() => setSelected(inquiry)}
                      title="Xem chi tiết"
                      aria-label="Xem chi tiết"
                      className="admin-focus flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] text-slate-500 transition-colors hover:border-[#1B3A6B] hover:text-[#1B3A6B]"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </AdminTableShell>

      <AdminModal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title="Chi tiết yêu cầu"
        description={selected ? formatDateTime(selected.created_at) : undefined}
        size="md"
      >
        {selected ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-900">{selected.customer_name}</p>
                <a href={`tel:${selected.phone}`} className="text-sm font-medium text-[#1B3A6B] hover:underline">
                  {selected.phone}
                </a>
              </div>
              <AdminStatusChip tone={statusMeta(selected.status).tone} dot>
                {statusMeta(selected.status).label}
              </AdminStatusChip>
            </div>

            <dl className="space-y-3 rounded-lg border border-[#EEF2F6] bg-slate-50/60 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Email</dt>
                <dd className="text-right text-slate-800">{selected.email || '—'}</dd>
              </div>
              <div>
                <dt className="mb-1 text-slate-500">Nội dung</dt>
                <dd className="whitespace-pre-line leading-relaxed text-slate-800">{selected.message || '—'}</dd>
              </div>
            </dl>

            <div className="flex items-center justify-between gap-3 border-t border-[#EEF2F6] pt-4">
              <span className="text-xs text-slate-400">Cập nhật trạng thái sẽ được bổ sung ở phase sau.</span>
              <QuickActions inquiry={selected} />
            </div>
          </div>
        ) : null}
      </AdminModal>
    </div>
>>>>>>> 3b38c8f142158fddd39741ee7b80a71a7f60a0d6
  );
}
