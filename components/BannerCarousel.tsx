'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import type { PublicBanner } from '@/lib/services/banners';

interface BannerCarouselProps {
  banners: PublicBanner[];
}

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!banners || banners.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 2500); // banner change every 2.5 seconds
    return () => clearInterval(interval);
  }, [banners, isHovered]);

  if (!banners || banners.length === 0) return null;

  const renderImageContainer = (src: string, alt: string, isMobile: boolean) => {
    const aspectClass = isMobile ? 'aspect-[2/1]' : 'aspect-[3.2/1]';
    const displayClass = isMobile ? 'block md:hidden' : 'hidden md:block';

    return (
      <div className={`w-full ${aspectClass} ${displayClass} relative rounded-xl overflow-hidden border border-slate-200/60 bg-[#0d1f3c]`}>
        {/* Blurred background image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="w-full h-full object-cover absolute inset-0 blur-xl opacity-35 scale-110 pointer-events-none select-none"
          loading="lazy"
        />
        {/* Subtle dark overlay */}
        <div className="absolute inset-0 bg-slate-950/20 select-none pointer-events-none" />
        
        {/* Crisp foreground image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-contain relative z-10 mx-auto pointer-events-none select-none animate-fade-in"
          loading="lazy"
        />
      </div>
    );
  };

  const renderBannerContent = (banner: PublicBanner, isCarouselItem = false) => {
    const hasImage = Boolean(banner.image_desktop_url);
    const desktopImg = banner.image_desktop_url || '';
    const mobileImg = banner.image_mobile_url || desktopImg;

    const contentElement = hasImage ? (
      <div className="w-full relative">
        {renderImageContainer(desktopImg, banner.content, false)}
        {renderImageContainer(mobileImg, banner.content, true)}
      </div>
    ) : (
      <div className={`w-full ${isCarouselItem ? 'h-full' : ''} rounded-xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-[#1B3A6B] to-[#0d1f3c] text-white border border-[#e2e5ea] shadow-sm relative overflow-hidden before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,rgba(227,30,36,0.18),transparent_50%)]`}>
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
          <span className="inline-flex items-center gap-2 bg-[#E31E24] hover:bg-[#C01519] text-white font-bold text-sm px-6 h-11 rounded-[6px] shrink-0 transition-all shadow-sm shadow-[#E31E24]/20">
            Khám phá ngay <ArrowRight className="w-4 h-4" />
          </span>
        ) : null}
      </div>
    );

    if (banner.link_url) {
      const isExternal = banner.link_url.startsWith('http');
      const linkClass = `block w-full ${isCarouselItem ? 'h-full' : ''} group/slide transition-all duration-300 hover:scale-[1.002]`;
      if (isExternal) {
        return (
          <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className={linkClass}>
            {contentElement}
          </a>
        );
      }
      return (
        <Link href={banner.link_url} className={linkClass}>
          {contentElement}
        </Link>
      );
    }

    return <div className={`w-full ${isCarouselItem ? 'h-full' : ''}`}>{contentElement}</div>;
  };

  // Case 1: Single banner -> static rendering
  if (banners.length === 1) {
    return (
      <div className="max-w-[1220px] mx-auto px-5 my-10 md:my-16">
        {renderBannerContent(banners[0])}
      </div>
    );
  }

  // Case 2: Multiple banners -> carousel rendering
  const handlePrev = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  return (
    <div
      className="max-w-[1220px] mx-auto px-5 my-10 md:my-16 relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-label="Promotional Banners Carousel"
    >
      <div className="w-full overflow-hidden rounded-xl">
        <motion.div
          className="flex w-full items-stretch cursor-grab active:cursor-grabbing"
          animate={{ x: `-${currentIndex * 100}%` }}
          transition={{ type: 'spring', stiffness: 220, damping: 26 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.25}
          onDragEnd={(_, info) => {
            const swipeThreshold = 55;
            if (info.offset.x < -swipeThreshold) {
              handleNext();
            } else if (info.offset.x > swipeThreshold) {
              handlePrev();
            }
          }}
        >
          {banners.map((banner) => (
            <div key={banner.id} className="w-full shrink-0 h-auto">
              {renderBannerContent(banner, true)}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Prev/Next buttons (hidden on mobile, visible on desktop hover) */}
      <button
        onClick={handlePrev}
        className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-white/85 text-[#1B3A6B] hover:bg-white hover:text-[#E31E24] border border-slate-200/80 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto z-30 cursor-pointer"
        aria-label="Previous banner"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={handleNext}
        className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-white/85 text-[#1B3A6B] hover:bg-white hover:text-[#E31E24] border border-slate-200/80 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto z-30 cursor-pointer"
        aria-label="Next banner"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Pagination Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentIndex(index);
            }}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              index === currentIndex
                ? 'w-6 bg-[#E31E24]'
                : 'w-2 bg-slate-300/80 hover:bg-slate-400'
            }`}
            aria-label={`Go to banner slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
