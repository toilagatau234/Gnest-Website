import { AlertCircle, ScrollText, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { getAuditLogs, getAuditLogStats } from '@/lib/services/admin/audit-logs';
import { getAdminUsers } from '@/lib/services/admin/admin-users';
import { requireAdminAuth } from '@/lib/services/admin/auth';
import { SYSTEM_VIEWER_ROLES } from '@/lib/services/admin/permissions';
import { AuditLogsFilterBar } from '@/components/admin/AuditLogsFilterBar';
import { AuditLogsTable } from '@/components/admin/AuditLogsTable';

export const dynamic = 'force-dynamic';

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
  // Only super_admin and admin may read sensitive audit logs.
  await requireAdminAuth(SYSTEM_VIEWER_ROLES);

  // eslint-disable-next-line react-hooks/purity
  const _t0 = Date.now();
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

  if (process.env.NODE_ENV === 'development' && process.env.ADMIN_TIMING_LOGS === '1') {
    // eslint-disable-next-line react-hooks/purity
    console.log(`[admin-timing] audit-logs page total: ${Date.now() - _t0}ms`);
  }

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
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#646464]">Người thực hiện (30 ngày)</p>
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
            <AuditLogsTable logs={safeLogs} />

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
