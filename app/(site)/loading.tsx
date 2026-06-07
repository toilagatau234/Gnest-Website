import React from 'react';

export default function PublicRootLoading() {
  return (
    <div
      className="bg-slate-50/50 min-h-screen pb-16 relative"
      role="status"
      aria-live="polite"
      aria-label="Đang tải nội dung"
      aria-busy="true"
    >
      {/* Top brand accent loading bar */}
      <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-gradient-to-r from-dtl-red via-amber-500 to-dtl-navy animate-pulse" />

      {/* Screen reader announcement */}
      <span className="sr-only">Đang tải trang... Vui lòng đợi trong giây lát.</span>

      <div className="max-w-[1220px] mx-auto px-5 pt-8">
        {/* Hero Banner Skeleton */}
        <div className="w-full h-[320px] md:h-[400px] rounded-2xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse relative overflow-hidden mb-12 shadow-sm border border-slate-100">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" style={{ backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0) 100%)' }} />
          <div className="p-8 md:p-12 h-full flex flex-col justify-end">
            <div className="h-4 w-32 bg-dtl-red/25 rounded-full mb-4" />
            <div className="h-8 md:h-10 w-2/3 bg-slate-300/80 rounded-lg mb-3" />
            <div className="h-4 w-1/2 bg-slate-300/50 rounded-md mb-6" />
            <div className="h-10 w-40 bg-slate-300/80 rounded-lg" />
          </div>
        </div>

        {/* Perks/Why Us Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 animate-pulse shrink-0" />
              <div className="space-y-2.5 flex-1">
                <div className="h-4 w-1/2 bg-slate-200 animate-pulse rounded" />
                <div className="h-3 w-5/6 bg-slate-100 animate-pulse rounded" />
                <div className="h-3 w-2/3 bg-slate-100 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Products Grid Section Skeleton */}
        <div className="space-y-6">
          <div className="flex flex-col gap-2.5">
            <div className="h-3 w-24 bg-slate-200 animate-pulse rounded-full" />
            <div className="h-6 w-56 bg-slate-300/80 animate-pulse rounded-lg" />
          </div>

          <div className="grid grid-cols-1 min-[340px]:grid-cols-2 md:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200/80 rounded-lg overflow-hidden flex flex-col p-4 space-y-4 shadow-sm"
              >
                <div className="aspect-square w-full rounded bg-slate-100 animate-pulse" />
                <div className="space-y-2.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="h-3 w-1/3 bg-slate-100 animate-pulse rounded mx-auto" />
                    <div className="h-4 bg-slate-200/80 animate-pulse rounded" />
                    <div className="h-4 w-5/6 bg-slate-200/80 animate-pulse rounded mx-auto" />
                  </div>
                  <div className="h-4 w-1/2 bg-slate-200 animate-pulse rounded mx-auto mt-2" />
                </div>
                <div className="h-9 w-full bg-slate-100 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
