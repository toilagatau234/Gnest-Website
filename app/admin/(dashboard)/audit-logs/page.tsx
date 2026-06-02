import { AlertCircle, ScrollText, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { getAuditLogs, getAuditLogStats } from '@/lib/services/admin/audit-logs';
import { getAdminUsers } from '@/lib/services/admin/admin-users';
import { FormattedDate } from '@/components/admin/FormattedDate';
import { AuditLogsFilterBar } from '@/components/admin/AuditLogsFilterBar';

export const dynamic = 'force-dynamic';

const ACTION_META: Record<string, { label: string; toneClass: string }> = {
  create: { label: 'Tạo mới', toneClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold' },
  update: { label: 'Cập nhật', toneClass: 'bg-sky-50 text-sky-800 border border-sky-200 font-bold' },
  activate: { label: 'Hiển thị', toneClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold' },
  deactivate: { label: 'Mở ẩn', toneClass: 'bg-slate-100 text-slate-700 border border-slate-200 font-bold' },
  assign: { label: 'Phân công', toneClass: 'bg-indigo-50 text-indigo-800 border border-indigo-200 font-bold' },
  note_add: { label: 'Ghi chú', toneClass: 'bg-amber-50 text-amber-800 border border-amber-200 font-bold' },
  status_update: { label: 'Trạng thái', toneClass: 'bg-purple-50 text-purple-800 border border-purple-200 font-bold' },
  metadata_update: { label: 'Cập nhật', toneClass: 'bg-sky-50 text-sky-800 border border-sky-200 font-bold' },
  mark_spam: { label: 'Spam', toneClass: 'bg-rose-50 text-rose-800 border border-rose-200 font-bold' },
  close: { label: 'Đóng', toneClass: 'bg-slate-100 text-slate-800 border border-slate-200 font-bold' },
  reopen: { label: 'Mở lại', toneClass: 'bg-teal-50 text-teal-800 border border-teal-200 font-bold' },
};

const ENTITY_LABELS: Record<string, string> = {
  products: 'Sản phẩm',
  categories: 'Danh mục',
  inquiries: 'Yêu cầu báo giá sỉ',
  admin_users: 'Quản trị viên',
  site_contents: 'Nội dung website',
  sales_contacts: 'Danh bạ bán hàng',
  job_vacancies: 'Tin tuyển dụng',
};

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

interface PageProps {
  searchParams: Promise<{
    q?: string;
    action?: string;
    entity?: string;
    actor?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}

export default async function AuditLogsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const pageStr = resolvedSearchParams.page;
  const page = pageStr ? parseInt(pageStr, 10) : 1;
  const limit = 20;

  const [
    { data: logsResult, total, error },
    { data: stats },
    { data: adminUsers },
  ] = await Promise.all([
    getAuditLogs({
      page,
      limit,
      action: resolvedSearchParams.action,
      entity: resolvedSearchParams.entity,
      actorId: resolvedSearchParams.actor,
      dateFrom: resolvedSearchParams.from,
      dateTo: resolvedSearchParams.to,
      search: resolvedSearchParams.q,
    }),
    getAuditLogStats(),
    getAdminUsers(),
  ]);

  const safeLogs = logsResult ?? [];
  const safeAdminUsers = adminUsers ?? [];
  const totalPages = Math.ceil(total / limit);

  // Pagination parameters preservation
  const makePageUrl = (targetPage: number) => {
    const params = new URLSearchParams();
    Object.entries(resolvedSearchParams).forEach(([key, val]) => {
      if (val && key !== 'page') {
        params.set(key, val);
      }
    });
    params.set('page', targetPage.toString());
    return `/admin/audit-logs?${params.toString()}`;
  };

  const hasFilters = Boolean(
    resolvedSearchParams.q ||
    resolvedSearchParams.action ||
    resolvedSearchParams.entity ||
    resolvedSearchParams.actor ||
    resolvedSearchParams.from ||
    resolvedSearchParams.to
  );

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="space-y-5">
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
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-[#FFF5F5] p-4 text-xs font-medium text-[#B42318]">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#E31E24]" />
          <div>
            <p className="font-semibold text-[#7A271A]">Không thể tải nhật ký hoạt động</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      ) : null}

      {/* Stats Cards at the Top */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="admin-card p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#646464]">Tổng tác vụ</p>
          <p className="mt-2 text-2xl font-extrabold text-[#202224]">{stats?.total ?? 0}</p>
        </div>
        <div className="admin-card p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#646464]">Tác vụ hôm nay</p>
          <p className="mt-2 text-2xl font-extrabold text-[#E31E24]">{stats?.today ?? 0}</p>
        </div>
        <div className="admin-card p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#646464]">Quản trị viên hoạt động</p>
          <p className="mt-2 text-2xl font-extrabold text-[#3749A6]">{stats?.uniqueActors ?? 0}</p>
        </div>
        <div className="admin-card p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#646464]">Tác vụ rủi ro</p>
          <p className="mt-2 text-2xl font-extrabold text-amber-600">{stats?.highRisk ?? 0}</p>
        </div>
      </div>

      {/* Advanced Filter UI */}
      <AuditLogsFilterBar key={JSON.stringify(resolvedSearchParams)} adminUsers={safeAdminUsers} currentFilters={resolvedSearchParams} />

      {/* Main Table Shell Card */}
      <div className="space-y-4 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-center justify-between border-b border-slate-50 pb-2">
          <div className="min-w-0">
            <h3 className="font-bold text-[#1B3A6B] text-sm">Truy Vết Hành Động Hệ Thống</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {hasFilters ? 'Kết quả hiển thị theo bộ lọc đang chọn' : 'Hiển thị các tác vụ lưu vết gần nhất'}
            </p>
          </div>
        </div>

        {safeLogs.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <ScrollText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600 font-bold text-sm">
              {hasFilters ? 'Không tìm thấy nhật ký phù hợp bộ lọc' : 'Chưa có ghi chép lịch sử nào'}
            </p>
            <p className="text-slate-400 text-xs mt-0.5">
              {hasFilters ? 'Hãy thử điều chỉnh lại từ khóa hoặc xóa bộ lọc hành động.' : 'Khi có hành động tác động vào hệ thống, log sẽ lưu tại đây.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
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

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div className="text-slate-500 text-[11px]">
                Hiển thị <span className="font-semibold text-slate-800">{start}</span> -{' '}
                <span className="font-semibold text-slate-800">{end}</span> trên{' '}
                <span className="font-semibold text-slate-800">{total}</span> nhật ký
              </div>

              {totalPages > 1 ? (
                <div className="flex items-center gap-1.5">
                  {page > 1 ? (
                    <Link
                      href={makePageUrl(page - 1)}
                      className="admin-button-secondary h-8 w-8 !p-0 flex items-center justify-center border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                      title="Trang trước"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="h-8 w-8 flex items-center justify-center border border-slate-100 text-slate-300 bg-slate-50 rounded-lg cursor-not-allowed select-none"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  )}

                  <span className="text-[11px] font-bold text-[#1B3A6B] bg-[#4880FF]/10 border border-[#DDE5F8] px-3 py-1.5 rounded-lg select-none">
                    Trang {page} / {totalPages}
                  </span>

                  {page < totalPages ? (
                    <Link
                      href={makePageUrl(page + 1)}
                      className="admin-button-secondary h-8 w-8 !p-0 flex items-center justify-center border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                      title="Trang sau"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="h-8 w-8 flex items-center justify-center border border-slate-100 text-slate-300 bg-slate-50 rounded-lg cursor-not-allowed select-none"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
