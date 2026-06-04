export default function SiteContentLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <div className="h-6 w-44 animate-pulse rounded-lg bg-slate-200/80" />
        <div className="h-3 w-72 animate-pulse rounded bg-slate-200/50" />
      </div>

      {/* Tab bar skeleton */}
      <div className="flex gap-2 border-b border-[#E5E7EF] pb-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 animate-pulse rounded-t-lg bg-slate-200/60" style={{ width: `${64 + i * 16}px` }} />
        ))}
      </div>

      {/* Editor panels skeleton */}
      <div className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-2xl border border-[#E5E7EF] bg-white p-5 shadow-admin">
            <div className="h-4 w-32 animate-pulse rounded-lg bg-slate-200/80" />
            <div className="h-10 w-full animate-pulse rounded-xl bg-slate-200/60" />
            <div className="h-24 w-full animate-pulse rounded-xl bg-slate-200/40" />
          </div>
        ))}
      </div>

      {/* Save button skeleton */}
      <div className="flex justify-end">
        <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-200/60" />
      </div>
    </div>
  );
}
