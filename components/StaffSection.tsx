'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Phone, ChevronLeft, ChevronRight, Headset, MessageCircle } from 'lucide-react';

import { SALE_CONTACTS } from '@/lib/data';
import { getSalesContacts } from '@/lib/services/sales-contacts';
import { Interactive3DTilt } from './Interactive3DTilt';

type StaffContact = {
  name: string;
  role?: string;
  phone: string;
  zalo?: string;
  avatar?: string;
  cleanPhone: string;
};

function normalizeZaloHref(zalo: string | null | undefined, cleanPhone: string) {
  const trimmed = zalo?.trim() ?? '';

  if (!trimmed) {
    return cleanPhone ? `https://zalo.me/${cleanPhone}` : undefined;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const digits = trimmed.replace(/\D/g, '');
  return digits ? `https://zalo.me/${digits}` : undefined;
}

function StaffAvatarFallback({ name }: { name: string }) {
  return (
    <div
      className="relative w-[54px] h-[54px] sm:w-[62px] sm:h-[62px] mx-auto mb-3 shrink-0 overflow-hidden rounded-full border border-[#DDE5F8] bg-gradient-to-br from-[#EEF4FF] via-white to-[#FFECEC] shadow-sm"
      aria-label={`Avatar mặc định của ${name}`}
      role="img"
    >
      <div className="absolute -right-3 -top-3 h-8 w-8 rounded-full bg-dtl-red/15" />
      <div className="absolute -bottom-4 -left-3 h-10 w-10 rounded-full bg-dtl-navy/10" />
      <div className="absolute inset-[7px] rounded-full bg-white/88 shadow-inner" />
      <div className="absolute inset-0 flex items-center justify-center text-dtl-navy">
        <Headset className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.2} />
      </div>
      <div className="absolute bottom-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#0068FF] text-white ring-2 ring-white">
        <MessageCircle className="h-2.5 w-2.5" strokeWidth={2.4} />
      </div>
    </div>
  );
}

