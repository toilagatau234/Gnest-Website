'use client';

import React from 'react';
import { User, ShieldAlert, KeyRound, ScrollText, Fingerprint, Clock } from 'lucide-react';
import { AdminModal } from '@/components/admin/AdminModal';
import { FormattedDate } from '@/components/admin/FormattedDate';
import { AuditLogActionBadge, AuditLogEntityLabel } from '@/components/admin/AuditLogLabels';
import { AuditLogMetadataViewer } from '@/components/admin/AuditLogMetadataViewer';
import type { AuditLogEntry } from '@/lib/services/admin/audit-logs';

interface AuditLogDetailDialogProps {
  log: AuditLogEntry | null;
  onClose: () => void;
}

export function AuditLogDetailDialog({ log, onClose }: AuditLogDetailDialogProps) {
  if (!log) return null;

  return (
    <AdminModal
      open={log !== null}
      onClose={onClose}
      title="Chi tiết nhật ký hoạt động hệ thống"
      size="lg"
    >
      <div className="space-y-5 text-slate-800">
        {/* Core Info Grid */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {/* Action details */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3 shadow-sm hover:border-[#4880FF]/25 transition-all">
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-extrabold uppercase tracking-widest border-b border-slate-100 pb-1.5">
              <ShieldAlert className="h-4 w-4 text-[#3749A6]" />
              Thông tin hành vi
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Hành động:</span>
                <AuditLogActionBadge action={log.action} />
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Đối tượng tác động:</span>
                <AuditLogEntityLabel entity={log.entity} />
              </div>
              
              <div className="flex items-start justify-between gap-4 text-xs pt-1 border-t border-slate-100/50">
                <span className="text-slate-500 font-medium shrink-0">ID Đối tượng:</span>
                <span className="font-mono text-[10px] text-slate-600 break-all select-all font-bold bg-white border border-slate-100 px-2 py-0.5 rounded shadow-sm">
                  {log.entity_id || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Actor & Timestamp details */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3 shadow-sm hover:border-[#4880FF]/25 transition-all">
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-extrabold uppercase tracking-widest border-b border-slate-100 pb-1.5">
              <User className="h-4 w-4 text-[#3749A6]" />
              Tác nhân & Thời gian
            </div>

            <div className="space-y-2">
              <div className="flex flex-col text-xs space-y-0.5">
                <span className="text-slate-500 font-medium">Quản trị viên thực hiện:</span>
                <span className="font-bold text-slate-800 truncate select-all" title={log.actorEmail ?? 'Hệ thống'}>
                  {log.actorEmail ?? 'Hệ thống'}
                </span>
              </div>
              
              <div className="flex flex-col text-xs space-y-0.5 border-t border-slate-100/50 pt-1">
                <span className="text-slate-500 font-medium">Mốc thời gian:</span>
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <FormattedDate date={log.created_at} type="both" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Technical raw tags container */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-extrabold uppercase tracking-widest border-b border-slate-100 pb-1.5">
            <KeyRound className="h-4 w-4 text-[#3749A6]" />
            Khóa phân loại kỹ thuật (Technical Keys)
          </div>
          
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 text-xs font-mono">
            <div className="bg-white border border-slate-100 rounded-xl p-2.5 shadow-sm">
              <div className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider mb-1 flex items-center gap-1">
                <Fingerprint className="h-3 w-3 text-slate-400" /> Action Key
              </div>
              <div className="text-slate-700 font-bold text-[11px] break-all select-all">{log.action}</div>
            </div>
            
            <div className="bg-white border border-slate-100 rounded-xl p-2.5 shadow-sm">
              <div className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider mb-1 flex items-center gap-1">
                <Fingerprint className="h-3 w-3 text-slate-400" /> Entity Key
              </div>
              <div className="text-slate-700 font-bold text-[11px] break-all select-all">{log.entity}</div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-2.5 shadow-sm">
              <div className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider mb-1 flex items-center gap-1">
                <Fingerprint className="h-3 w-3 text-slate-400" /> Actor ID
              </div>
              <div className="text-slate-700 font-bold text-[11px] break-all select-all">{log.actor_id || 'system'}</div>
            </div>
          </div>
        </div>

        {/* Metadata section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-500 text-[10px] font-extrabold uppercase tracking-widest pl-1">
            <ScrollText className="h-4 w-4 text-[#3749A6]" />
            Dữ liệu chi tiết (Metadata Payload)
          </div>
          
          <AuditLogMetadataViewer metadata={log.metadata} />
        </div>
      </div>
    </AdminModal>
  );
}
