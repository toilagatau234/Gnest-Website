import { Box, Sparkles } from 'lucide-react';

interface AdminLoadingSceneProps {
  title?: string;
  description?: string;
  compact?: boolean;
}

export function AdminLoadingScene({
  title = 'Đang tải dữ liệu quản trị',
  description = 'Gnest đang sắp xếp lại số liệu mới nhất.',
  compact = false,
}: AdminLoadingSceneProps) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-[#E5E7EF] bg-white shadow-admin ${
        compact ? 'px-5 py-6' : 'px-6 py-10'
      }`}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="relative mb-4 h-20 w-28">
          <div className="absolute bottom-2 left-1/2 h-8 w-20 -translate-x-1/2 rounded-full bg-[#4880FF]/10 blur-sm" />
          <div className="admin-loading-motion absolute bottom-4 left-1/2 flex h-12 w-14 -translate-x-1/2 animate-[floatBox_1.8s_ease-in-out_infinite] items-center justify-center rounded-2xl bg-[#4880FF] text-white shadow-lg shadow-[#4880FF]/25">
            <Box className="h-6 w-6" />
          </div>
          <Sparkles className="admin-loading-motion absolute left-4 top-3 h-4 w-4 animate-[twinkle_1.5s_ease-in-out_infinite] text-[#E31E24]" />
          <Sparkles className="admin-loading-motion absolute right-5 top-0 h-5 w-5 animate-[twinkle_1.8s_ease-in-out_infinite_0.2s] text-[#4880FF]" />
          <span className="absolute bottom-1 left-2 h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <span className="absolute bottom-3 right-3 h-2.5 w-2.5 animate-pulse rounded-full bg-amber-400" />
        </div>

        <h3 className="text-sm font-extrabold text-[#202224]">{title}</h3>
        <p className="mt-1 text-xs font-medium leading-relaxed text-[#646464]">{description}</p>

        <div className="mt-5 grid w-full grid-cols-3 gap-2">
          <span className="h-2 animate-pulse rounded-full bg-[#4880FF]/20" />
          <span className="h-2 animate-pulse rounded-full bg-[#4880FF]/30 [animation-delay:120ms]" />
          <span className="h-2 animate-pulse rounded-full bg-[#4880FF]/20 [animation-delay:240ms]" />
        </div>
      </div>
    </div>
  );
}
