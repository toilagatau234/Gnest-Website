export function AdminStatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-[#E5E7EF] bg-white p-5 shadow-admin">
          <div className="flex items-start justify-between gap-3">
            <div className="h-3 w-20 animate-pulse rounded-full bg-slate-200" />
            <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-200/60 shrink-0" />
          </div>
          <div className="mt-4 h-8 w-14 animate-pulse rounded-lg bg-slate-200/80" />
          <div className="mt-3 h-2 w-28 animate-pulse rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function AdminTableSkeleton({ rows = 6 }: { rows?: number }) {
  const widths = ['60%', '75%', '50%', '80%', '65%', '70%'];
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E5E7EF] bg-white shadow-admin">
      <div className="flex gap-4 border-b border-[#EEF2F6] bg-[#F7F9FB] px-5 py-3">
        <div className="h-3 w-32 animate-pulse rounded-full bg-slate-200" />
        <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200/70" />
        <div className="h-3 w-20 animate-pulse rounded-full bg-slate-200/50" />
      </div>
      <div className="divide-y divide-[#EEF2F6]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="h-8 w-8 shrink-0 animate-pulse rounded-xl bg-slate-200/60" />
            <div className="min-w-0 flex-1 space-y-2">
              <div
                className="h-3 animate-pulse rounded-full bg-slate-200"
                style={{ width: widths[i % widths.length] }}
              />
              <div className="h-2 w-24 animate-pulse rounded-full bg-slate-100" />
            </div>
            <div className="h-5 w-14 animate-pulse rounded-full bg-slate-200/60" />
            <div className="h-7 w-8 animate-pulse rounded-lg bg-slate-200/40" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminPageSkeleton({
  statsCount = 4,
  tableRows = 6,
}: {
  statsCount?: number;
  tableRows?: number;
}) {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E5E7EF] bg-white p-5 shadow-admin sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2.5">
          <div className="h-6 w-36 animate-pulse rounded-lg bg-slate-200/80" />
          <div className="h-3 w-64 animate-pulse rounded bg-slate-200/50" />
        </div>
        <div className="h-9 w-28 shrink-0 animate-pulse rounded-xl bg-slate-200/60" />
      </div>
      {statsCount > 0 && <AdminStatsSkeleton count={statsCount} />}
      <AdminTableSkeleton rows={tableRows} />
    </div>
  );
}
