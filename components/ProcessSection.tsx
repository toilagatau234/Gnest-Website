export function ProcessSection() {
  const steps = [
    { num: 1, title: 'Tư Vấn & Báo Giá', desc: 'Tiếp nhận yêu cầu, tư vấn mẫu mã phù hợp và báo giá chi tiết miễn phí' },
    { num: 2, title: 'Xác Nhận Đơn Hàng', desc: 'Chốt mẫu, số lượng, thiết kế in ấn và ký kết hợp đồng' },
    { num: 3, title: 'Sản Xuất & Kiểm Tra', desc: 'Sản xuất theo đúng yêu cầu, kiểm tra chất lượng nghiêm ngặt từng lô hàng' },
    { num: 4, title: 'Giao Hàng Toàn Quốc', desc: 'Đóng gói cẩn thận, giao nhanh đến tận nơi trên toàn 63 tỉnh thành' },
  ];

  return (
    <section className="py-7 bg-white">
      <div className="max-w-[1220px] mx-auto px-5">
        <div className="flex items-stretch justify-between bg-dtl-navy mb-5 rounded-[3px] overflow-hidden">
          <div className="flex items-center gap-0 p-0">
            <div className="w-1.5 bg-dtl-red self-stretch shrink-0"></div>
            <h2 className="text-white text-[15px] font-bold uppercase tracking-wide px-5 py-[11px]">
              Quy Trình Làm Việc Được Chú Trọng
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-dtl-border border border-dtl-border rounded-md overflow-hidden">
          {steps.map((step, idx) => (
            <div key={idx} className="bg-white py-5 px-4 text-center relative md:after:content-['→'] md:after:absolute md:after:-right-2.5 md:after:top-1/2 md:after:-translate-y-1/2 md:after:text-dtl-border md:after:text-[20px] md:after:z-10 last:after:hidden">
              <div className="w-[46px] h-[46px] bg-dtl-red text-white flex items-center justify-center rounded-full text-lg font-extrabold mx-auto mb-3.5 shrink-0">
                {step.num}
              </div>
              <h3 className="text-[14px] font-bold text-dtl-navy mb-1.5">{step.title}</h3>
              <p className="text-xs text-dtl-gray leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
