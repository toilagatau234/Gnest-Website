import React from 'react';

export default function CatalogLoading() {
  return (
    <div className="bg-slate-50/50 min-h-screen pb-16" aria-busy="true" aria-live="polite">
      {/* Breadcrumb Skeleton */}
      <nav aria-label="Điều hướng" className="max-w-[1220px] mx-auto px-5 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-16 bg-slate-200 animate-pulse rounded" />
          <span className="text-slate-300">/</span>
          <div className="h-3.5 w-24 bg-slate-200 animate-pulse rounded" />
        </div>
      </nav>

      <section className="mx-auto max-w-[1220px] px-5 pb-14 pt-2">
        {/* Banner Header Skeleton */}
        <div className="relative bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse rounded-2xl p-8 md:p-12 mb-6 border border-slate-100 shadow-sm flex flex-col justify-center h-[180px]">
          <div className="h-4 w-28 bg-slate-300/60 rounded-full mb-3" />
          <div className="h-8 w-1/3 bg-slate-300/80 rounded-lg mb-2" />
          <div className="h-4 w-1/2 bg-slate-300/50 rounded-md" />
        </div>

        {/* Layout Grid */}
        <div className="flex flex-col lg:flex-row gap-8 items-start mt-6">
          {/* Desktop Left Sidebar Skeleton */}
          <aside className="w-full lg:w-[280px] shrink-0 hidden lg:block bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-8">
            {/* Category Navigation List */}
            <div>
              <div className="h-3 w-32 bg-slate-200 animate-pulse rounded-full mb-4" />
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-9 w-full bg-slate-100 animate-pulse rounded-lg" />
                ))}
              </div>
            </div>

            {/* Filter group */}
            <div className="pt-6 border-t border-slate-100">
              <div className="h-3 w-28 bg-slate-200 animate-pulse rounded-full mb-4" />
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="space-y-2.5">
                    <div className="h-3.5 w-1/2 bg-slate-200 animate-pulse rounded" />
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <div key={j} className="h-7 w-16 bg-slate-50 animate-pulse rounded border border-slate-100" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Right Product Grid Area */}
          <div className="flex-1 w-full space-y-4">
            {/* Mobile filter button mockup */}
            <div className="flex items-center justify-between lg:hidden mb-4 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm">
              <div className="h-8 w-36 bg-slate-100 animate-pulse rounded-lg" />
              <div className="h-4 w-20 bg-slate-100 animate-pulse rounded" />
            </div>

            {/* Match status summary line */}
            <div className="h-3.5 w-40 bg-slate-200 animate-pulse rounded" />

            {/* Grid of Product Cards */}
            <div className="grid grid-cols-1 min-[340px]:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-white border border-slate-200/80 rounded-lg overflow-hidden flex flex-col p-3.5 space-y-4 shadow-sm"
                >
                  {/* Product image block */}
                  <div className="aspect-square w-full rounded bg-slate-100 animate-pulse" />
                  
                  {/* Card content */}
                  <div className="space-y-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-2 text-center">
                      <div className="h-3 w-1/3 bg-slate-100 animate-pulse rounded mx-auto" />
                      <div className="h-4 bg-slate-200/80 animate-pulse rounded" />
                      <div className="h-4 w-5/6 bg-slate-200/80 animate-pulse rounded mx-auto" />
                    </div>
                    
                    <div className="h-4 w-1/2 bg-slate-200 animate-pulse rounded mx-auto mt-2" />
                  </div>

                  {/* Footer Button CTA */}
                  <div className="h-9 w-full bg-slate-100 animate-pulse rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
