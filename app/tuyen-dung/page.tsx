'use client';

import { useModal } from '@/lib/context';
import { Briefcase, Calendar, MapPin, DollarSign, Send, Users, Shield, Heart, Award, Sparkles, Building2 } from 'lucide-react';
import React, { useState } from 'react';

interface JobVacancy {
  title: string;
  department: string;
  location: string;
  salary: string;
  type: string;
  deadline: string;
  requirements: string[];
  benefits: string[];
}

const VACANCIES: JobVacancy[] = [
  {
    title: 'Chuyên Viên Tư Vấn Bán Hàng (Sales Executive)',
    department: 'Mảng Kinh Doanh Bao Bì & Chai Lọ',
    location: '716 Nguyễn Huệ, P. Mỹ Trà, Đồng Tháp',
    salary: '7.000.000đ - 15.000.000đ (Lương cứng + % Doanh số)',
    type: 'Toàn thời gian cố định',
    deadline: '30/06/2026',
    requirements: [
      'Có tối thiểu 1 năm kinh nghiệm trong lĩnh vực sales, chăm sóc khách hàng hoặc ngành bao bì, hũ yến sào.',
      'Giao tiếp lưu loát, giọng nói dễ nghe, kỹ năng đàm phán thương lượng thuyết phục tốt.',
      'Nhanh nhẹn, có tinh thần trách nhiệm cao, chịu khó tìm kiếm và chăm sóc khách hàng đại lý.'
    ],
    benefits: [
      'Thu nhập không giới hạn dựa trên hiệu suất kinh doanh (Thưởng Tết, thưởng quý vượt trội).',
      'Được đào tạo bài bản về kiến thức hũ thủy tinh, bao bì và máy móc ngành yến sào.',
      'Đóng bảo hiểm BHXH, BHYT đầy đủ theo quy định của nhà nước.'
    ]
  },
  {
    title: 'Kỹ Thuật Viên Vận Hành Máy CNC Gỗ Công Nghiệp',
    department: 'Mảng Gia Công Sản Xuất CNC',
    location: 'Phân xưởng Gia công CNC Đồng Tháp',
    salary: '8.500.000đ - 13.000.000đ (Theo tay nghề)',
    type: 'Toàn thời gian cố định',
    deadline: '15/07/2026',
    requirements: [
      'Có kinh nghiệm vận hành máy CNC cắt khắc gỗ công nghiệp, MDF, mica tối thiểu 1 năm.',
      'Biết đọc bản vẽ kỹ thuật, sử dụng cơ bản các phần mềm thiết kế như AutoCAD, Aspire, ArtCAM.',
      'Cẩn thận, tỉ mỉ trong công việc, có sức khỏe tốt.'
    ],
    benefits: [
      'Phụ cấp ăn trưa tại xưởng, bảo hộ lao động đầy đủ.',
      'Thưởng tăng ca, thưởng năng suất vượt định mức hàng tháng.',
      'Môi trường làm việc thân thiện, chuyên nghiệp, máy móc đời mới.'
    ]
  },
  {
    title: 'Thiết Kế Đồ Họa Bao Bì & Logo Thương Hiệu',
    department: 'Mảng In Ấn & Thiết Kế Thương Hiệu',
    location: '716 Nguyễn Huệ, P. Mỹ Trà, Đồng Tháp',
    salary: '8.000.000đ - 12.000.000đ',
    type: 'Toàn thời gian (Có thể làm hybrid)',
    deadline: '20/06/2026',
    requirements: [
      'Sử dụng thành thạo Photoshop, Illustrator, Corel Draw.',
      'Có gu thẩm mỹ tốt, sáng tạo, ưu tiên ứng viên có kinh nghiệm thiết kế bao bì hộp quà yến sào, nhãn chai hũ.',
      'Kỹ năng làm việc nhóm tốt, chịu được áp lực tiến độ.'
    ],
    benefits: [
      'Chính sách thưởng nóng cho các dự án thiết kế logo, nhận diện thương hiệu xuất sắc.',
      'Cơ hội sở hữu portfolio đồ họa bao bì chất lượng hàng đầu ngành yến.',
      'Các chính sách phúc lợi sinh nhật, hiếu hỉ, du lịch hàng năm đầy đủ.'
    ]
  }
];

