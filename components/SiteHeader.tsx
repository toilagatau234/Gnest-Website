'use client';

import { Phone, Menu, X, ChevronDown, Award, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { SiteSearch } from './SiteSearch';
import { usePathname } from 'next/navigation';
import { useCategories } from '@/lib/categories-context';

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProductHovered, setIsProductHovered] = useState(false);
  const [activeSection, setActiveSection] = useState('trang-chu');
  const { categories } = useCategories();
  const pathname = usePathname();

  const productTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleProductEnter = () => {
    if (productTimeoutRef.current) clearTimeout(productTimeoutRef.current);
    setIsProductHovered(true);
  };

  const handleProductLeave = () => {
    productTimeoutRef.current = setTimeout(() => {
      setIsProductHovered(false);
    }, 150); // 150ms grace period to cross the gap
  };

  useEffect(() => {
    return () => {
      if (productTimeoutRef.current) clearTimeout(productTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section[id], div[id]');
      let current = '';
      sections.forEach(s => {
        const top = (s as HTMLElement).offsetTop;
        if (window.scrollY >= top - 100) current = s.id;
      });
      if (current) setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Group categories dynamically
  const productRoots = categories.filter(c => c.type === 'product' && !c.parentId);
  const serviceRoots = categories.filter(c => c.type === 'service');

  const getSubcategories = (parentId: string) => {
    return categories.filter(c => c.parentId === parentId);
  };

  const isActive = (href: string) => {
    if (href === '/' && pathname !== '/') return false;
    if (href === '/tuyen-dung' && pathname === '/tuyen-dung') return true;
    if (href.startsWith('/danh-muc') && pathname.startsWith('/danh-muc')) return true;
    if (pathname === '/' && href.startsWith('/#')) {
      return activeSection === href.substring(2);
    }
    if (pathname === '/' && href === '/') return activeSection === 'trang-chu';
    return false;
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]" id="trang-chu">
      {/* Main nav */}
      <div className="py-3 relative">
        <div className="max-w-[1220px] mx-auto px-5 flex items-center justify-between gap-5">
          {/* Logo */}
          <Link
            href="/"
            className="flex-shrink-0 flex items-center transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99]"
            aria-label="Đại Tài Lợi – Trang chủ"
          >
            <Image
              src="/images/logo-dtl.svg"
              alt="Đại Tài Lợi"
              width={900}
              height={690}
              className="h-[52px] md:h-[64px] w-auto"
              priority
              unoptimized
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <ul className="flex items-center gap-1.5">
              {/* Trang chủ */}
              <li>
                <Link 
                  href="/"
                  className={`px-3 py-2 rounded font-bold text-sm tracking-wide transition-colors ${
                    isActive('/') ? 'text-dtl-red' : 'text-dtl-dark hover:text-dtl-red'
                  }`}
                >
                  Trang chủ
                </Link>
              </li>

              {/* Giới thiệu */}
              <li>
                <Link 
                  href="/#gioi-thieu"
                  className={`px-3 py-2 rounded font-bold text-sm tracking-wide transition-colors ${
                    isActive('/#gioi-thieu') ? 'text-dtl-red' : 'text-dtl-dark hover:text-dtl-red'
                  }`}
                >
                  Giới thiệu
                </Link>
              </li>

              {/* Sản phẩm - MEGA DROPDOWN */}
              <li 
                className="relative"
                onMouseEnter={handleProductEnter}
                onMouseLeave={handleProductLeave}
              >
                <Link 
                  href="/danh-muc"
                  className={`px-3 py-2 rounded font-bold text-sm tracking-wide inline-flex items-center gap-1 transition-colors ${
                    pathname.startsWith('/danh-muc') && productRoots.some(r => pathname.includes(r.id)) ? 'text-dtl-red' : 'text-dtl-dark hover:text-dtl-red'
                  }`}
                >
                  Sản phẩm <ChevronDown className="w-3.5 h-3.5" />
                </Link>

                {/* Products Mega Menu flyout */}
                {isProductHovered && (
                  <div className="absolute top-full left-1/2 -translate-x-[40%] bg-white shadow-[0_16px_48px_rgba(0,0,0,0.14)] w-[900px] border border-slate-100 rounded-xl p-6 grid grid-cols-5 gap-5 z-50 text-left border-t-4 border-t-dtl-red mt-2 animate-[slideUp_0.15s_ease-out]">
                    {productRoots.map(root => {
                      const subs = getSubcategories(root.id);
                      return (
                        <div key={root.id} className="flex flex-col">
                          <Link 
                            href={`/danh-muc/${root.id}`}
                            className="font-black text-xs text-dtl-navy uppercase tracking-wider pb-2 border-b border-slate-100 hover:text-dtl-red transition-colors mb-2"
                          >
                            {root.title}
                          </Link>
                          {subs.length > 0 ? (
                            <ul className="space-y-1.5">
                              {subs.map(sub => (
                                <li key={sub.id}>
                                  <Link 
                                    href={`/danh-muc/${sub.id}`}
                                    className="text-[13px] font-medium text-slate-600 hover:text-dtl-red hover:translate-x-0.5 transition-all block"
                                  >
                                    • {sub.title}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="text-[11px] text-dtl-gray italic">Hàng có sẵn sỉ & lẻ</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </li>

              {/* Dịch vụ */}
              <li>
                <Link 
                  href="/#dich-vu"
                  className={`px-3 py-2 rounded font-bold text-sm tracking-wide transition-colors ${
                    isActive('/#dich-vu') ? 'text-dtl-red' : 'text-dtl-dark hover:text-dtl-red'
                  }`}
                >
                  Dịch vụ
                </Link>
              </li>

              {/* Tuyển dụng */}
              <li>
                <Link 
                  href="/tuyen-dung"
                  className={`px-3 py-2 rounded font-bold text-sm tracking-wide transition-colors ${
                    isActive('/tuyen-dung') ? 'text-dtl-red' : 'text-dtl-dark hover:text-dtl-red'
                  }`}
                >
                  Tuyển dụng
                </Link>
              </li>

              {/* Liên hệ */}
              <li>
                <Link 
                  href="/#lien-he"
                  className={`px-3 py-2 rounded font-bold text-sm tracking-wide transition-colors ${
                    isActive('/#lien-he') ? 'text-dtl-red' : 'text-dtl-dark hover:text-dtl-red'
                  }`}
                >
                  Liên hệ
                </Link>
              </li>
            </ul>
          </nav>

          {/* Header CTA icons */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <SiteSearch />
            <a href="tel:0939991551" className="flex items-center gap-[7px] bg-dtl-red text-white px-[18px] py-[9px] rounded font-bold text-sm whitespace-nowrap transition-all hover:bg-dtl-red-dark hover:-translate-y-px">
              <Phone className="w-4 h-4 text-white" strokeWidth={2.2} />
              <span className="hidden sm:inline">0939.991.551</span>
            </a>
            <button 
              className="md:hidden flex items-center justify-center p-1"
              onClick={toggleMenu}
              aria-label="Mở menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="w-6 h-6 text-dtl-dark" /> : <Menu className="w-6 h-6 text-dtl-dark" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu container */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white max-h-[calc(100vh-120px)] overflow-y-auto px-5 py-4 space-y-4 animate-[slideDown_0.2s_ease-out]">
          <nav className="flex flex-col gap-4">
            <Link 
              href="/" 
              onClick={() => setIsMenuOpen(false)}
              className="font-bold text-sm text-slate-800 hover:text-dtl-red border-b border-dashed border-slate-100 pb-2"
            >
              Trang chủ
            </Link>
            <Link 
              href="/#gioi-thieu" 
              onClick={() => setIsMenuOpen(false)}
              className="font-bold text-sm text-slate-800 hover:text-dtl-red border-b border-dashed border-slate-100 pb-2"
            >
              Giới thiệu
            </Link>
            
            {/* Mobile Sản phẩm section */}
            <div className="space-y-2">
              <div className="font-extrabold text-xs text-dtl-navy uppercase tracking-wider pb-1 flex items-center justify-between">
                Sản phẩm
                <span className="text-[10px] bg-slate-100 py-0.5 px-2 rounded-full font-bold">CHI TIẾT</span>
              </div>
              <div className="pl-3.5 space-y-3.5 border-l border-slate-100">
                {productRoots.map(root => {
                  const subs = getSubcategories(root.id);
                  return (
                    <div key={root.id} className="space-y-1.5">
                      <Link 
                        href={`/danh-muc/${root.id}`}
                        onClick={() => setIsMenuOpen(false)}
                        className="font-bold text-[13px] text-dtl-red block"
                      >
                        {root.title}
                      </Link>
                      {subs.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 pl-2">
                          {subs.map(sub => (
                            <Link 
                              key={sub.id}
                              href={`/danh-muc/${sub.id}`}
                              onClick={() => setIsMenuOpen(false)}
                              className="text-[12px] font-medium text-slate-600 hover:text-dtl-red"
                            >
                              • {sub.title}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <Link 
              href="/#dich-vu" 
              onClick={() => setIsMenuOpen(false)}
              className="font-bold text-sm text-slate-800 hover:text-dtl-red border-b border-dashed border-slate-100 pb-2"
            >
              Dịch vụ
            </Link>

            <Link 
              href="/tuyen-dung" 
              onClick={() => setIsMenuOpen(false)}
              className="font-bold text-sm text-slate-800 hover:text-dtl-red border-b border-dashed border-slate-100 pb-2"
            >
              Tuyển dụng
            </Link>
            
            <Link 
              href="/#lien-he" 
              onClick={() => setIsMenuOpen(false)}
              className="font-bold text-sm text-slate-800 hover:text-dtl-red pb-1"
            >
              Liên hệ
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
