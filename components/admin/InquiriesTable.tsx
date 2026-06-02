'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Clock,
  Eye,
  Mail,
  MessageCircle,
  Phone,
  Send,
  UserCheck,
} from 'lucide-react';

import {
  addInquiryInternalNoteAction,
  assignInquiryAction,
  updateInquiryPriorityAction,
  updateInquiryStatusAction,
} from '@/app/admin/(dashboard)/inquiries/actions';
import { AdminFilterBar } from '@/components/admin/AdminFilterBar';
import { AdminModal } from '@/components/admin/AdminModal';
import { AdminSearchInput } from '@/components/admin/AdminSearchInput';
import { AdminStatusChip, type AdminStatusTone } from '@/components/admin/AdminStatusChip';
import { AdminTableShell, AdminTh } from '@/components/admin/AdminTableShell';
import { useToast } from '@/components/admin/AdminToast';
import type { AdminUserListItem } from '@/lib/services/admin/admin-users';
import type {
  AdminInquiry,
  InquiryInternalNote,
  InquiryPriority,
  InquiryStats,
  InquiryTimelineItem,
} from '@/lib/services/admin/inquiries';
import type { InquiryStatus, Json } from '@/lib/types/database';

interface InquiriesTableProps {
  inquiries: AdminInquiry[];
  adminUsers: AdminUserListItem[];
  stats: InquiryStats;
  canMutateWorkflow?: boolean;
}

type TabId = 'all' | InquiryStatus;

interface WorkflowMetadata {
  priority?: InquiryPriority;
  internal_notes?: InquiryInternalNote[];
  timeline?: InquiryTimelineItem[];
}

const STATUS_META: Record<InquiryStatus, { label: string; tone: AdminStatusTone }> = {
  new: { label: 'Mới', tone: 'info' },
  contacted: { label: 'Đã liên hệ', tone: 'warning' },
  quoted: { label: 'Đã báo giá', tone: 'success' },
  closed: { label: 'Đã đóng', tone: 'neutral' },
  spam: { label: 'Spam', tone: 'alert' },
};

const PRIORITY_META: Record<InquiryPriority, { label: string; className: string }> = {
  low: { label: 'Thấp', className: 'border-slate-200 bg-slate-50 text-slate-500' },
  normal: { label: 'Bình thường', className: 'border-[#DDE5F8] bg-[#4880FF]/10 text-[#3749A6]' },
  high: { label: 'Cao', className: 'border-red-200 bg-red-50 text-[#E31E24]' },
};

const TABS: { id: TabId; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'new', label: 'Mới' },
  { id: 'contacted', label: 'Đã liên hệ' },
  { id: 'quoted', label: 'Đã báo giá' },
  { id: 'closed', label: 'Đã đóng' },
  { id: 'spam', label: 'Spam' },
];

const STATUS_FLOW: InquiryStatus[] = ['new', 'contacted', 'quoted', 'closed', 'spam'];

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function zaloLink(phone: string) {
  return `https://zalo.me/${phone.replace(/\D/g, '')}`;
}

function statusMeta(status: string) {
  return STATUS_META[status as InquiryStatus] ?? STATUS_META.new;
}

function isRecord(value: Json): value is Record<string, Json | undefined> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isWorkflowNote(value: unknown): value is InquiryInternalNote {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const note = value as Partial<InquiryInternalNote>;
  return (
    typeof note.id === 'string' &&
    typeof note.note === 'string' &&
    typeof note.actor_email === 'string' &&
    typeof note.created_at === 'string'
  );
}

function isTimelineItem(value: unknown): value is InquiryTimelineItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Partial<InquiryTimelineItem>;
  return typeof item.id === 'string' && typeof item.type === 'string' && typeof item.created_at === 'string';
}

function getWorkflowMetadata(inquiry: AdminInquiry): WorkflowMetadata {
  if (!isRecord(inquiry.metadata)) {
    return {};
  }

  const priority =
    inquiry.metadata.priority === 'low' ||
    inquiry.metadata.priority === 'normal' ||
    inquiry.metadata.priority === 'high'
      ? inquiry.metadata.priority
      : undefined;

  return {
    priority,
    internal_notes: Array.isArray(inquiry.metadata.internal_notes)
      ? (inquiry.metadata.internal_notes as unknown[]).filter(isWorkflowNote)
      : [],
    timeline: Array.isArray(inquiry.metadata.timeline)
      ? (inquiry.metadata.timeline as unknown[]).filter(isTimelineItem)
      : [],
  };
}

