import { Loader2 } from 'lucide-react';

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200/70" />
        <div className="h-4 w-72 animate-pulse rounded bg-slate-200/50" />
      </div>

      {/* Card skeleton with centered spinner */}
      <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white shadow-admin">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="h-7 w-7 animate-spin text-[#1B3A6B]" />
          <span className="text-sm font-medium">Đang tải dữ liệu…</span>
        </div>
      </div>
    </div>
  );
}