export default function TuyenDungPage() {
  const { openContactModal } = useModal();
  const [selectedJob, setSelectedJob] = useState<JobVacancy | null>(null);

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-[1220px] mx-auto px-5">
        
        {/* Banner Hero */}
        <div className="relative bg-gradient-to-r from-dtl-navy-dark to-[#1e3a75] text-white rounded-2xl overflow-hidden p-8 md:p-12 mb-10 shadow-md">
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M54 48c-2 0-3 1-3 3s1 3 3 3 3-1 3-3-1-3-3-3zM6 48c-2 0-3 1-3 3s1 3 3 3 3-1 3-3-1-3-3-3z\" fill=\"%23ffffff\" fill-opacity=\"1\" fill-rule=\"evenodd\"/%3E%3C/svg%3E')" }}></div>
          <div className="relative z-10 max-w-2xl">
            <span className="inline-block bg-dtl-red text-white text-[11px] font-bold tracking-widest px-3.5 py-1 rounded-full uppercase mb-4 shadow-[0_2px_8px_rgba(227,30,36,0.3)]">
              Gia nhập đội ngũ Đại Tài Lợi
            </span>
            <h1 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">CƠ HỘI PHÁT TRIỂN SỰ NGHIỆP</h1>
            <p className="text-white/80 text-[14px] md:text-[15px] leading-relaxed mb-6">
              Tại Đại Tài Lợi, chúng tôi tin rằng con người là tài sản quý giá nhất. Chúng tôi luôn chào đón những ứng viên tài năng, nhiệt huyết và khát khao khẳng định mình trong lĩnh vực sản xuất bao bì, chai lọ và dịch vụ kỹ thuật.
            </p>
            <button 
              onClick={openContactModal}
              className="bg-dtl-red hover:bg-dtl-red-dark transition-colors px-6 py-3 rounded-lg font-bold text-sm inline-flex items-center gap-2 shadow-lg"
            >
              <Send className="w-4 h-4" /> Nộp Hồ Sơ Tự Do
            </button>
          </div>
        </div>

        {/* Co-working Culture & Core Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: <Shield className="w-8 h-8 text-dtl-red" />, title: 'Môi Trường Chuyên Nghiệp', desc: 'Hệ thống quy chuẩn vận hành khoa học, trang thiết bị máy móc gia công và sản xuất tối tân hàng đầu.' },
            { icon: <Heart className="w-8 h-8 text-dtl-red" />, title: 'Chế Độ Đãi Ngộ Tốt', desc: 'Mức lương cạnh tranh, chính sách thưởng hiệu suất minh bạch, nghỉ lễ du lịch đầy đủ hàng năm.' },
            { icon: <Award className="w-8 h-8 text-dtl-red" />, title: 'Lộ Trình Thăng Tiến Rõ Ràng', desc: 'Độc lập phát huy sở trường, huấn luyện nâng cao kỹ năng và cơ hội thăng tiến lên các vị trí quản lý.' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div>
                <h3 className="font-bold text-[15px] text-dtl-navy mb-1.5">{item.title}</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Job Listings & Detail view */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Job List */}
          <div className="lg:col-span-7 space-y-5">
            <h2 className="text-xl font-bold text-dtl-navy flex items-center gap-2 mb-2">
              <Briefcase className="text-dtl-red w-5 h-5" /> Vị Trí Tuyển Dụng Mới Nhất
            </h2>
            
            {VACANCIES.map((job) => (
              <div 
                key={job.title}
                onClick={() => setSelectedJob(job)}
                className={`bg-white rounded-xl p-5 border cursor-pointer transition-all ${
                  selectedJob?.title === job.title 
                    ? 'border-dtl-red ring-2 ring-dtl-red/10 shadow-md translate-x-1.5' 
                    : 'border-slate-100 hover:border-slate-300 hover:shadow shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start gap-4 mb-2">
                  <h3 className="font-extrabold text-[15px] text-dtl-navy hover:text-dtl-red transition-colors">{job.title}</h3>
                  <span className="text-[11px] font-bold bg-green-50 text-green-700 py-0.5 px-2 rounded-full border border-green-200 shrink-0 select-none">
                    Hot Job
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 mb-4">{job.department}</p>
                
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{job.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-bold text-dtl-navy">{job.salary}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Hạn nộp: <strong className="text-slate-700">{job.deadline}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{job.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Job Details Sidebar Panel */}
          <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-slate-100 p-6 sticky top-28 self-start">
            {selectedJob ? (
              <div className="animate-[fade_0.2s_ease-out]">
                <div className="pb-4 border-b border-slate-100 mb-5">
                  <h3 className="font-black text-base text-dtl-navy leading-snug mb-1">{selectedJob.title}</h3>
                  <p className="text-xs font-bold text-dtl-red tracking-wide uppercase mt-1">{selectedJob.department}</p>
                </div>

                <div className="space-y-5">
                  <div>
                    <h4 className="text-xs font-bold text-dtl-navy-dark uppercase tracking-widest mb-2.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-dtl-red rounded-full"></span> Yêu Cầu Công Việc
                    </h4>
                    <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 leading-relaxed">
                      {selectedJob.requirements.map((req, i) => <li key={i}>{req}</li>)}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-dtl-navy-dark uppercase tracking-widest mb-2.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-dtl-red rounded-full"></span> Quyền Lợi Được Hưởng
                    </h4>
                    <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 leading-relaxed">
                      {selectedJob.benefits.map((ben, i) => <li key={i}>{ben}</li>)}
                    </ul>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3.5 text-xs text-slate-500 flex flex-col gap-1 italic">
                    <div>📍 Địa điểm: {selectedJob.location}</div>
                    <div>💵 Thu nhập: {selectedJob.salary}</div>
                    <div>⌛ Hạn nộp hồ sơ: {selectedJob.deadline}</div>
                  </div>

                  <button 
                    onClick={openContactModal}
                    className="w-full bg-dtl-red text-white py-3 rounded-lg font-bold text-sm hover:bg-dtl-red-dark transition-all shadow shadow-red-100 flex items-center justify-center gap-2 uppercase tracking-wide"
                  >
                    Ứng tuyển ngay vị trí này
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-slate-400">
                <Briefcase className="w-14 h-14 mx-auto mb-4 opacity-15" />
                <h3 className="font-bold text-dtl-navy mb-1.5">Chi Tiết Vị Trí Tuyển Dụng</h3>
                <p className="text-xs max-w-xs mx-auto leading-relaxed">Vui lòng nhấp chọn bất kỳ vị trí tuyển dụng nào ở danh sách bên cạnh để xem mô tả công việc, yêu cầu tuyển dụng và chế độ đãi ngộ chi tiết.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