function QuickActions({ inquiry, compact = false }: { inquiry: AdminInquiry; compact?: boolean }) {
  const size = compact ? 'h-8 w-8' : 'h-9 w-9';
  return (
    <div className="flex items-center gap-1.5">
      <a
        href={`tel:${inquiry.phone}`}
        title="Gọi điện"
        aria-label="Gọi điện"
        className={`admin-focus flex ${size} items-center justify-center rounded-lg border border-[#E5E7EF] text-slate-500 transition-colors hover:border-[#4880FF] hover:text-[#3749A6]`}
      >
        <Phone className="h-4 w-4" />
      </a>
      <a
        href={zaloLink(inquiry.phone)}
        target="_blank"
        rel="noopener noreferrer"
        title="Nhắn Zalo"
        aria-label="Nhắn Zalo"
        className={`admin-focus flex ${size} items-center justify-center rounded-lg border border-[#E5E7EF] text-slate-500 transition-colors hover:border-[#4880FF] hover:text-[#3749A6]`}
      >
        <MessageCircle className="h-4 w-4" />
      </a>
      {inquiry.email ? (
        <a
          href={`mailto:${inquiry.email}`}
          title="Gửi email"
          aria-label="Gửi email"
          className={`admin-focus flex ${size} items-center justify-center rounded-lg border border-[#E5E7EF] text-slate-500 transition-colors hover:border-[#4880FF] hover:text-[#3749A6]`}
        >
          <Mail className="h-4 w-4" />
        </a>
      ) : null}
    </div>
  );
}

