import { AdminLoadingScene } from '@/components/admin/AdminLoadingScene';

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200/70" />
        <div className="h-4 w-72 animate-pulse rounded bg-slate-200/50" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-[#E5E7EF] bg-white p-5 shadow-admin">
            <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-4 h-8 w-16 animate-pulse rounded-lg bg-slate-200/80" />
            <div className="mt-3 h-2 w-32 animate-pulse rounded-full bg-slate-100" />
          </div>
        ))}
      </div>

      <AdminLoadingScene compact />
    </div>
  );
}
