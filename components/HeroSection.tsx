'use client';

import { Check, ChevronDown, Phone } from "lucide-react";
import Link from 'next/link';
import { FloatingGallery } from './FloatingGallery';
import { useModal } from '@/lib/context';

export function HeroSection() {
  const { openContactModal } = useModal();
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-dtl-navy-dark to-[#1a3060] text-white py-12 pb-13">
      {/* Background patterns */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"1\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}
      ></div>
      <div className="absolute -top-[60px] -right-[60px] w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle,rgba(227,30,36,0.18)_0%,transparent_70%)] pointer-events-none"></div>
      
      <div className="max-w-[1220px] mx-auto px-5 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          {/* Left: text */}
          <div>
            <span className="inline-flex items-center gap-1.5 bg-[rgba(227,30,36,0.20)] border border-[rgba(227,30,36,0.40)] text-[#ffaaaa] text-xs font-semibold tracking-wide uppercase px-3.5 py-1.5 rounded-full mb-4.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
              Đại Tài Lợi – ĐTL
            </span>
            <h1 className="text-[26px] md:text-4xl lg:text-[40px] font-black leading-[1.12] mb-2 tracking-tight">
              SẢN XUẤT<br/>
              <em className="text-dtl-red not-italic">THEO YÊU CẦU</em>
            </h1>
            <p className="text-[15px] text-white/70 mb-2">Đa dạng mẫu mã · Chất lượng đảm bảo · Giao hàng toàn quốc</p>
            <p className="text-[15px] md:text-[19px] font-bold text-white mb-6">Số lượng lớn – <span className="text-[#FFD700]">Giá tốt nhất thị trường</span></p>
            
            <div className="flex gap-3 flex-wrap">
              <a 
                href="#lien-he"
                className="inline-flex items-center gap-2 bg-dtl-red text-white px-7 py-3 rounded font-bold text-[15px] shadow-[0_4px_16px_rgba(227,30,36,0.35)] transition-all hover:bg-dtl-red-dark hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(227,30,36,0.45)]"
              >
                <Phone className="w-4 h-4" strokeWidth={2.2} />
                Liên hệ ngay
              </a>
              <Link href="/danh-muc" className="inline-flex items-center gap-2 bg-transparent text-white border-2 border-white/35 px-7 py-3 rounded font-semibold text-[15px] transition-all hover:border-white hover:bg-white/10">
                Xem sản phẩm
                <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-px bg-white/10 rounded-lg overflow-hidden mt-6 md:mt-7">
              <div className="bg-white/5 py-3.5 px-3 text-center">
                <div className="text-[22px] sm:text-2xl font-black text-dtl-red">10<span className="text-base text-dtl-red">+</span></div>
                <div className="text-[11px] text-white/65 mt-0.5">Năm kinh nghiệm</div>
              </div>
              <div className="bg-white/5 py-3.5 px-3 text-center">
                <div className="text-[22px] sm:text-2xl font-black text-dtl-red">500<span className="text-base text-dtl-red">+</span></div>
                <div className="text-[11px] text-white/65 mt-0.5">Mẫu sản phẩm</div>
              </div>
              <div className="bg-white/5 py-3.5 px-3 text-center">
                <div className="text-[22px] sm:text-2xl font-black text-dtl-red">63</div>
                <div className="text-[11px] text-white/65 mt-0.5">Tỉnh thành</div>
              </div>
            </div>
          </div>

          {/* Right: product showcase animated gallery */}
          <div className="hidden md:flex flex-col gap-3.5 relative">
            <FloatingGallery />
            
            <div className="flex gap-2.5 justify-center mt-2 relative z-20">
              {['Giá sỉ tốt', 'Ship toàn quốc', 'In theo yêu cầu'].map((badge, idx) => (
                <div key={idx} className="bg-white/10 border border-white/20 rounded-full py-1.5 px-4 text-xs font-semibold text-white/85 flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-white" />
                  {badge}
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
