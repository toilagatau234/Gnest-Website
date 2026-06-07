import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import type { PublicBanner } from '@/lib/services/banners';

interface PromoBannerProps {
  banner: PublicBanner;
}

export function PromoBanner({ banner }: PromoBannerProps) {
  const contentElement = (
    <div className="flex items-center justify-center gap-2 text-[12px] md:text-[13px] font-semibold text-white tracking-wide leading-relaxed">
      <Sparkles className="w-3.5 h-3.5 text-[#E31E24] animate-pulse shrink-0" />
      <span className="truncate max-w-[85vw] md:max-w-none">{banner.content}</span>
      {banner.link_url ? (
        <span className="inline-flex items-center gap-0.5 text-[#e2e5ea] group-hover:text-white transition-colors text-[11px] font-bold uppercase tracking-wider pl-1.5 shrink-0">
          Chi tiết <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      ) : null}
    </div>
  );

  if (banner.link_url) {
    const isExternal = banner.link_url.startsWith('http');
    if (isExternal) {
      return (
        <a
          href={banner.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="group block w-full bg-[#0d1f3c] hover:bg-[#122442] transition-colors py-2 px-4 text-center relative z-50 border-b border-white/5"
        >
          {contentElement}
        </a>
      );
    }

    return (
      <Link
        href={banner.link_url}
        className="group block w-full bg-[#0d1f3c] hover:bg-[#122442] transition-colors py-2 px-4 text-center relative z-50 border-b border-white/5"
      >
        {contentElement}
      </Link>
    );
  }

  return (
    <div className="w-full bg-[#0d1f3c] py-2 px-4 text-center relative z-50 border-b border-white/5">
      {contentElement}
    </div>
  );
}
