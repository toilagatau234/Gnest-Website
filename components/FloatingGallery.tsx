'use client';

import Link from 'next/link';
import { motion } from 'motion/react';

const ITEMS = [
  {img: 'https://bizweb.dktcdn.net/thumb/large/100/091/995/products/sua-200.png', label: 'Chai Lọ Thủy Tinh', href: '/danh-muc/chai-lo-thuy-tinh', color: 'from-blue-500/20 to-blue-600/5'},
  {img: 'https://bizweb.dktcdn.net/thumb/large/100/091/995/products/chai-thuy-tinh-det-250.png', label: 'Hộp Nhựa', href: '/danh-muc/hop-nhua', color: 'from-emerald-500/20 to-emerald-600/5'},
  {img: 'https://bizweb.dktcdn.net/thumb/large/100/091/995/products/chai-ruou-mo-nap-go-250ml.png', label: 'Bao Bì Yến', href: '/danh-muc/bao-bi-yen', color: 'from-orange-500/20 to-orange-600/5'},
  {img: 'https://bizweb.dktcdn.net/thumb/large/100/091/995/products/chai-ruou-cao-cap-dang-cao-750.png', label: 'Phụ Kiện', href: '/danh-muc/phu-kien-yen', color: 'from-purple-500/20 to-purple-600/5'},
  {img: 'https://bizweb.dktcdn.net/thumb/large/100/091/995/products/sua-200.png', label: 'In Ấn Phẩm', href: '/danh-muc/in-an-pham', color: 'from-rose-500/20 to-rose-600/5'},
  {img: 'https://bizweb.dktcdn.net/thumb/large/100/091/995/products/chai-thuy-tinh-det-250.png', label: 'Gia Công CNC', href: '/danh-muc/gia-cong-cnc', color: 'from-amber-500/20 to-amber-600/5'},
];

// Double the items for seamless infinite scroll
const DOUBLE_ITEMS = [...ITEMS, ...ITEMS];

export function FloatingGallery() {
  // Each card is 180px wide + 16px gap = 196px. 6 items = 1176px.
  return (
    <div className="relative w-full h-[450px] overflow-hidden flex flex-col justify-center gap-4 py-8" style={{ maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}>
      
      {/* Row 1: Moves Left to Right */}
      <motion.div 
        className="flex gap-4 w-max"
        animate={{ x: [ -1176, 0 ] }}
        transition={{ repeat: Infinity, ease: 'linear', duration: 25 }}
      >
        {DOUBLE_ITEMS.map((item, idx) => (
          <GalleryCard key={`row1-${idx}`} item={item} />
        ))}
      </motion.div>

      {/* Row 2: Moves Right to Left */}
      <motion.div 
        className="flex gap-4 w-max"
        animate={{ x: [ 0, -1176 ] }}
        transition={{ repeat: Infinity, ease: 'linear', duration: 25 }}
      >
        {DOUBLE_ITEMS.map((item, idx) => (
          <GalleryCard key={`row2-${idx}`} item={item} />
        ))}
      </motion.div>

    </div>
  );
}

function GalleryCard({ item }: { item: typeof ITEMS[0] }) {
  return (
    <Link href={item.href} className={`group relative w-[180px] h-[180px] shrink-0 bg-gradient-to-br ${item.color} border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_12px_30px_rgba(255,255,255,0.15)] hover:border-white/30 hover:z-10`}>
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="absolute inset-0 p-4 z-10 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.img} alt={item.label} className="w-[85%] h-[85%] object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-110" loading="eager" />
      </div>
      <div className="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20">
        <div className="font-bold text-white text-center text-[13px] drop-shadow-md">{item.label}</div>
      </div>
    </Link>
  );
}
