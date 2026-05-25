import { Phone } from "lucide-react";
import { Interactive3DTilt } from "./Interactive3DTilt";

export function StaffSection() {
  const staff = [
    { name: 'Thu Hằng', abbr: 'TH', phone: '0859.10.52.72', cleanPhone: '0859105272' },
    { name: 'Yến Nhi', abbr: 'YN', phone: '0858.31.52.72', cleanPhone: '0858315272' },
    { name: 'Hồng Ngọc', abbr: 'HN', phone: '0853.11.52.72', cleanPhone: '0853115272' },
    { name: 'Hải Yến', abbr: 'HY', phone: '0918.96.52.72', cleanPhone: '0918965272' },
  ];

  return (
    <section className="py-8 bg-dtl-bg-alt" id="lien-he">
      <div className="max-w-[1220px] mx-auto px-5">
        <div className="text-center mb-9">
          <h2 className="text-[28px] font-extrabold text-dtl-navy">Đội Ngũ Kinh Doanh</h2>
          <p className="text-sm text-dtl-gray mt-2">Sẵn sàng tư vấn và hỗ trợ bạn từ Thứ 2 đến Thứ 7</p>
          <div className="w-12 h-[3px] bg-dtl-red mx-auto mt-3 rounded-full"></div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {staff.map((person, idx) => (
            <Interactive3DTilt key={idx} className="bg-white rounded-lg" maxTilt={10}>
              <div className="bg-white border border-dtl-border rounded-lg py-5 px-3 sm:py-6 sm:px-5 text-center flex flex-col items-center h-full">
                <div className="w-[54px] h-[54px] sm:w-[62px] sm:h-[62px] bg-dtl-navy rounded-full mx-auto mb-3 flex items-center justify-center text-[18px] sm:text-[22px] font-extrabold text-white shrink-0">
                  {person.abbr}
                </div>
                <h4 className="text-[14px] sm:text-[15px] font-bold text-dtl-navy mb-1">{person.name}</h4>
                <div className="text-[11px] sm:text-[12px] text-dtl-gray mb-3 pb-3 border-b border-dtl-border w-full">Nhân viên kinh doanh</div>
                <a href={`tel:${person.cleanPhone}`} className="flex w-full items-center justify-center gap-1.5 sm:gap-2 bg-dtl-red text-white py-2 px-2 rounded transition-colors hover:bg-dtl-red-dark" aria-label={`Gọi điện thoại: ${person.phone}`}>
                  <Phone className="w-4 h-4 sm:w-4 sm:h-4 shrink-0" strokeWidth={2.2} />
                  <span className="font-bold text-[11px] sm:text-[13px] truncate hidden min-[360px]:block">{person.phone}</span>
                </a>
                <a href={`https://zalo.me/${person.cleanPhone}`} target="_blank" rel="noopener noreferrer" className="block mt-3 w-20 h-20 sm:w-24 sm:h-24 mx-auto border border-dtl-border p-1 rounded overflow-hidden hover:border-dtl-navy transition-colors bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=https://zalo.me/${person.cleanPhone}`} alt={`QR Zalo ${person.name}`} loading="lazy" className="w-full h-full block" />
                </a>
                <div className="text-[10px] text-dtl-gray mt-1.5">Quét Zalo</div>
              </div>
            </Interactive3DTilt>
          ))}
        </div>
      </div>
    </section>
  );
}
