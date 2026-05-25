import { ShieldCheck, CircleDollarSign, Combine, Truck } from 'lucide-react';
import { Interactive3DTilt } from './Interactive3DTilt';

export function WhyUsSection() {
  const reasons = [
    { 
      icon: <ShieldCheck className="w-[30px] h-[30px] text-dtl-red" />, 
      title: 'Chất Lượng Đảm Bảo', 
      desc: 'Sản phẩm được kiểm tra chặt chẽ từng lô hàng, đáp ứng tiêu chuẩn chất lượng cao và yêu cầu của khách hàng' 
    },
    { 
      icon: <CircleDollarSign className="w-[30px] h-[30px] text-dtl-red" />, 
      title: 'Giá Cả Cạnh Tranh', 
      desc: 'Sản xuất và phân phối trực tiếp, không qua trung gian — giá tốt nhất cho đơn hàng số lượng lớn' 
    },
    { 
      icon: <Combine className="w-[30px] h-[30px] text-dtl-red" />, 
      title: 'Đa Dạng Mẫu Mã', 
      desc: 'Hàng trăm mẫu sản phẩm sẵn có, nhận sản xuất theo yêu cầu riêng và in thương hiệu của khách hàng' 
    },
    { 
      icon: <Truck className="w-[30px] h-[30px] text-dtl-red" />, 
      title: 'Giao Hàng Toàn Quốc', 
      desc: 'Phủ khắp 63 tỉnh thành, đóng gói cẩn thận, đảm bảo hàng đến nhanh và nguyên vẹn' 
    },
  ];

  return (
    <section className="py-9 bg-white" id="gioi-thieu">
      <div className="max-w-[1220px] mx-auto px-5">
        <div className="text-center mb-9">
          <h2 className="text-[28px] font-extrabold text-dtl-navy">Vì Sao Chọn Đại Tài Lợi?</h2>
          <p className="text-sm text-dtl-gray mt-2">Chúng tôi cam kết mang lại giá trị tốt nhất cho đối tác và khách hàng</p>
          <div className="w-12 h-[3px] bg-dtl-red mx-auto mt-3 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {reasons.map((reason, idx) => (
            <Interactive3DTilt key={idx} className="bg-white rounded-lg" maxTilt={10}>
              <div className="text-center py-5 px-4 border border-dtl-border rounded-lg transition-all hover:shadow-[0_6px_24px_rgba(0,0,0,0.09)] hover:border-dtl-red h-full flex flex-col justify-center items-center">
                <div className="w-16 h-16 bg-[#fef2f2] rounded-full flex items-center justify-center mx-auto mb-4 shrink-0">
                  {reason.icon}
                </div>
                <h3 className="text-[15px] font-bold text-dtl-navy mb-2">{reason.title}</h3>
                <p className="text-[13px] text-dtl-gray leading-[1.65]">{reason.desc}</p>
              </div>
            </Interactive3DTilt>
          ))}
        </div>
      </div>
    </section>
  );
}
