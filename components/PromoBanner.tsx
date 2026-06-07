'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { PublicBanner } from '@/lib/services/banners';

interface PromoBannerProps {
  banners: PublicBanner[];
}

export function PromoBanner({ banners }: PromoBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!banners || banners.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setDirection('next');
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners, isHovered]);

  if (!banners || banners.length === 0) return null;

  const currentBanner = banners[currentIndex];

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDirection('prev');
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDirection('next');
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const slideVariants = {
    initial: (dir: 'next' | 'prev') => ({
      y: dir === 'next' ? 20 : -20,
      opacity: 0,
    }),
    animate: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
    },
    exit: (dir: 'next' | 'prev') => ({
      y: dir === 'next' ? -20 : 20,
      opacity: 0,
      transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
    }),
  };

  const contentElement = (
    <motion.div
      key={currentBanner.id}
      custom={direction}
      variants={slideVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex items-center justify-center gap-2 text-[12px] md:text-[13px] font-semibold text-white tracking-wide leading-relaxed px-8"
    >
      <Sparkles className="w-3.5 h-3.5 text-[#E31E24] animate-pulse shrink-0" />
      <span className="truncate max-w-[70vw] md:max-w-none">{currentBanner.content}</span>
      {currentBanner.link_url ? (
        <span className="inline-flex items-center gap-0.5 text-[#e2e5ea] group-hover:text-white transition-colors text-[11px] font-bold uppercase tracking-wider pl-1.5 shrink-0">
          Chi tiết <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      ) : null}
    </motion.div>
  );

  const renderBannerContent = () => {
    if (currentBanner.link_url) {
      const isExternal = currentBanner.link_url.startsWith('http');
      if (isExternal) {
        return (
          <a
            href={currentBanner.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block w-full py-2 text-center hover:bg-[#122442] transition-colors duration-200"
          >
            {contentElement}
          </a>
        );
      }

      return (
        <Link
          href={currentBanner.link_url}
          className="group block w-full py-2 text-center hover:bg-[#122442] transition-colors duration-200"
        >
          {contentElement}
        </Link>
      );
    }

    return (
      <div className="w-full py-2 text-center">
        {contentElement}
      </div>
    );
  };

  return (
    <div
      className="w-full bg-[#0d1f3c] relative z-50 border-b border-white/5 overflow-hidden h-[38px] flex items-center justify-center select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence mode="wait" initial={false} custom={direction}>
        {renderBannerContent()}
      </AnimatePresence>

      {/* Navigation arrows (only if multiple banners) */}
      {banners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white hover:bg-white/10 p-1 rounded-full transition-all duration-200 z-50 cursor-pointer"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white hover:bg-white/10 p-1 rounded-full transition-all duration-200 z-50 cursor-pointer"
            aria-label="Next banner"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  );
}
