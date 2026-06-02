'use client';

import { MessageSquare, Phone, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useModal } from '@/lib/context';

interface ProductDetailCTAsProps {
  productId: string;
  productSlug: string;
  productName: string;
  categorySlug: string | null;
}

export function ProductDetailCTAs({
  productId,
  productSlug,
  productName,
  categorySlug,
}: ProductDetailCTAsProps) {
  const { openQuoteModal, openContactModal } = useModal();

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => openQuoteModal({ productId, productSlug, productName })}
        aria-label={`Yêu cầu báo giá cho ${productName}`}
        className="w-full flex items-center justify-center gap-2 bg-dtl-red hover:bg-dtl-red-dark text-white font-bold text-[15px] py-3.5 px-6 rounded-lg transition-colors shadow-sm"
      >
        <MessageSquare className="w-5 h-5 shrink-0" />
        Yêu cầu báo giá
      </button>

      <button
        onClick={openContactModal}
        aria-label="Liên hệ tư vấn"
        className="w-full flex items-center justify-center gap-2 bg-dtl-navy hover:bg-dtl-navy-dark text-white font-bold text-[15px] py-3.5 px-6 rounded-lg transition-colors shadow-sm"
      >
        <Phone className="w-5 h-5 shrink-0" />
        Liên hệ tư vấn
      </button>

      {categorySlug && (
        <Link
          href={`/danh-muc/${categorySlug}`}
          className="w-full flex items-center justify-center gap-2 bg-white border border-dtl-border hover:border-dtl-navy/50 text-dtl-navy font-semibold text-[14px] py-3 px-6 rounded-lg transition-colors"
        >
          Xem danh mục liên quan
          <ArrowRight className="w-4 h-4 shrink-0" />
        </Link>
      )}
    </div>
  );
}
