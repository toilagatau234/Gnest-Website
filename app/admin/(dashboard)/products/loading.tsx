import { AdminTableSkeleton } from '@/components/admin/AdminSkeletons';

export default function ProductsLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E5E7EF] bg-white p-5 shadow-admin sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2.5">
          <div className="h-6 w-28 animate-pulse rounded-lg bg-slate-200/80" />
          <div className="h-3 w-52 animate-pulse rounded bg-slate-200/50" />
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="h-9 w-28 animate-pulse rounded-xl bg-slate-200/60" />
          <div className="h-9 w-32 animate-pulse rounded-xl bg-slate-200/60" />
        </div>
      </div>
      <AdminTableSkeleton rows={8} />
    </div>
  );
}
