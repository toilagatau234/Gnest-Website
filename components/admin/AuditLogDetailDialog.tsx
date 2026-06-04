'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, Clock, Fingerprint, Globe, KeyRound, Loader2, Monitor, ScrollText, ShieldAlert, User } from 'lucide-react';
import { AdminModal } from '@/components/admin/AdminModal';
import { FormattedDate } from '@/components/admin/FormattedDate';
import { AuditLogActionBadge, AuditLogEntityLabel } from '@/components/admin/AuditLogLabels';
import { AuditLogMetadataViewer } from '@/components/admin/AuditLogMetadataViewer';
import { fetchAuditLogDetailAction } from '@/app/admin/(dashboard)/audit-logs/actions';
import type { AuditLogEntry } from '@/lib/services/admin/audit-logs';

interface AuditLogDetailDialogProps {
  logId: string | null;
  onClose: () => void;
}

// State tracks the last settled fetch so we can derive isLoading without a
// synchronous setState call inside the effect body (avoids react-hooks/set-state-in-effect).
type FetchState = {
  logId: string | null;
  detail: AuditLogEntry | null;
  error: string | null;
};

function extractRequestContext(metadata: unknown): { ip_address?: string; user_agent?: string } {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return {};
  const m = metadata as Record<string, unknown>;
  return {
    ip_address: typeof m.ip_address === 'string' ? m.ip_address : undefined,
    user_agent: typeof m.user_agent === 'string' ? m.user_agent : undefined,
  };
}

export function AuditLogDetailDialog({ logId, onClose }: AuditLogDetailDialogProps) {
  const [fetchState, setFetchState] = useState<FetchState>({ logId: null, detail: null, error: null });

  // isLoading is true while a fetch is in-flight (requested logId ≠ settled logId)
  const isLoading = logId !== null && fetchState.logId !== logId;
  const detail = fetchState.logId === logId ? fetchState.detail : null;
  const error = fetchState.logId === logId ? fetchState.error : null;

  useEffect(() => {
    if (!logId) return;

    let cancelled = false;

    fetchAuditLogDetailAction(logId).then((result) => {
      if (cancelled) return;
      setFetchState({
        logId,
        detail: result.data ?? null,
        error: result.error ?? null,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [logId]);

  const reqCtx = detail ? extractRequestContext(detail.metadata) : {};
  const hasRequestContext = Boolean(reqCtx.ip_address || reqCtx.user_agent);

  return (
    <AdminModal
      open={logId !== null}
      onClose={onClose}
      title="Chi tiết nhật ký hoạt động hệ thống"
      size="lg"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#4880FF]" />
          <span className="ml-2 text-sm text-slate-500">Đang tải chi tiết…</span>
        </div>
      ) : error ? (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-[#FFF5F5] p-4 text-xs font-medium text-[#B42318]">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#E31E24]" />
          <div>
            <p className="font-semibold text-[#7A271A]">Không thể tải chi tiết</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      ) : detail ? (
        <div className="space-y-5 text-slate-800">
          {/* Core Info Grid */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3 shadow-sm hover:border-[#4880FF]/25 transition-all">
              <div className="flex items-center gap-2 text-slate-400 text-[10px] font-extrabold uppercase tracking-widest border-b border-slate-100 pb-1.5">
                <ShieldAlert className="h-4 w-4 text-[#3749A6]" />
                Thông tin hành vi
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Hành động:</span>
                  <AuditLogActionBadge action={detail.action} />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Đối tượng tác động:</span>
                  <AuditLogEntityLabel entity={detail.entity} />
                </div>

                <div className="flex items-start justify-between gap-4 text-xs pt-1 border-t border-slate-100/50">
                  <span className="text-slate-500 font-medium shrink-0">ID Đối tượng:</span>
                  <span className="font-mono text-[10px] text-slate-600 break-all select-all font-bold bg-white border border-slate-100 px-2 py-0.5 rounded shadow-sm">
                    {detail.entity_id || '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3 shadow-sm hover:border-[#4880FF]/25 transition-all">
              <div className="flex items-center gap-2 text-slate-400 text-[10px] font-extrabold uppercase tracking-widest border-b border-slate-100 pb-1.5">
                <User className="h-4 w-4 text-[#3749A6]" />
                Tác nhân & Thời gian
              </div>

              <div className="space-y-2">
                <div className="flex flex-col text-xs space-y-0.5">
                  <span className="text-slate-500 font-medium">Quản trị viên thực hiện:</span>
                  <span className="font-bold text-slate-800 truncate select-all" title={detail.actorEmail ?? 'Hệ thống'}>
                    {detail.actorEmail ?? 'Hệ thống'}
                  </span>
                </div>

                <div className="flex flex-col text-xs space-y-0.5 border-t border-slate-100/50 pt-1">
                  <span className="text-slate-500 font-medium">Mốc thời gian:</span>
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <FormattedDate date={detail.created_at} type="both" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {hasRequestContext ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-slate-400 text-[10px] font-extrabold uppercase tracking-widest border-b border-slate-100 pb-1.5">
                <Globe className="h-4 w-4 text-[#3749A6]" />
                Ngữ cảnh yêu cầu
              </div>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 text-xs">
                {reqCtx.ip_address ? (
                  <div className="bg-white border border-slate-100 rounded-xl p-2.5 shadow-sm">
                    <div className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider mb-1 flex items-center gap-1">
                      <Globe className="h-3 w-3" /> Địa chỉ IP
                    </div>
                    <div className="font-mono text-[11px] font-bold text-slate-700 select-all break-all">
                      {reqCtx.ip_address}
                    </div>
                  </div>
                ) : null}
                {reqCtx.user_agent ? (
                  <div className="bg-white border border-slate-100 rounded-xl p-2.5 shadow-sm">
                    <div className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider mb-1 flex items-center gap-1">
                      <Monitor className="h-3 w-3" /> User Agent
                    </div>
                    <div className="font-mono text-[10px] text-slate-600 break-all leading-relaxed">
                      {reqCtx.user_agent}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

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
                <div className="text-slate-700 font-bold text-[11px] break-all select-all">{detail.action}</div>
              </div>

              <div className="bg-white border border-slate-100 rounded-xl p-2.5 shadow-sm">
                <div className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider mb-1 flex items-center gap-1">
                  <Fingerprint className="h-3 w-3 text-slate-400" /> Entity Key
                </div>
                <div className="text-slate-700 font-bold text-[11px] break-all select-all">{detail.entity}</div>
              </div>

              <div className="bg-white border border-slate-100 rounded-xl p-2.5 shadow-sm">
                <div className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider mb-1 flex items-center gap-1">
                  <Fingerprint className="h-3 w-3 text-slate-400" /> Actor ID
                </div>
                <div className="text-slate-700 font-bold text-[11px] break-all select-all">{detail.actor_id || 'system'}</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-500 text-[10px] font-extrabold uppercase tracking-widest pl-1">
              <ScrollText className="h-4 w-4 text-[#3749A6]" />
              Dữ liệu chi tiết (Metadata Payload)
            </div>

            <AuditLogMetadataViewer metadata={detail.metadata} />
          </div>
        </div>
      ) : null}
    </AdminModal>
  );
}
