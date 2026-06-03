'use client';

import { useState } from 'react';
import { Eye } from 'lucide-react';

import { FormattedDate } from '@/components/admin/FormattedDate';
import { AuditLogActionBadge, AuditLogEntityLabel } from './AuditLogLabels';
import { AuditLogDetailDialog } from './AuditLogDetailDialog';
import type { AuditLogEntry } from '@/lib/services/admin/audit-logs';

interface AuditLogsTableProps {
  logs: AuditLogEntry[];
}

function metadataName(metadata: unknown): string | null {
  if (metadata && typeof metadata === 'object') {
    const meta = metadata as Record<string, unknown>;
    if ('name' in meta && typeof meta.name === 'string') {
      return meta.name;
    }
    if ('email' in meta && typeof meta.email === 'string') {
      return meta.email;
    }
    if ('customer_name' in meta && typeof meta.customer_name === 'string') {
      return meta.customer_name;
    }
  }
  return null;
}

function metadataStatus(metadata: unknown) {
  if (metadata && typeof metadata === 'object') {
    const status = (metadata as Record<string, unknown>).status;
    if (status === 'success') {
      return { label: 'Thành công', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
    }
    if (typeof status === 'string' && status.length > 0) {
      return { label: status, className: 'border-amber-200 bg-amber-50 text-amber-700' };
    }
  }

  return { label: 'Đã ghi log', className: 'border-slate-200 bg-slate-100 text-slate-600' };
}

function changedFieldCount(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object') {
    return 0;
  }

  const changedFields = (metadata as Record<string, unknown>).changed_fields;
  return Array.isArray(changedFields) ? changedFields.length : 0;
}

export function AuditLogsTable({ logs }: AuditLogsTableProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  return (
    <>
      <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        <table className="w-full min-w-[980px] text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[9px] font-bold uppercase tracking-wider text-slate-500">
              <th className="p-3.5">Hành động</th>
              <th className="p-3.5">Phân hệ</th>
              <th className="p-3.5">Đối tượng</th>
              <th className="p-3.5">Người thực hiện</th>
              <th className="p-3.5">Trạng thái</th>
              <th className="p-3.5">Thời gian</th>
              <th className="p-3.5 text-right">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => {
              const name = metadataName(log.metadata);
              const actorShort = log.actorEmail ? log.actorEmail.split('@')[0] : 'Hệ thống';
              const status = metadataStatus(log.metadata);
              const changedCount = changedFieldCount(log.metadata);

              return (
                <tr key={log.id} className="transition-colors hover:bg-slate-50/50">
                  <td className="p-3.5">
                    <AuditLogActionBadge action={log.action} />
                  </td>
                  <td className="p-3.5">
                    <AuditLogEntityLabel entity={log.entity} />
                  </td>
                  <td className="p-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-800" title={name ?? undefined}>
                        {name ?? '—'}
                      </p>
                      {changedCount > 0 ? (
                        <p className="mt-1 text-[10px] font-semibold text-[#3749A6]">
                          {changedCount} trường thay đổi
                        </p>
                      ) : null}
                    </div>
                  </td>
                  <td className="p-3.5">
                    <p className="font-bold text-slate-700">{actorShort}</p>
                    <p className="truncate font-mono text-[10px] text-slate-500" title={log.actorEmail ?? undefined}>
                      {log.actorEmail ?? 'system'}
                    </p>
                  </td>
                  <td className="p-3.5">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-bold ${status.className}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="whitespace-nowrap p-3.5 font-mono text-[10px] text-slate-400">
                    <FormattedDate date={log.created_at} type="both" />
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedLog(log)}
                      className="admin-focus inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EF] text-slate-500 transition-colors hover:border-[#4880FF] hover:text-[#3749A6]"
                      title="Xem chi tiết"
                      aria-label="Xem chi tiết"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AuditLogDetailDialog log={selectedLog} onClose={() => setSelectedLog(null)} />
    </>
  );
}
