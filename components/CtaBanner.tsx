'use client';

import type { CtaContent } from '@/lib/services/site-content';
import { useModal } from '@/lib/context';

interface CtaBannerProps {
  content?: CtaContent;
}

export function CtaBanner({ content }: CtaBannerProps) {
  const { openContactModal } = useModal();
  const hotline = content?.hotline || '0939991551';

  return (
    <section className="bg-gradient-to-br from-dtl-red to-[#b01218] text-white py-9">
      <div className="max-w-[1220px] mx-auto px-5 text-center">
        <h2 className="text-[26px] font-extrabold">Liên hệ ngay để được tư vấn & báo giá miễn phí</h2>
        <p className="text-[14px] text-white/80 mt-1.5">Đại Tài Lợi – Đồng hành cùng sự phát triển của doanh nghiệp bạn</p>
        <button
          type="button"
          onClick={openContactModal}
          className="mt-5 inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-extrabold text-dtl-red shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
        >
          Gọi tư vấn: {hotline}
        </button>
      </div>
    </section>
  );
}