function StaffCard({ person }: { person: StaffContact }) {
  const zaloHref = normalizeZaloHref(person.zalo, person.cleanPhone);

  return (
    <div className="bg-white border border-dtl-border rounded-lg py-5 px-3 sm:py-6 sm:px-5 text-center flex flex-col items-center h-full shadow-sm hover:shadow-md transition-shadow duration-200">
      {person.avatar ? (
        <div className="relative w-[54px] h-[54px] sm:w-[62px] sm:h-[62px] mx-auto mb-3 shrink-0 overflow-hidden rounded-full border border-dtl-border bg-slate-100">
          <Image
            src={person.avatar}
            alt={person.name.includes('CSKH') ? 'CSKH' : person.name}
            fill
            sizes="62px"
            className="object-cover"
            unoptimized={person.avatar.startsWith('http') || person.avatar.startsWith('data:')}
          />
        </div>
      ) : (
        <StaffAvatarFallback name={person.name} />
      )}
      <h4 className="text-[14px] sm:text-[15px] font-bold text-dtl-navy mb-1 line-clamp-1">{person.name}</h4>
      <div className="text-[11px] sm:text-[12px] text-dtl-gray mb-3 pb-3 border-b border-dtl-border w-full truncate">
        {person.role || 'Nhân viên kinh doanh'}
      </div>
      <a
        href={`tel:${person.cleanPhone}`}
        className="flex w-full items-center justify-center gap-1.5 sm:gap-2 bg-dtl-red text-white py-2 px-2 rounded transition-colors hover:bg-dtl-red-dark"
        aria-label={`Gọi điện thoại: ${person.phone}`}
      >
        <Phone className="w-4 h-4 sm:w-4 sm:h-4 shrink-0" strokeWidth={2.2} />
        <span className="font-bold text-[11px] sm:text-[13px] truncate hidden min-[360px]:block">
          {person.phone}
        </span>
      </a>
      {zaloHref ? (
        <a
          href={zaloHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex w-full items-center justify-center gap-1.5 sm:gap-2 bg-[#0068FF] text-white py-2 px-2 rounded transition-colors hover:bg-[#0057d9]"
          aria-label={`Nhắn tin Zalo: ${person.phone}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="shrink-0">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.52 3.66 1.42 5.18L2 22l4.94-1.39A9.96 9.96 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm4.93 13.57c-.2.56-1.18 1.07-1.63 1.14-.42.06-.96.09-1.55-.1-.36-.11-.82-.27-1.41-.53-2.46-1.06-4.07-3.52-4.2-3.68-.12-.17-.98-1.3-.98-2.48 0-1.18.62-1.76.84-2 .22-.24.48-.3.64-.3h.46c.15 0 .35-.06.55.42.2.48.68 1.66.74 1.78.06.12.1.26.02.42-.08.16-.12.26-.24.4-.12.14-.25.3-.36.4-.12.12-.24.25-.1.49.14.24.62.98 1.33 1.59.92.8 1.7 1.05 1.94 1.17.24.12.38.1.52-.06.14-.16.6-.7.76-.94.16-.24.32-.2.54-.12.22.08 1.4.66 1.64.78.24.12.4.18.46.28.06.1.06.58-.14 1.14z"/>
          </svg>
          <span className="font-bold text-[11px] sm:text-[13px] truncate">Chat Zalo</span>
        </a>
      ) : null}
    </div>
  );
}

export function StaffSection() {
  const [staff, setStaff] = useState<StaffContact[]>(
    SALE_CONTACTS.map((person) => {
      const cleanPhone = person.phone.replace(/\D/g, '');
      return {
        name: person.name,
        role: person.role,
        phone: person.phone,
        zalo: normalizeZaloHref(person.zalo, cleanPhone),
        avatar: person.avatar,
        cleanPhone,
      };
    })
  );

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);

      const children = scrollContainerRef.current.children;
      if (children.length > 0) {
        let nearestIndex = 0;
        let minDiff = Infinity;
        const containerRect = scrollContainerRef.current.getBoundingClientRect();
        const containerCenter = containerRect.left + containerRect.width / 2;

        for (let i = 0; i < children.length; i++) {
          const childRect = children[i].getBoundingClientRect();
          const childCenter = childRect.left + childRect.width / 2;
          const diff = Math.abs(childCenter - containerCenter);
          if (diff < minDiff) {
            minDiff = diff;
            nearestIndex = i;
          }
        }
        setActiveIndex(nearestIndex);
      }
    }
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
      checkScroll();
    }
    return () => {
      if (el) {
        el.removeEventListener('scroll', checkScroll);
      }
      window.removeEventListener('resize', checkScroll);
    };
  }, [staff]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const card = container.firstElementChild as HTMLElement;
      if (card) {
        const cardWidth = card.getBoundingClientRect().width;
        const gap = 24;
        const scrollAmount = direction === 'left' ? -(cardWidth + gap) : (cardWidth + gap);
        container.scrollBy({
          left: scrollAmount,
          behavior: 'smooth',
        });
      }
    }
  };

  const scrollToItem = (index: number) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const child = container.children[index] as HTMLElement;
      if (child) {
        child.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadStaff() {
      try {
        const contacts = await getSalesContacts();

        if (!isMounted || contacts.length === 0) {
          return;
        }

        setStaff(
          contacts
            .filter((person) => Boolean(person.phone))
            .map((person) => {
              const phone = person.phone!;
              const cleanPhone = phone.replace(/\D/g, '');
              return {
                name: person.name,
                role: person.role ?? 'Nhân viên kinh doanh',
                phone,
                zalo: normalizeZaloHref(person.zalo, cleanPhone),
                avatar: person.avatar_url ?? undefined,
                cleanPhone,
              };
            })
        );
      } catch {
        if (!isMounted) {
          return;
        }
      }
    }

    void loadStaff();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (staff.length < 5 || isPaused) return;

    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % staff.length;
      scrollToItem(nextIndex);
    }, 3000);

    return () => clearInterval(interval);
  }, [staff.length, activeIndex, isPaused]);

  const isSingle = staff.length === 1;
  const isCarousel = staff.length >= 5;

  return (
    <section className="py-8 bg-dtl-bg-alt overflow-hidden" id="lien-he">
      <div className="max-w-[1220px] mx-auto px-5 relative">
        <div className="text-center mb-9">
          <h2 className="text-[28px] font-extrabold text-dtl-navy">Đội ngũ kinh doanh</h2>
          <p className="text-sm text-dtl-gray mt-2">Sẵn sàng tư vấn và hỗ trợ bạn từ Thứ 2 đến Thứ 7</p>
          <div className="w-12 h-[3px] bg-dtl-red mx-auto mt-3 rounded-full"></div>
        </div>

        {isSingle ? (
          <div className="flex justify-center mt-8 w-full px-4">
            <div className="w-[300px] sm:w-[320px] shrink-0">
              <Interactive3DTilt className="bg-white rounded-lg h-full" maxTilt={10}>
                <StaffCard person={staff[0]} />
              </Interactive3DTilt>
            </div>
          </div>
        ) : isCarousel ? (
          <div 
            className="relative w-full group mt-8"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocus={() => setIsPaused(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) {
                setIsPaused(false);
              }
            }}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`hidden md:flex absolute -left-5 lg:-left-6 top-[45%] -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-white/95 text-dtl-navy border border-dtl-border shadow-md z-30 transition-all duration-200 cursor-pointer ${
                canScrollLeft
                  ? 'opacity-0 group-hover:opacity-100 hover:text-dtl-red hover:bg-white hover:scale-105 active:scale-95 pointer-events-auto'
                  : 'opacity-0 pointer-events-none'
              }`}
              aria-label="Xem nhân viên trước"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div
              ref={scrollContainerRef}
              className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-4 px-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {staff.map((person, idx) => (
                <div
                  key={idx}
                  className="w-[280px] sm:w-[250px] md:w-[260px] shrink-0 snap-center"
                >
                  <Interactive3DTilt className="bg-white rounded-lg h-full" maxTilt={10}>
                    <StaffCard person={person} />
                  </Interactive3DTilt>
                </div>
              ))}
            </div>

            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={`hidden md:flex absolute -right-5 lg:-right-6 top-[45%] -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-white/95 text-dtl-navy border border-dtl-border shadow-md z-30 transition-all duration-200 cursor-pointer ${
                canScrollRight
                  ? 'opacity-0 group-hover:opacity-100 hover:text-dtl-red hover:bg-white hover:scale-105 active:scale-95 pointer-events-auto'
                  : 'opacity-0 pointer-events-none'
              }`}
              aria-label="Xem nhân viên tiếp theo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="flex justify-center gap-2 mt-4">
              {staff.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToItem(index)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    index === activeIndex
                      ? 'w-6 bg-dtl-red'
                      : 'w-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label={`Xem nhân viên số ${index + 1}`}
                  aria-current={index === activeIndex ? 'true' : undefined}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-8">
            {staff.map((person, idx) => (
              <div
                key={idx}
                className="w-[calc(50%-8px)] sm:w-[240px] md:w-[260px] shrink-0"
              >
                <Interactive3DTilt className="bg-white rounded-lg h-full" maxTilt={10}>
                  <StaffCard person={person} />
                </Interactive3DTilt>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
