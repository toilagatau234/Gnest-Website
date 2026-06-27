'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useCategories } from '@/lib/categories-context';
import { getFirstProductImagesByCategorySlugs } from '@/lib/services/category-preview-images';

const GRADIENT_COLORS = [
  'from-blue-500/25 to-blue-700/10',
  'from-emerald-500/25 to-emerald-700/10',
  'from-orange-500/25 to-orange-700/10',
  'from-purple-500/25 to-purple-700/10',
  'from-rose-500/25 to-rose-700/10',
  'from-amber-500/25 to-amber-700/10',
  'from-cyan-500/25 to-cyan-700/10',
  'from-indigo-500/25 to-indigo-700/10',
];

interface GalleryItem {
  slug: string;
  label: string;
  href: string;
  type: 'product' | 'service';
  imageUrl?: string | null;
  color: string;
}

export function FloatingGallery() {
  const { categories } = useCategories();
  const [productImages, setProductImages] = useState<Record<string, string>>({});

  // Combine top-level product categories + service categories
  const items: GalleryItem[] = [
    ...categories.filter((c) => c.type === 'product' && !c.parentId),
    ...categories.filter((c) => c.type === 'service' && !c.parentId),
  ].map((c, i) => ({
    slug: c.id,
    label: c.title,
    href: c.type === 'product' ? `/danh-muc/${c.id}` : `/#dich-vu`,
    type: c.type,
    imageUrl: c.imageUrl,
    color: GRADIENT_COLORS[i % GRADIENT_COLORS.length],
  }));

  // Fetch first product images for product categories
  useEffect(() => {
    const productSlugs = items.filter((i) => i.type === 'product').map((i) => i.slug);
    if (productSlugs.length === 0) return;

    getFirstProductImagesByCategorySlugs(productSlugs).then(setProductImages).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  // Resolve each item's display image
  const resolvedItems: GalleryItem[] = items.map((item) => ({
    ...item,
    imageUrl: item.type === 'product'
      ? (productImages[item.slug] ?? item.imageUrl ?? null)
      : item.imageUrl,
  }));

  // Need at least 1 item; double for seamless scroll
  if (resolvedItems.length === 0) return null;

  const doubled = [...resolvedItems, ...resolvedItems];
  // Each card = 180px + 16px gap = 196px
  const scrollWidth = resolvedItems.length * 196;

  return (
    <div
      className="relative w-full h-[450px] overflow-hidden flex flex-col justify-center gap-4 py-8"
      style={{ maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}
    >
      {/* Row 1: left → right */}
      <motion.div
        className="flex gap-4 w-max"
        animate={{ x: [-scrollWidth, 0] }}
        transition={{ repeat: Infinity, ease: 'linear', duration: Math.max(20, resolvedItems.length * 4) }}
      >
        {doubled.map((item, idx) => (
          <GalleryCard key={`row1-${idx}`} item={item} />
        ))}
      </motion.div>

      {/* Row 2: right → left */}
      <motion.div
        className="flex gap-4 w-max"
        animate={{ x: [0, -scrollWidth] }}
        transition={{ repeat: Infinity, ease: 'linear', duration: Math.max(20, resolvedItems.length * 4) }}
      >
        {doubled.map((item, idx) => (
          <GalleryCard key={`row2-${idx}`} item={item} />
        ))}
      </motion.div>
    </div>
  );
}

function GalleryCard({ item }: { item: GalleryItem }) {
  const isService = item.type === 'service';

  return (
    <Link
      href={item.href}
      className={`group relative w-[180px] h-[180px] shrink-0 bg-gradient-to-br ${item.color} border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_12px_30px_rgba(255,255,255,0.15)] hover:border-white/30 hover:z-10`}
    >
      {/* Background image (blurred for services, normal for products) */}
      {item.imageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{
            backgroundImage: `url(${item.imageUrl})`,
            ...(isService ? { filter: 'blur(3px) brightness(0.45)', transform: 'scale(1.08)' } : {}),
          }}
        />
      )}

      {/* Overlay hover shimmer */}
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Product: show image via next/image for optimisation when available */}
      {!isService && item.imageUrl && (
        <div className="absolute inset-0 p-4 z-10 flex items-center justify-center">
          <Image
            src={item.imageUrl}
            alt={item.label}
            width={150}
            height={150}
            className="w-[85%] h-[85%] object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-110"
          />
        </div>
      )}

      {/* Service badge */}
      {isService && (
        <div className="absolute top-3 left-3 z-20">
          <span className="bg-white/20 border border-white/30 rounded-full px-2 py-0.5 text-[9px] font-bold text-white/90 uppercase tracking-wider">
            Dịch vụ
          </span>
        </div>
      )}

      {/* Label bar */}
      <div className="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20">
        <div className="font-bold text-white text-center text-[13px] drop-shadow-md">{item.label}</div>
      </div>
    </Link>
  );
}