function AssigneeLabel({
  assignedTo,
  adminUsers,
}: {
  assignedTo: string | null;
  adminUsers: AdminUserListItem[];
}) {
  const assignee = assignedTo ? adminUsers.find((user) => user.id === assignedTo) : null;

  return (
    <span className="inline-flex max-w-40 items-center gap-1.5 truncate rounded-full border border-[#E5E7EF] bg-white px-2.5 py-1 text-[11px] font-bold text-[#646464]">
      <UserCheck className="h-3 w-3 shrink-0" />
      {assignee ? assignee.email.split('@')[0] : 'Chưa gán'}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: InquiryPriority }) {
  const meta = PRIORITY_META[priority];

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${meta.className}`}>
      {meta.label}
    </span>
  );
}

export function InquiriesTable({ inquiries, adminUsers, stats, canMutateWorkflow = true }: InquiriesTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState<TabId>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selected = selectedId ? inquiries.find((inquiry) => inquiry.id === selectedId) ?? null : null;

  const counts = useMemo(() => {
    return {
      all: stats.total,
      ...stats.byStatus,
    };
  }, [stats]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return inquiries.filter((inquiry) => {
      if (tab !== 'all' && inquiry.status !== tab) {
        return false;
      }
      if (normalized) {
        const assignee = inquiry.assigned_to ? adminUsers.find((u) => u.id === inquiry.assigned_to) : null;
        const assigneeEmail = assignee ? assignee.email.toLowerCase() : '';
        const productName = inquiry.products?.name?.toLowerCase() ?? '';

        return (
          inquiry.customer_name.toLowerCase().includes(normalized) ||
          inquiry.phone.toLowerCase().includes(normalized) ||
          (inquiry.email ?? '').toLowerCase().includes(normalized) ||
          (inquiry.message ?? '').toLowerCase().includes(normalized) ||
          productName.includes(normalized) ||
          assigneeEmail.includes(normalized)
        );
      }
      return true;
    });
  }, [inquiries, tab, query, adminUsers]);

  const runAction = (formData: FormData, action: (formData: FormData) => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = await action(formData);
      if (!result.ok) {
        setError(result.error ?? 'Không thể cập nhật yêu cầu.');
        toast(result.error ?? 'Không thể cập nhật yêu cầu.', 'error');
        return;
      }

      toast('Đã cập nhật yêu cầu báo giá.', 'success');
      router.refresh();
    });
  };

  const updateStatus = (inquiryId: string, status: InquiryStatus) => {
    const formData = new FormData();
    formData.set('inquiry_id', inquiryId);
    formData.set('status', status);
    runAction(formData, updateInquiryStatusAction);
  };

  const updateAssignee = (inquiryId: string, assignedTo: string) => {
    const formData = new FormData();
    formData.set('inquiry_id', inquiryId);
    formData.set('assigned_to', assignedTo);
    runAction(formData, assignInquiryAction);
  };

  const updatePriority = (inquiryId: string, priority: InquiryPriority) => {
    const formData = new FormData();
    formData.set('inquiry_id', inquiryId);
    formData.set('priority', priority);
    runAction(formData, updateInquiryPriorityAction);
  };

  const submitNote = () => {
    if (!selected || !note.trim()) {
      return;
    }

    const formData = new FormData();
    formData.set('inquiry_id', selected.id);
    formData.set('note', note);
    setNote('');
    runAction(formData, addInquiryInternalNoteAction);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="admin-card p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#646464]">Tổng yêu cầu</p>
          <p className="mt-2 text-2xl font-extrabold text-[#202224]">{stats.total}</p>
        </div>
        <div className="admin-card p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#646464]">Mới</p>
          <p className="mt-2 text-2xl font-extrabold text-[#E31E24]">{stats.byStatus.new}</p>
        </div>
        <div className="admin-card p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#646464]">Đã gán</p>
          <p className="mt-2 text-2xl font-extrabold text-[#3749A6]">{stats.assigned}</p>
        </div>
        <div className="admin-card p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#646464]">Chưa gán</p>
          <p className="mt-2 text-2xl font-extrabold text-amber-600">{stats.unassigned}</p>
        </div>
        <div className="admin-card p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#646464]">Ưu tiên cao</p>
          <p className="mt-2 text-2xl font-extrabold text-[#E31E24]">{stats.highPriority}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-[#EEF2F6] pb-px">
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`admin-focus -mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? 'border-[#4880FF] text-[#3749A6]' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {item.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                  active ? 'bg-[#4880FF]/10 text-[#3749A6]' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {counts[item.id]}
              </span>
            </button>
          );
        })}
      </div>

      <AdminFilterBar>
        <AdminSearchInput value={query} onChange={setQuery} placeholder="Tìm theo tên, SĐT, email hoặc nội dung..." />
        <span className="text-sm text-slate-400">{filtered.length} yêu cầu</span>
      </AdminFilterBar>

      <AdminTableShell
        minWidth={1040}
        head={
          <>
            <AdminTh>Khách hàng</AdminTh>
            <AdminTh>Liên hệ</AdminTh>
            <AdminTh>Nội dung</AdminTh>
            <AdminTh>Trạng thái</AdminTh>
            <AdminTh>Ưu tiên</AdminTh>
            <AdminTh>Phụ trách</AdminTh>
            <AdminTh>Ngày gửi</AdminTh>
            <AdminTh align="right">Thao tác</AdminTh>
          </>
        }
      >
        {filtered.length === 0 ? (
          <tr>
            <td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-500">
              Không có yêu cầu nào trong mục này.
            </td>
          </tr>
        ) : (
          filtered.map((inquiry) => {
            const meta = statusMeta(inquiry.status);
            const workflow = getWorkflowMetadata(inquiry);
            const priority = workflow.priority ?? 'normal';
            const isNew = inquiry.status === 'new';

            return (
              <tr key={inquiry.id} className={`transition-colors hover:bg-[#F8FAFC] ${isNew ? 'bg-[#4880FF]/[0.03]' : ''}`}>
                <td className="px-5 py-3 text-sm font-semibold text-slate-900">{inquiry.customer_name}</td>
                <td className="px-5 py-3 text-sm">
                  <a href={`tel:${inquiry.phone}`} className="font-medium text-[#3749A6] hover:underline">
                    {inquiry.phone}
                  </a>
                  {inquiry.email ? <p className="truncate text-xs text-slate-400">{inquiry.email}</p> : null}
                </td>
                <td className="max-w-xs px-5 py-3 text-sm text-slate-600">
                  <span className="line-clamp-1">{inquiry.message || '—'}</span>
                  {inquiry.products ? (
                    <div className="mt-1">
                      <span className="inline-flex items-center gap-1 rounded bg-[#4880FF]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#3749A6]" title={`Sản phẩm: ${inquiry.products.name}`}>
                        🎁 {inquiry.products.name}
                      </span>
                    </div>
                  ) : null}
                </td>
                <td className="px-5 py-3 text-sm">
                  <AdminStatusChip tone={meta.tone} dot={isNew}>
                    {meta.label}
                  </AdminStatusChip>
                </td>
                <td className="px-5 py-3 text-sm">
                  <PriorityBadge priority={priority} />
                </td>
                <td className="px-5 py-3 text-sm">
                  <AssigneeLabel assignedTo={inquiry.assigned_to} adminUsers={adminUsers} />
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-sm text-slate-500">{formatDateTime(inquiry.created_at)}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <QuickActions inquiry={inquiry} compact />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(inquiry.id);
                        setNote('');
                        setError(null);
                      }}
                      title="Xem chi tiết"
                      aria-label="Xem chi tiết"
                      className="admin-focus flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EF] text-slate-500 transition-colors hover:border-[#4880FF] hover:text-[#3749A6]"
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
        onClose={() => setSelectedId(null)}
        title="Chi tiết yêu cầu"
        description={selected ? formatDateTime(selected.created_at) : undefined}
        size="xl"
        footer={selected ? <QuickActions inquiry={selected} /> : undefined}
      >
        {selected ? (
          <InquiryWorkflowPanel
            adminUsers={adminUsers}
            error={error}
            inquiry={selected}
            isPending={isPending}
            note={note}
            onAssigneeChange={updateAssignee}
            onNoteChange={setNote}
            onNoteSubmit={submitNote}
            onPriorityChange={updatePriority}
            onStatusChange={updateStatus}
            canMutateWorkflow={canMutateWorkflow}
          />
        ) : null}
      </AdminModal>
    </div>
  );
}

function InquiryWorkflowPanel({
  inquiry,
  adminUsers,
  isPending,
  error,
  note,
  onStatusChange,
  onAssigneeChange,
  onPriorityChange,
  onNoteChange,
  onNoteSubmit,
  canMutateWorkflow = true,
}: {
  inquiry: AdminInquiry;
  adminUsers: AdminUserListItem[];
  isPending: boolean;
  error: string | null;
  note: string;
  onStatusChange: (inquiryId: string, status: InquiryStatus) => void;
  onAssigneeChange: (inquiryId: string, assignedTo: string) => void;
  onPriorityChange: (inquiryId: string, priority: InquiryPriority) => void;
  onNoteChange: (value: string) => void;
  onNoteSubmit: () => void;
  canMutateWorkflow?: boolean;
}) {
  const workflow = getWorkflowMetadata(inquiry);
  const priority = workflow.priority ?? 'normal';
  const notes = workflow.internal_notes ?? [];
  const timeline = workflow.timeline ?? [];

  return (
    <div className="space-y-5">
      {error ? (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-[#FFF5F5] px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#E31E24]" />
          <p className="text-xs font-medium text-[#B42318]">{error}</p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-slate-900">{inquiry.customer_name}</p>
              <a href={`tel:${inquiry.phone}`} className="text-sm font-medium text-[#3749A6] hover:underline">
                {inquiry.phone}
              </a>
              {inquiry.email ? <p className="text-sm text-slate-500">{inquiry.email}</p> : null}
            </div>
            <AdminStatusChip tone={statusMeta(inquiry.status).tone} dot>
              {statusMeta(inquiry.status).label}
            </AdminStatusChip>
          </div>

          <dl className="space-y-3 rounded-2xl border border-[#EEF2F6] bg-slate-50/60 p-4 text-sm">
            <div>
              <dt className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Sản phẩm quan tâm</dt>
              <dd className="font-semibold text-slate-900">
                {inquiry.products ? (
                  <a
                    href={`/san-pham/${inquiry.products.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[#3749A6] hover:underline"
                  >
                    🎁 {inquiry.products.name}
                  </a>
                ) : (
                  <span className="text-slate-400">Không gắn sản phẩm</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Nội dung khách gửi</dt>
              <dd className="whitespace-pre-line leading-relaxed text-slate-800">{inquiry.message || '—'}</dd>
            </div>
          </dl>

          <div className="rounded-2xl border border-[#EEF2F6] bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-extrabold text-[#202224]">Ghi chú nội bộ</h3>
              <span className="text-xs font-medium text-slate-400">{notes.length} ghi chú</span>
            </div>
            {canMutateWorkflow ? (
              <>
                <textarea
                  value={note}
                  onChange={(event) => onNoteChange(event.target.value)}
                  rows={3}
                  maxLength={1000}
                  className="admin-input min-h-24 py-2 text-sm leading-relaxed"
                  placeholder="Thêm ghi chú xử lý: đã gọi, khách cần báo giá số lượng, yêu cầu đặc biệt..."
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-400">{note.length}/1000</span>
                  <button
                    type="button"
                    onClick={onNoteSubmit}
                    disabled={isPending || !note.trim()}
                    className="admin-button-primary h-9 px-4 text-xs"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Thêm ghi chú
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs italic text-slate-400 bg-slate-50 border border-[#EEF2F6] rounded-xl p-3 text-center">
                Tài khoản của bạn chỉ có quyền xem (Viewer). Không thể thêm ghi chú nội bộ.
              </p>
            )}

            <div className="mt-4 space-y-2">
              {notes.length === 0 ? (
                <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">Chưa có ghi chú nội bộ.</p>
              ) : (
                notes.map((item) => (
                  <div key={item.id} className="rounded-xl border border-[#EEF2F6] bg-[#F7F9FB] p-3 text-sm">
                    <p className="whitespace-pre-line text-slate-800">{item.note}</p>
                    <p className="mt-2 text-[11px] font-medium text-slate-400">
                      {item.actor_email} · {formatDateTime(item.created_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#EEF2F6] bg-[#F7F9FB] p-4">
            <h3 className="mb-3 text-sm font-extrabold text-[#202224]">Workflow</h3>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Trạng thái</span>
              {canMutateWorkflow ? (
                <select
                  value={inquiry.status}
                  onChange={(event) => onStatusChange(inquiry.id, event.target.value as InquiryStatus)}
                  disabled={isPending}
                  className="admin-select text-sm"
                >
                  {STATUS_FLOW.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_META[status].label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-lg border border-[#E5E7EF] bg-slate-50 px-3 py-2 text-sm text-slate-700 font-medium">
                  {STATUS_META[inquiry.status].label}
                </div>
              )}
            </label>

            <label className="mt-3 block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Phụ trách</span>
              {canMutateWorkflow ? (
                <select
                  value={inquiry.assigned_to ?? ''}
                  onChange={(event) => onAssigneeChange(inquiry.id, event.target.value)}
                  disabled={isPending}
                  className="admin-select text-sm"
                >
                  <option value="">Chưa gán</option>
                  {adminUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.email}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-lg border border-[#E5E7EF] bg-slate-50 px-3 py-2 text-sm text-slate-700 font-medium">
                  {inquiry.assigned_to
                    ? adminUsers.find((u) => u.id === inquiry.assigned_to)?.email ?? 'Chưa gán'
                    : 'Chưa gán'}
                </div>
              )}
            </label>

            <label className="mt-3 block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Ưu tiên</span>
              {canMutateWorkflow ? (
                <select
                  value={priority}
                  onChange={(event) => onPriorityChange(inquiry.id, event.target.value as InquiryPriority)}
                  disabled={isPending}
                  className="admin-select text-sm"
                >
                  <option value="low">Thấp</option>
                  <option value="normal">Bình thường</option>
                  <option value="high">Cao</option>
                </select>
              ) : (
                <div className="rounded-lg border border-[#E5E7EF] bg-slate-50 px-3 py-2 text-sm text-slate-700 font-medium">
                  {PRIORITY_META[priority].label}
                </div>
              )}
            </label>
          </div>

          <div className="rounded-2xl border border-[#EEF2F6] bg-white p-4">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-extrabold text-[#202224]">
              <Clock className="h-4 w-4 text-[#4880FF]" />
              Timeline
            </h3>
            <div className="space-y-3">
              {timeline.length === 0 ? (
                <p className="text-sm text-slate-500">Chưa có hoạt động workflow.</p>
              ) : (
                timeline.slice(0, 8).map((item) => (
                  <div key={item.id} className="border-l-2 border-[#DDE5F8] pl-3 text-sm">
                    <p className="font-semibold text-[#202224]">{item.message || item.type}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {item.actor_email} · {formatDateTime(item.created_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
