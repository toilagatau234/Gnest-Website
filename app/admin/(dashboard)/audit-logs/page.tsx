<<<<<<< HEAD
import { ScrollText } from 'lucide-react';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminPlaceholderPanel } from '@/components/admin/AdminPlaceholderPanel';
import { AdminSection } from '@/components/admin/AdminSection';

export default function AuditLogsPage() {
=======
import { AlertCircle, ScrollText } from 'lucide-react';

import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSection } from '@/components/admin/AdminSection';
import { AdminStatusChip, type AdminStatusTone } from '@/components/admin/AdminStatusChip';
import { AdminTableShell, AdminTh } from '@/components/admin/AdminTableShell';
import { getAuditLogs } from '@/lib/services/admin/audit-logs';

export const dynamic = 'force-dynamic';

const ACTION_META: Record<string, { label: string; tone: AdminStatusTone }> = {
  create: { label: 'Tạo mới', tone: 'success' },
  update: { label: 'Cập nhật', tone: 'info' },
  activate: { label: 'Hiển thị', tone: 'success' },
  deactivate: { label: 'Ẩn', tone: 'warning' },
};

const ENTITY_LABELS: Record<string, string> = {
  products: 'Sản phẩm',
  categories: 'Danh mục',
  inquiries: 'Yêu cầu',
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function metadataName(metadata: unknown): string | null {
  if (metadata && typeof metadata === 'object' && 'name' in metadata) {
    const name = (metadata as { name?: unknown }).name;
    return typeof name === 'string' ? name : null;
  }
  return null;
}

export default async function AuditLogsPage() {
  const { data: logs, error } = await getAuditLogs({ limit: 100 });
  const safeLogs = logs ?? [];

>>>>>>> 3b38c8f142158fddd39741ee7b80a71a7f60a0d6
  return (
    <AdminSection>
      <AdminPageHeader
        title="Nhật ký hoạt động"
<<<<<<< HEAD
        description="Theo dõi các thao tác quan trọng của admin trên dữ liệu CMS."
      />

      <AdminPlaceholderPanel
        icon={<ScrollText className="h-5 w-5" />}
        title="Audit log đã có nền tảng dữ liệu"
        description="Các mutation hiện tại có ghi audit_logs. Giao diện lọc, phân trang và xem chi tiết log nên được triển khai ở phase riêng."
        items={['Hành động', 'Đối tượng dữ liệu', 'Người thao tác']}
      />
=======
        description="Lịch sử các thao tác quan trọng của quản trị viên trên hệ thống."
      />

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-[#F2C5C7] bg-[#FFF5F5] p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#E31E24]" />
          <div>
            <p className="font-medium text-[#7A271A]">Không thể tải nhật ký hoạt động</p>
            <p className="mt-1 text-sm text-[#B42318]">{error}</p>
          </div>
        </div>
      ) : null}

      {!error && safeLogs.length === 0 ? (
        <AdminEmptyState
          icon={<ScrollText className="h-6 w-6" />}
          title="Chưa có hoạt động nào"
          description="Khi quản trị viên tạo, cập nhật hoặc ẩn dữ liệu, hệ thống sẽ ghi lại tại đây."
        />
      ) : null}

      {!error && safeLogs.length > 0 ? (
        <AdminTableShell
          minWidth={760}
          head={
            <>
              <AdminTh>Hành động</AdminTh>
              <AdminTh>Đối tượng</AdminTh>
              <AdminTh>Chi tiết</AdminTh>
              <AdminTh>Người thực hiện</AdminTh>
              <AdminTh align="right">Thời gian</AdminTh>
            </>
          }
        >
          {safeLogs.map((log) => {
            const meta = ACTION_META[log.action] ?? { label: log.action, tone: 'neutral' as const };
            const name = metadataName(log.metadata);
            return (
              <tr key={log.id} className="transition-colors hover:bg-[#F8FAFC]">
                <td className="px-5 py-3 text-sm">
                  <AdminStatusChip tone={meta.tone}>{meta.label}</AdminStatusChip>
                </td>
                <td className="px-5 py-3 text-sm text-slate-600">{ENTITY_LABELS[log.entity] ?? log.entity}</td>
                <td className="px-5 py-3 text-sm text-slate-700">{name ?? '—'}</td>
                <td className="px-5 py-3 text-sm text-slate-500">{log.actorEmail ?? 'Hệ thống'}</td>
                <td className="whitespace-nowrap px-5 py-3 text-right text-sm text-slate-500">
                  {formatDateTime(log.created_at)}
                </td>
              </tr>
            );
          })}
        </AdminTableShell>
      ) : null}
>>>>>>> 3b38c8f142158fddd39741ee7b80a71a7f60a0d6
    </AdminSection>
  );
}
