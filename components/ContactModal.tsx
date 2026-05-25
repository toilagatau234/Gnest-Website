'use client';

import { useModal } from '@/lib/context';
import { SALE_CONTACTS } from '@/lib/data';
import { X, Phone, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export function ContactModal() {
  const { isContactModalOpen, closeContactModal } = useModal();

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 z-[4000] transition-opacity duration-300 ${
          isContactModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeContactModal}
        aria-hidden="true"
      />

      {/* Modal */}
      <div 
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white w-full max-w-[440px] rounded-xl shadow-2xl z-[4001] overflow-hidden transition-all duration-300 ${
          isContactModalOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
      >
        <div className="bg-dtl-navy px-5 py-4 flex items-center justify-between">
          <h2 id="contact-modal-title" className="text-white font-bold text-[16px] uppercase tracking-wide">
            Liên Hệ Với Chúng Tôi
          </h2>
          <button 
            onClick={closeContactModal}
            className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[70vh] bg-[#f8f9fa]">
          <p className="text-dtl-gray text-[14px] mb-4">
            Vui lòng chọn nhân viên kinh doanh để được hỗ trợ và nhận báo giá tốt nhất:
          </p>

          <div className="space-y-3">
            {SALE_CONTACTS.map((contact) => (
              <div 
                key={contact.id} 
                className="bg-white border border-dtl-border rounded-lg p-3.5 flex items-center gap-3.5 shadow-sm hover:border-dtl-red/30 hover:shadow-md transition-all"
              >
                {contact.avatar && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={contact.avatar} 
                    alt={contact.name} 
                    className="w-[46px] h-[46px] rounded-full object-cover shrink-0 border border-dtl-border"
                    loading="lazy"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[14px] text-dtl-dark truncate">{contact.name}</h3>
                  <div className="text-[12px] text-dtl-gray truncate mt-0.5">{contact.role}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link 
                    href={contact.zalo.startsWith('http') ? contact.zalo : `https://zalo.me/${contact.zalo}`}
                    target="_blank"
                    className="w-[36px] h-[36px] flex items-center justify-center rounded-full bg-[#E5F1FF] text-[#0068FF] hover:bg-[#0068FF] hover:text-white transition-colors"
                    title="Chat Zalo"
                  >
                   <span className="font-extrabold font-arial-black text-[15px]">Z</span>
                  </Link>
                  <a 
                    href={`tel:${contact.phone}`}
                    className="w-[36px] h-[36px] flex items-center justify-center rounded-full bg-dtl-red/10 text-dtl-red hover:bg-dtl-red hover:text-white transition-colors"
                    title="Gọi Ngay"
                  >
                    <Phone className="w-4 h-4" strokeWidth={2.5} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
