'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Layers } from 'lucide-react';
import type { PublicProductImage } from '@/lib/services/public-products';

interface ProductGalleryProps {
  images: PublicProductImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const activeImages = images.filter((img) => img.public_url);
  const [selectedIdx, setSelectedIdx] = useState(0);

  if (activeImages.length === 0) {
    return (
      <div className="w-full aspect-square bg-gradient-to-br from-dtl-bg-alt to-[#e4eaf3] rounded-xl flex flex-col items-center justify-center gap-3 border border-dtl-border">
        <div className="w-14 h-14 bg-dtl-navy rounded-xl flex items-center justify-center shadow-inner">
          <Layers className="text-white w-7 h-7" />
        </div>
        <span className="text-sm text-dtl-gray font-medium">Hình ảnh đang cập nhật</span>
      </div>
    );
  }

  const current = activeImages[selectedIdx] ?? activeImages[0];

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative w-full aspect-square bg-white rounded-xl border border-dtl-border overflow-hidden flex items-center justify-center">
        <Image
          key={current.id}
          src={current.public_url!}
          alt={current.alt ?? productName}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain mix-blend-multiply p-4"
          priority
        />
      </div>

      {/* Thumbnails */}
      {activeImages.length > 1 && (
        <div
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin"
          role="listbox"
          aria-label="Hình ảnh sản phẩm"
        >
          {activeImages.map((img, idx) => (
            <button
              key={img.id}
              role="option"
              aria-selected={idx === selectedIdx}
              onClick={() => setSelectedIdx(idx)}
              className={`relative shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden bg-white transition-all ${
                idx === selectedIdx
                  ? 'border-dtl-red shadow-md'
                  : 'border-dtl-border hover:border-dtl-navy/50'
              }`}
            >
              <Image
                src={img.public_url!}
                alt={img.alt ?? `${productName} ${idx + 1}`}
                fill
                sizes="64px"
                className="object-contain mix-blend-multiply p-1"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
