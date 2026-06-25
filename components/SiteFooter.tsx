'use client';

import { MapPin, Phone, Mail, ChevronRight, Settings, Award } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export interface SiteFooterProps {
  companyName?: string;
  address?: string;
  phone?: string;
  email?: string;
}

const DEFAULTS = {
  companyName: 'CÔNG TY TNHH MTV ĐẠI TÀI LỢI',
  address: '716 Nguyễn Huệ, P. Mỹ Trà, Tỉnh Đồng Tháp',
  phone: '0939.991.551',
  email: 'congtydaitailoi@gmail.com',
};

export function SiteFooter({
  companyName = DEFAULTS.companyName,
  address = DEFAULTS.address,
  phone = DEFAULTS.phone,
  email = DEFAULTS.email,
}: SiteFooterProps) {
  const { user } = useAuth();
  const phoneRaw = phone.replace(/[\.\-\s]/g, '');

  return (
    <footer className="bg-dtl-navy-dark text-white/75 pt-10">
      <div className="max-w-[1220px] mx-auto px-5">
        {/* Upper brand/info bar */}
        <div className="border-b border-white/10 pb-6 mb-8 flex flex-col lg:flex-row justify-between items-center gap-4 text-xs md:text-[13px]">
          <span className="flex items-center gap-1.5 font-bold text-white">
            <Award className="w-4 h-4 text-dtl-red shrink-0" /> Đại Tài Lợi – Đồng hành cùng thương hiệu của bạn
          </span>
          <div className="flex items-center gap-4 md:gap-5 flex-wrap justify-center lg:justify-end text-white/70">
            <span>📧 <a href={`mailto:${email}`} className="hover:text-white transition-colors">{email}</a></span>
            <span className="hidden md:inline text-white/20">|</span>
            <span>📍 {address}</span>
            <span className="hidden md:inline text-white/20">|</span>
            <span>📞 <a href={`tel:${phoneRaw}`} className="hover:text-white transition-colors">Hotline: <strong className="text-white hover:text-dtl-red">{phone}</strong></a></span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2.2fr_1fr_1fr_1.8fr] gap-8 lg:gap-11 pb-10 border-b border-white/10">

          {/* About */}
          <div>
            <Image
              src="/images/logo-dtl.svg"
              alt="Đại Tài Lợi"
              width={1276}
              height={1242}
              className="h-[82px] w-auto"
              unoptimized
            />
            <p className="text-[13px] mt-4 leading-[1.75]">{companyName} – Chuyên cung cấp bao bì, chai lọ thủy tinh, hộp nhựa, phụ kiện ngành yến, in ấn phẩm và gia công CNC chất lượng cao.</p>
            <div className="text-xs text-white/45 mt-2">MST: 1401969516</div>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-white text-[13px] font-bold tracking-[0.6px] uppercase mb-4 pb-2.5 border-b-2 border-[#e31e2480]">Sản Phẩm</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Chai Lọ Thủy Tinh', href: '#chai-lo-thuy-tinh' },
                { label: 'Hộp Nhựa', href: '#hop-nhua' },
                { label: 'Bao Bì Ngành Yến', href: '#bao-bi-yen' },
                { label: 'Phụ Kiện Ngành Yến', href: '#phu-kien-yen' },
                { label: 'In Ấn Phẩm', href: '#in-an-pham' },
                { label: 'Gia Công CNC', href: '#gia-cong-cnc' },
              ].map((link, idx) => (
                <li key={idx} className="flex items-center text-[13px]">
                  <ChevronRight className="w-3.5 h-3.5 text-dtl-red mr-1" />
                  <a href={link.href} className="text-white/65 transition-colors hover:text-white">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white text-[13px] font-bold tracking-[0.6px] uppercase mb-4 pb-2.5 border-b-2 border-[#e31e2480]">Công Ty</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Giới thiệu', href: '#gioi-thieu' },
                { label: 'Sản phẩm', href: '#san-pham' },
                { label: 'Liên hệ', href: '#lien-he' },
              ].map((link, idx) => (
                <li key={idx} className="flex items-center text-[13px]">
                  <ChevronRight className="w-3.5 h-3.5 text-dtl-red mr-1" />
                  <a href={link.href} className="text-white/65 transition-colors hover:text-white">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white text-[13px] font-bold tracking-[0.6px] uppercase mb-4 pb-2.5 border-b-2 border-[#e31e2480]">Liên Hệ</h4>
            <ul className="space-y-3 mb-4">
              <li className="flex items-start gap-2.5 text-[13px] leading-[1.5]">
                <MapPin className="w-4 h-4 text-dtl-red shrink-0 mt-px" />
                <span>{address}</span>
              </li>
              <li className="flex items-start gap-2.5 text-[13px] leading-[1.5]">
                <Phone className="w-4 h-4 text-dtl-red shrink-0 mt-px" />
                <span>Hotline: <a href={`tel:${phoneRaw}`} className="text-white/80 transition-colors hover:text-white">{phone}</a></span>
              </li>
              <li className="flex items-start gap-2.5 text-[13px] leading-[1.5]">
                <Mail className="w-4 h-4 text-dtl-red shrink-0 mt-px" />
                <span><a href={`mailto:${email}`} className="text-white/80 transition-colors hover:text-white">{email}</a></span>
              </li>
            </ul>
            <div className="w-full h-[140px] rounded overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15693.755490659902!2d105.6558273!3d10.4654388!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x310a65faea134265%3A0xeab5baeabb1b3b24!2zNzE2IE5ndXnhu4VuIEh14buHLCBQaMaw4budbmcgTeG7uSBUcsOgLCBUUC4gQ2FvIEzDo25oLCDEkOG7k25nIFRow6FwLCBWaWV0bmFt!5e0!3m2!1sen!2s!4v1715717646545!5m2!1sen!2s"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Bản đồ địa chỉ công ty"
              />
            </div>
          </div>

        </div>

        {/* Hệ sinh thái thương hiệu */}
        <div className="border-t border-white/[0.07] py-7">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <p className="text-[11px] font-semibold text-white/50 leading-relaxed shrink-0 text-center sm:text-left sm:pr-7 sm:border-r sm:border-white/15">
              Hệ sinh thái<br className="hidden sm:block" />thương hiệu
            </p>
            <div className="flex items-center justify-center sm:justify-start flex-wrap gap-x-8 gap-y-3">
              {[
                { src: '/public/images/logo-gnest.svg',   alt: 'Gnest',   w: 301,  h: 236 },
                { src: '/public/images/logo-g-glass.svg', alt: 'G Glass', w: 301,  h: 236 },
                { src: '/public/images/logo-g-home.svg',  alt: 'G Home',  w: 151,  h: 141 },
                { src: '/public/images/logo-gmart.svg',   alt: 'G Mart',  w: 1049, h: 765 },
              ].map(({ src, alt, w, h }) => (
                <Image
                  key={alt}
                  src={src}
                  alt={alt}
                  width={w}
                  height={h}
                  className="h-[30px] w-auto [filter:brightness(0)_invert(1)] opacity-40 hover:opacity-95 hover:[filter:none] transition-all duration-300 cursor-pointer"
                  unoptimized
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between py-4 text-xs text-white/35 gap-4">
          <div>© 2025 {companyName}. MST: 1401969516. All rights reserved.</div>

          <div className="flex items-center gap-4">
            <Link
              href={user ? '/admin' : '/admin/login'}
              className="flex items-center gap-1.5 font-medium text-white/40 transition-colors hover:text-dtl-red"
            >
              <Settings className="w-3.5 h-3.5" />
              Khu vực quản trị
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
