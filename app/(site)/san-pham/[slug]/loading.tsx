import React from 'react';

export default function ProductDetailLoading() {
  return (
    <div className="bg-white min-h-screen pb-16" aria-busy="true" aria-live="polite">
      {/* Breadcrumb Skeleton */}
      <nav aria-label="Điều hướng" className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-[1220px] mx-auto px-5 py-3 flex items-center gap-2">
          <div className="h-3.5 w-16 bg-slate-200 animate-pulse rounded" />
          <span className="text-slate-300">/</span>
          <div className="h-3.5 w-24 bg-slate-200 animate-pulse rounded" />
          <span className="text-slate-300">/</span>
          <div className="h-3.5 w-36 bg-slate-200/80 animate-pulse rounded" />
        </div>
      </nav>

      {/* Main Content Skeleton */}
      <div className="max-w-[1220px] mx-auto px-5 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14">
          {/* Left Column: Image Gallery Skeleton */}
          <div className="space-y-4 animate-pulse">
            {/* Main Image Aspect Square */}
            <div className="aspect-square w-full rounded-xl bg-slate-100 flex items-center justify-center border border-slate-100" />
            {/* Thumbnail Row */}
            <div className="flex gap-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-18 h-18 rounded-lg bg-slate-100 border border-slate-100" />
              ))}
            </div>
          </div>

          {/* Right Column: Details Skeleton */}
          <div className="flex flex-col gap-5 animate-pulse">
            {/* Category Tag Badge */}
            <div className="h-6 w-24 bg-slate-100 rounded-full border border-slate-150" />

            {/* Product Title */}
            <div className="space-y-2">
              <div className="h-8 w-5/6 bg-slate-200 rounded-md" />
              <div className="h-8 w-1/2 bg-slate-200 rounded-md" />
            </div>

            {/* SKU */}
            <div className="h-3 w-28 bg-slate-150 rounded" />

            {/* Short Description */}
            <div className="border-l-2 border-slate-200 pl-3 space-y-2">
              <div className="h-3.5 w-full bg-slate-100 rounded" />
              <div className="h-3.5 w-11/12 bg-slate-100 rounded" />
            </div>

            {/* Price Card Block */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
              <div className="h-7 w-40 bg-slate-200 rounded" />
              <div className="h-3 w-56 bg-slate-150 rounded" />
              
              {/* Stock Status Badge */}
              <div className="pt-1">
                <div className="h-6 w-36 bg-slate-200 rounded-full" />
              </div>
            </div>

            {/* Bulk Discount Table Skeleton */}
            <div className="space-y-2">
              <div className="h-4 w-24 bg-slate-200 rounded" />
              <div className="rounded-lg border border-slate-200/80 overflow-hidden space-y-0.5">
                <div className="h-9 bg-slate-100" />
                <div className="h-9 bg-slate-50" />
                <div className="h-9 bg-white" />
              </div>
            </div>

            {/* CTAs */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="h-12 bg-slate-200 rounded-lg" />
              <div className="h-12 bg-slate-200 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Specs + Description below the fold */}
        <div className="mt-10 md:mt-14 grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
          {/* Specs Table */}
          <div className="space-y-4">
            <div className="h-5 w-44 bg-slate-200 rounded" />
            <div className="rounded-xl border border-slate-200/80 overflow-hidden space-y-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-slate-50 flex items-center justify-between px-4">
                  <div className="h-3.5 w-24 bg-slate-150 rounded" />
                  <div className="h-3.5 w-16 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Description Block */}
          <div className="space-y-4">
            <div className="h-5 w-40 bg-slate-200 rounded" />
            <div className="space-y-3 pt-2">
              <div className="h-3.5 w-full bg-slate-100 rounded" />
              <div className="h-3.5 w-full bg-slate-100 rounded" />
              <div className="h-3.5 w-11/12 bg-slate-100 rounded" />
              <div className="h-3.5 w-5/6 bg-slate-100 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
