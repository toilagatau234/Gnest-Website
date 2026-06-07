import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import type { PublicBanner } from '@/lib/services/banners';

interface BannerSlotProps {
  banner: PublicBanner;
}

export function BannerSlot({ banner }: BannerSlotProps) {
  const hasImage = Boolean(banner.image_desktop_url);
  const desktopImg = banner.image_desktop_url || '';
  const mobileImg = banner.image_mobile_url || desktopImg;

  const contentElement = hasImage ? (
    <div className="w-full relative">
      {/* Desktop view */}
      <div className="hidden md:block w-full aspect-[3.2/1] relative rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.002] transition-all duration-300 border border-slate-200/60 bg-slate-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={desktopImg}
          alt={banner.content}
          className="w-full h-full object-cover animate-fade-in"
          loading="lazy"
        />
      </div>

      {/* Mobile view */}
      <div className="block md:hidden w-full aspect-[2/1] relative rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.002] transition-all duration-300 border border-slate-200/60 bg-slate-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mobileImg}
          alt={banner.content}
          className="w-full h-full object-cover animate-fade-in"
          loading="lazy"
        />
      </div>
    </div>
  ) : (
    <div className="w-full rounded-xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-[#1B3A6B] to-[#0d1f3c] text-white border border-[#e2e5ea] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,rgba(227,30,36,0.18),transparent_50%)]">
      <div className="flex items-start gap-4 min-w-0 flex-1 text-left">
        <div className="p-3 bg-[#E31E24] text-white rounded-xl shrink-0 animate-pulse mt-0.5">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <span className="block text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#E31E24] mb-1">
            Khuyến mãi đặc biệt
          </span>
          <p className="text-base md:text-lg font-bold leading-relaxed text-white text-wrap balance max-w-3xl">
            {banner.content}
          </p>
        </div>
      </div>

      {banner.link_url ? (
        <span className="inline-flex items-center gap-2 bg-[#E31E24] hover:bg-[#C01519] text-white font-bold text-sm px-6 h-11 rounded-[6px] shrink-0 transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-sm shadow-[#E31E24]/20 hover:shadow-md hover:shadow-[#E31E24]/25">
          Khám phá ngay <ArrowRight className="w-4 h-4" />
        </span>
      ) : null}
    </div>
  );

  return (
    <div className="max-w-[1220px] mx-auto px-5 my-10 md:my-16">
      {banner.link_url ? (
        banner.link_url.startsWith('http') ? (
          <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="block group">
            {contentElement}
          </a>
        ) : (
          <Link href={banner.link_url} className="block group">
            {contentElement}
          </Link>
        )
      ) : (
        contentElement
      )}
    </div>
  );
}
