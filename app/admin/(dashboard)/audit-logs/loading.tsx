import { AdminStatsSkeleton, AdminTableSkeleton } from '@/components/admin/AdminSkeletons';

export default function AuditLogsLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      {/* Page header skeleton */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm lg:flex-row lg:items-center">
        <div className="space-y-2">
          <div className="h-5 w-52 animate-pulse rounded-lg bg-slate-200/80" />
          <div className="h-3 w-72 animate-pulse rounded bg-slate-200/50" />
        </div>
        <div className="h-7 w-40 animate-pulse rounded-lg bg-slate-200/60 shrink-0" />
      </div>

      {/* Stats */}
      <AdminStatsSkeleton count={4} />

      {/* Filter bar skeleton */}
      <div className="flex flex-wrap gap-2 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 animate-pulse rounded-xl bg-slate-200/60" style={{ width: `${80 + i * 20}px` }} />
        ))}
      </div>

      {/* Table */}
      <AdminTableSkeleton rows={7} />
    </div>
  );
}
