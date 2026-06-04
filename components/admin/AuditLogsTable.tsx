'use client';

import { useState } from 'react';
import { Eye } from 'lucide-react';

import { FormattedDate } from '@/components/admin/FormattedDate';
import { AuditLogActionBadge, AuditLogEntityLabel } from './AuditLogLabels';
import { AuditLogDetailDialog } from './AuditLogDetailDialog';
import type { AuditLogListItem } from '@/lib/services/admin/audit-logs';

interface AuditLogsTableProps {
  logs: AuditLogListItem[];
}

export function AuditLogsTable({ logs }: AuditLogsTableProps) {
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  return (
    <>
      <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        <table className="w-full min-w-[860px] text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[9px] font-bold uppercase tracking-wider text-slate-500">
              <th className="p-3.5">Hành động</th>
              <th className="p-3.5">Phân hệ / ID</th>
              <th className="p-3.5">Người thực hiện</th>
              <th className="p-3.5">Thời gian</th>
              <th className="p-3.5 text-right">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => {
              const actorShort = log.actorEmail ? log.actorEmail.split('@')[0] : 'Hệ thống';
              const entityIdShort = log.entity_id ? log.entity_id.slice(0, 8) : null;

              return (
                <tr key={log.id} className="transition-colors hover:bg-slate-50/50">
                  <td className="p-3.5">
                    <AuditLogActionBadge action={log.action} />
                  </td>
                  <td className="p-3.5">
                    <div className="min-w-0">
                      <AuditLogEntityLabel entity={log.entity} />
                      {entityIdShort ? (
                        <p className="mt-1 font-mono text-[10px] text-slate-400" title={log.entity_id ?? undefined}>
                          #{entityIdShort}…
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
                  <td className="whitespace-nowrap p-3.5 font-mono text-[10px] text-slate-400">
                    <FormattedDate date={log.created_at} type="both" />
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedLogId(log.id)}
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

      <AuditLogDetailDialog logId={selectedLogId} onClose={() => setSelectedLogId(null)} />
    </>
  );
}
