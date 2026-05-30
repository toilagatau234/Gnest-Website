'use client';

import dynamic from 'next/dynamic';

const Interactive3DShowcase = dynamic(
  () => import('@/components/Interactive3DShowcase').then((mod) => mod.Interactive3DShowcase),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full max-w-[1220px] mx-auto px-5 my-10 animate-pulse rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-dtl-red animate-spin"></div>
        <div className="text-xs font-semibold">Đang tải mô phỏng dịch vụ 3D...</div>
      </div>
    ),
  }
);

export function LazyInteractive3DShowcase() {
  return <Interactive3DShowcase />;
}
