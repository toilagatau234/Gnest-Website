'use client';

import { Phone, MessageCircle } from 'lucide-react';
import { useModal } from '@/lib/context';
import type { CtaContent } from '@/lib/services/site-content';

interface FloatingCTAProps {
  content?: CtaContent;
}

export function FloatingCTA({ content }: FloatingCTAProps) {
  const { openContactModal } = useModal();
  const zaloUrl = content?.zalo_url;
  const hotline = content?.hotline?.replace(/\D/g, '');

  return (
    <div className="fixed right-[18px] bottom-[90px] z-[990] flex flex-col gap-3">
      <a
        href={zaloUrl || '#'}
        target={zaloUrl ? '_blank' : undefined}
        rel={zaloUrl ? 'noopener noreferrer' : undefined}
        onClick={(event) => {
          if (!zaloUrl) {
            event.preventDefault();
            openContactModal();
          }
        }}
        aria-label="Liên hệ tư vấn qua Zalo"
        className="group relative flex items-center justify-center w-[54px] h-[54px] rounded-full text-white shadow-[0_4px_16px_rgba(0,0,0,0.25)] bg-[#0068FF] transition-all hover:scale-110 hover:shadow-[0_6px_22px_rgba(0,0,0,0.30)] motion-safe:animate-[ring_2.5s_ease-in-out_infinite] hover:animate-none"
      >
        <span className="absolute right-[62px] top-1/2 -translate-y-1/2 bg-[#333] text-white text-[11px] font-semibold whitespace-nowrap px-[10px] py-[5px] rounded opacity-0 transition-opacity pointer-events-none group-hover:opacity-100 after:content-[''] after:absolute after:left-full after:top-1/2 after:-translate-y-1/2 after:border-[5px] after:border-transparent after:border-l-[#333]">
          Zalo / Tư vấn
        </span>
        <MessageCircle className="w-6 h-6" strokeWidth={2.2} />
      </a>

      <a
        href={hotline ? `tel:${hotline}` : '#'}
        onClick={(event) => {
          if (!hotline) {
            event.preventDefault();
            openContactModal();
          }
        }}
        aria-label="Gọi hotline"
        className="group relative flex items-center justify-center w-[54px] h-[54px] rounded-full text-white shadow-[0_4px_16px_rgba(0,0,0,0.25)] bg-dtl-red transition-transform hover:scale-110 motion-safe:animate-[ring_2.5s_ease-in-out_infinite] hover:animate-none"
      >
        <span className="absolute right-[62px] top-1/2 -translate-y-1/2 bg-[#333] text-white text-[11px] font-semibold whitespace-nowrap px-[10px] py-[5px] rounded opacity-0 transition-opacity pointer-events-none group-hover:opacity-100 after:content-[''] after:absolute after:left-full after:top-1/2 after:-translate-y-1/2 after:border-[5px] after:border-transparent after:border-l-[#333]">
          Gọi xin báo giá
        </span>
        <Phone className="w-6 h-6" strokeWidth={2.2} />
      </a>
    </div>
  );
}
