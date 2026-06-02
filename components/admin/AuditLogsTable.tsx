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
    if ('patch' in meta && meta.patch && typeof meta.patch === 'object') {
      const patch = meta.patch as Record<string, unknown>;
      if ('priority' in patch && typeof patch.priority === 'string') {
        return `Ưu tiên: ${patch.priority}`;
      }
    }
  }
  return null;
}

export function AuditLogsTable({ logs }: AuditLogsTableProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  return (
    <>
      <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        <table className="w-full text-xs text-left min-w-[760px]">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[9px] border-b border-slate-200">
              <th className="p-3.5">Hành động</th>
              <th className="p-3.5">Phân hệ đối tượng</th>
              <th className="p-3.5">Tên đối tượng ảnh hưởng</th>
              <th className="p-3.5">Quản trị viên thực hiện</th>
              <th className="p-3.5">Mốc thời gian ghi nhận</th>
              <th className="p-3.5 text-right">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => {
              const name = metadataName(log.metadata);
              const actorShort = log.actorEmail ? log.actorEmail.split('@')[0] : 'Hệ thống';

              return (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3.5">
                    <AuditLogActionBadge action={log.action} />
                  </td>
                  <td className="p-3.5">
                    <AuditLogEntityLabel entity={log.entity} />
                  </td>
                  <td className="p-3.5 font-bold text-slate-800 text-xs">{name ?? '—'}</td>
                  <td className="p-3.5 font-mono text-slate-500">
                    <span className="font-bold text-slate-700 font-sans">{actorShort}</span>
                    {log.actorEmail ? ` (${log.actorEmail})` : ''}
                  </td>
                  <td className="whitespace-nowrap p-3.5 text-slate-400 text-[10px]">
                    <FormattedDate date={log.created_at} type="both" />
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedLog(log)}
                      className="admin-focus inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#E5E7EF] text-slate-500 transition-colors hover:border-[#4880FF] hover:text-[#3749A6]"
                      title="Xem chi tiết"
                      aria-label="Xem chi tiết"
                    >
                      <Eye className="h-3.5 w-3.5" />
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
