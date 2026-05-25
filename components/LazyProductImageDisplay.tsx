'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Layers } from 'lucide-react';

interface LazyProductImageDisplayProps {
  imgs?: string[];
  img?: string | null;
  alt: string;
}

export function LazyProductImageDisplay({ imgs, img, alt }: LazyProductImageDisplayProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const images = imgs && imgs.length > 0 ? imgs : (img ? [img] : []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '120px', // start loading before entering viewport
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  if (images.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#f0f4f9] to-[#e4eaf3] gap-2 rounded">
        <div className="w-10 h-10 bg-dtl-navy rounded-xl flex items-center justify-center shadow-inner">
          <Layers className="text-white w-5 h-5" />
        </div>
        <span className="text-[10px] text-[#8fa3be] font-medium tracking-wide">Coming Soon</span>
      </div>
    );
  }

  const primaryImg = images[0];
  const secondaryImg = images.length > 1 ? images[1] : null;

  return (
    <div ref={containerRef} className="w-full h-full relative group/img overflow-hidden flex items-center justify-center bg-white rounded">
      {/* Premium Loader/Skeleton Indicator */}
      {!isLoaded && isInView && (
        <div className="absolute inset-0 bg-[#fbfcfd] flex items-center justify-center z-10 animate-pulse">
          <div className="w-6 h-6 border-2 border-gray-100 border-t-dtl-red rounded-full animate-spin"></div>
        </div>
      )}

      {/* Placeholder box when observer hasn't triggered */}
      {!isInView && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
          <div className="w-4 h-4 bg-gray-200/40 rounded-full animate-pulse"></div>
        </div>
      )}

      {isInView && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={primaryImg} 
            alt={alt} 
            onLoad={() => setIsLoaded(true)}
            className={`w-full h-full object-contain mix-blend-multiply transition-all duration-500 ease-in-out group-hover/img:scale-105 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            } ${secondaryImg ? 'group-hover/img:opacity-0' : ''}`} 
          />
          {secondaryImg && (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={secondaryImg} 
              alt={alt} 
              className="absolute inset-0 w-full h-full object-contain mix-blend-multiply opacity-0 transition-all duration-500 ease-in-out group-hover/img:opacity-100 group-hover/img:scale-105" 
            />
          )}
        </>
      )}
    </div>
  );
}
