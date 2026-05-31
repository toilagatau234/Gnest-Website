import { AlertCircle, ScrollText, CheckCircle2, Shield } from 'lucide-react';

import { getAuditLogs } from '@/lib/services/admin/audit-logs';
import { FormattedDate } from '@/components/admin/FormattedDate';

export const dynamic = 'force-dynamic';

const ACTION_META: Record<string, { label: string; toneClass: string }> = {
  create: { label: 'Tạo mới', toneClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold' },
  update: { label: 'Cập nhật', toneClass: 'bg-sky-50 text-sky-800 border border-sky-200 font-bold' },
  activate: { label: 'Hiển thị', toneClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold' },
  deactivate: { label: 'Mở ẩn', toneClass: 'bg-amber-50 text-amber-700 border border-amber-200 font-bold' },
};

const ENTITY_LABELS: Record<string, string> = {
  products: 'Sản phẩm',
  categories: 'Danh mục',
  inquiries: 'Yêu cầu báo giá sỉ',
};

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

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm lg:flex-row lg:items-center">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-[#1B3A6B]">Nhật Ký Hoạt Động Hệ Thống</h2>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi, giám sát và truy vết các hành động tạo mới, cập nhật, hiển thị/ẩn dữ liệu của các quản trị viên
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 text-xs font-semibold select-none">
          <Shield className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          <span className="text-[9px] tracking-wider uppercase font-bold">Encrypted Audit Trail</span>
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-[#FFF5F5] p-4 text-xs font-medium text-[#B42318]">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#E31E24]" />
          <div>
            <p className="font-semibold text-[#7A271A]">Không thể tải nhật ký hoạt động</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      ) : null}

      {/* Main Audit log card list */}
      <div className="space-y-4 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-center justify-between border-b border-slate-50 pb-2">
          <div className="min-w-0">
            <h3 className="font-bold text-[#1B3A6B] text-sm">Truy Vết Hành Động Gần Đây</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Hiển thị tối đa 100 tác vụ lưu vết gần nhất</p>
          </div>
        </div>

        {safeLogs.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <ScrollText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600 font-bold text-sm">Chưa có ghi chép lịch sử nào</p>
            <p className="text-slate-400 text-xs mt-0.5">Khi có chỉnh sửa dữ liệu, log truy vết sẽ hiển thị ở đây.</p>
          </div>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
            <table className="w-full text-xs text-left min-w-[760px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[9px] border-b border-slate-200">
                  <th className="p-3.5">Hành động</th>
                  <th className="p-3.5">Phân hệ đối tượng</th>
                  <th className="p-3.5">Tên đối tượng ảnh hưởng</th>
                  <th className="p-3.5">Quản trị viên thực hiện</th>
                  <th className="p-3.5 text-right">Mốc thời gian ghi nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {safeLogs.map((log) => {
                  const meta = ACTION_META[log.action] ?? { label: log.action, toneClass: 'bg-slate-100 text-slate-500 border border-slate-200' };
                  const name = metadataName(log.metadata);
                  const actorShort = log.actorEmail ? log.actorEmail.split('@')[0] : 'Hệ thống';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] uppercase ${meta.toneClass}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 font-medium">{ENTITY_LABELS[log.entity] ?? log.entity}</td>
                      <td className="p-3.5 font-bold text-slate-800 text-xs">{name ?? '—'}</td>
                      <td className="p-3.5 font-mono text-slate-500">
                        <span className="font-bold text-slate-700 font-sans">{actorShort}</span>
                        {log.actorEmail ? ` (${log.actorEmail})` : ''}
                      </td>
                      <td className="whitespace-nowrap p-3.5 text-right font-mono text-slate-400 text-[10px]">
                        <FormattedDate date={log.created_at} type="both" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Sync helper */}
        <div className="mt-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-slate-400 text-[10px] border-t border-slate-100 pt-3">
          <p>Tìm thấy {safeLogs.length} nhật ký truy vết hệ thống.</p>
          <p className="flex items-center gap-1 font-mono uppercase tracking-wider text-[#1B3A6B] font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Secure Audit log sync enabled
          </p>
        </div>

      </div>

    </div>
  );
}
