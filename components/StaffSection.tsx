'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Phone } from 'lucide-react';

import { SALE_CONTACTS } from '@/lib/data';
import { getSalesContacts } from '@/lib/services/sales-contacts';
import { Interactive3DTilt } from './Interactive3DTilt';

type StaffContact = {
  name: string;
  role?: string;
  phone: string;
  avatar?: string;
  cleanPhone: string;
};

export function StaffSection() {
  const [staff, setStaff] = useState<StaffContact[]>(
    SALE_CONTACTS.map((person) => ({
      name: person.name,
      role: person.role,
      phone: person.phone,
      avatar: person.avatar,
      cleanPhone: person.phone.replace(/\D/g, ''),
    }))
  );

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
            .slice(0, 4)
            .map((person) => ({
              name: person.name,
              role: person.role ?? 'Nhân viên kinh doanh',
              phone: person.phone!,
              avatar: person.avatar_url ?? undefined,
              cleanPhone: person.phone!.replace(/\D/g, ''),
            }))
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

  return (
    <section className="py-8 bg-dtl-bg-alt" id="lien-he">
      <div className="max-w-[1220px] mx-auto px-5">
        <div className="text-center mb-9">
          <h2 className="text-[28px] font-extrabold text-dtl-navy">Đội ngũ kinh doanh</h2>
          <p className="text-sm text-dtl-gray mt-2">Sẵn sàng tư vấn và hỗ trợ bạn từ Thứ 2 đến Thứ 7</p>
          <div className="w-12 h-[3px] bg-dtl-red mx-auto mt-3 rounded-full"></div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {staff.map((person, idx) => (
            <Interactive3DTilt key={idx} className="bg-white rounded-lg" maxTilt={10}>
              <div className="bg-white border border-dtl-border rounded-lg py-5 px-3 sm:py-6 sm:px-5 text-center flex flex-col items-center h-full">
                {person.avatar ? (
                  <div className="relative w-[54px] h-[54px] sm:w-[62px] sm:h-[62px] mx-auto mb-3 shrink-0 overflow-hidden rounded-full border border-dtl-border">
                    <Image
                      src={person.avatar}
                      alt={person.name.includes('CSKH') ? 'CSKH' : person.name}
                      fill
                      sizes="62px"
                      className="object-cover"
                      unoptimized={person.avatar.startsWith('http')}
                    />
                  </div>
                ) : (
                  <div className="w-[54px] h-[54px] sm:w-[62px] sm:h-[62px] bg-dtl-navy rounded-full mx-auto mb-3 flex items-center justify-center text-[18px] sm:text-[22px] font-extrabold text-white shrink-0">
                    {person.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
                  </div>
                )}
                <h4 className="text-[14px] sm:text-[15px] font-bold text-dtl-navy mb-1">{person.name}</h4>
                <div className="text-[11px] sm:text-[12px] text-dtl-gray mb-3 pb-3 border-b border-dtl-border w-full">
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
                <a
                  href={`https://zalo.me/${person.cleanPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex w-full items-center justify-center gap-1.5 sm:gap-2 bg-[#0068FF] text-white py-2 px-2 rounded transition-colors hover:bg-[#0057d9]"
                  aria-label={`Nhắn tin Zalo: ${person.phone}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.52 3.66 1.42 5.18L2 22l4.94-1.39A9.96 9.96 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm4.93 13.57c-.2.56-1.18 1.07-1.63 1.14-.42.06-.96.09-1.55-.1-.36-.11-.82-.27-1.41-.53-2.46-1.06-4.07-3.52-4.2-3.68-.12-.17-.98-1.3-.98-2.48 0-1.18.62-1.76.84-2 .22-.24.48-.3.64-.3h.46c.15 0 .35-.06.55.42.2.48.68 1.66.74 1.78.06.12.1.26.02.42-.08.16-.12.26-.24.4-.12.14-.25.3-.36.4-.12.12-.24.25-.1.49.14.24.62.98 1.33 1.59.92.8 1.7 1.05 1.94 1.17.24.12.38.1.52-.06.14-.16.6-.7.76-.94.16-.24.32-.2.54-.12.22.08 1.4.66 1.64.78.24.12.4.18.46.28.06.1.06.58-.14 1.14z"/>
                  </svg>
                  <span className="font-bold text-[11px] sm:text-[13px]">Chat Zalo</span>
                </a>
              </div>
            </Interactive3DTilt>
          ))}
        </div>
      </div>
    </section>
  );
}
