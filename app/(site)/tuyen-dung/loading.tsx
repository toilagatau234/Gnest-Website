import React from 'react';

export default function RecruitmentLoading() {
  return (
    <div className="bg-slate-50 min-h-screen py-10" aria-busy="true" aria-live="polite">
      <div className="max-w-[1220px] mx-auto px-5">
        {/* Header Recruitment Banner Skeleton */}
        <div className="relative bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse rounded-2xl p-8 md:p-12 mb-10 border border-slate-100 shadow-sm flex flex-col justify-center h-[240px]">
          <div className="h-4 w-36 bg-slate-300/60 rounded-full mb-4" />
          <div className="h-8 md:h-10 w-2/3 bg-slate-300/80 rounded-lg mb-3" />
          <div className="h-4 w-1/2 bg-slate-300/50 rounded-md mb-6" />
          <div className="h-10 w-40 bg-slate-300/80 rounded-lg" />
        </div>

        {/* Perks Grid (3 columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm flex items-start gap-4 animate-pulse"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-2/3 bg-slate-200 rounded" />
                <div className="h-3 w-5/6 bg-slate-100 rounded" />
                <div className="h-3 w-1/2 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Master-Detail Job Listing Layout Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Job List Skeleton */}
          <div className="lg:col-span-7 space-y-5">
            <div className="h-5 w-48 bg-slate-200 animate-pulse rounded mb-4" />

            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm space-y-4 animate-pulse"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="h-4.5 w-1/2 bg-slate-200 rounded" />
                    <div className="h-5 w-20 bg-slate-100 rounded-full" />
                  </div>
                  <div className="h-3 w-36 bg-slate-100 rounded" />

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 bg-slate-100 rounded-full" />
                        <div className="h-3 w-24 bg-slate-100 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Job Detail Sticky Card Skeleton */}
          <div className="lg:col-span-5 sticky top-28 self-start">
            <div className="bg-white rounded-xl border border-slate-200/80 p-6 space-y-6 animate-pulse">
              <div className="pb-4 border-b border-slate-100 space-y-2">
                <div className="h-5 w-3/4 bg-slate-200 rounded" />
                <div className="h-3.5 w-1/2 bg-slate-100 rounded" />
              </div>

              <div className="space-y-3">
                <div className="h-3 w-full bg-slate-100 rounded" />
                <div className="h-3 w-5/6 bg-slate-100 rounded" />
                <div className="h-3 w-11/12 bg-slate-100 rounded" />
                <div className="h-3 w-4/5 bg-slate-100 rounded" />
              </div>

              <div className="bg-slate-50 border border-slate-100/50 rounded-lg p-4 space-y-2">
                <div className="h-3 w-2/3 bg-slate-200 rounded" />
                <div className="h-3 w-1/2 bg-slate-200 rounded" />
              </div>

              <div className="h-11 w-full bg-slate-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
