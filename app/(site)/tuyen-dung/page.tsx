'use client';

import { useModal } from '@/lib/context';
import { Briefcase, Calendar, MapPin, DollarSign, Send, Shield, Heart, Award, Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { getJobVacancies } from '@/lib/services/job-vacancies';

interface MappedJob {
  id: string;
  title: string;
  slug: string;
  description: string;
  location: string;
  salary: string;
  sort_order: number;
}

export default function TuyenDungPage() {
  const { openContactModal } = useModal();
  const [jobs, setJobs] = useState<MappedJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<MappedJob | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadJobs() {
      try {
        const data = await getJobVacancies();
        if (!isMounted) return;

        const mapped = data.map((j) => ({
          id: j.id,
          title: j.title,
          slug: j.slug,
          description: j.description || '',
          location: j.location || 'Đồng Tháp',
          salary: j.salary_range || 'Thỏa thuận',
          sort_order: j.sort_order,
        }));
        setJobs(mapped);
        if (mapped.length > 0) {
          setSelectedJob(mapped[0]);
        }
      } catch (err) {
        console.error('Failed to load job vacancies:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadJobs();
    return () => {
      isMounted = false;
    };
  }, []);

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

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin text-dtl-red mb-3" />
            <p className="text-xs font-semibold">Đang tải tin tuyển dụng...</p>
          </div>
        ) : (
          /* Job Listings & Detail view */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Job List */}
            {jobs.length === 0 ? (
              <div className="lg:col-span-12 bg-white rounded-xl border border-slate-100 p-12 text-center shadow-sm">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-dtl-navy mb-1.5">Chưa có vị trí tuyển dụng mới</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Hiện tại Đại Tài Lợi chưa có tin tuyển dụng mới. Bạn có thể nhấn nút &quot;Nộp Hồ Sơ Tự Do&quot; ở trên để gửi thông tin ứng tuyển trực tiếp.
                </p>
              </div>
            ) : (
              <>
                <div className="lg:col-span-7 space-y-5">
                  <h2 className="text-xl font-bold text-dtl-navy flex items-center gap-2 mb-2">
                    <Briefcase className="text-dtl-red w-5 h-5" /> Vị Trí Tuyển Dụng Mới Nhất
                  </h2>
                  
                  {jobs.map((job) => (
                    <div 
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className={`bg-white rounded-xl p-5 border cursor-pointer transition-all ${
                        selectedJob?.id === job.id 
                          ? 'border-dtl-red ring-2 ring-dtl-red/10 shadow-md translate-x-1.5' 
                          : 'border-slate-100 hover:border-slate-300 hover:shadow shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <h3 className="font-extrabold text-[15px] text-dtl-navy hover:text-dtl-red transition-colors leading-snug">{job.title}</h3>
                        <span className="text-[11px] font-bold bg-green-50 text-green-700 py-0.5 px-2 rounded-full border border-green-200 shrink-0 select-none">
                          Tuyển gấp
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-400 mb-4">Đại Tài Lợi • /tuyen-dung/{job.slug}</p>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{job.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-bold text-dtl-navy truncate">{job.salary}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Hạn nộp: <strong className="text-slate-700">Liên tục tuyển</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Toàn thời gian</span>
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
                        <p className="text-xs font-bold text-dtl-red tracking-wide uppercase mt-1">Chi tiết vị trí tuyển dụng</p>
                      </div>

                      <div className="space-y-5">
                        {selectedJob.description ? (
                          <div 
                            className="prose prose-slate max-w-none text-xs text-slate-600 leading-relaxed font-normal
                              [&_h3]:text-[13px] [&_h3]:font-bold [&_h3]:text-dtl-navy-dark [&_h3]:uppercase [&_h3]:tracking-widest [&_h3]:mb-2.5 [&_h3]:mt-4 [&_h3]:flex [&_h3]:items-center [&_h3]:gap-1.5
                              [&_p]:mb-2.5
                              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:mb-4"
                            dangerouslySetInnerHTML={{ __html: selectedJob.description }} 
                          />
                        ) : (
                          <p className="text-slate-400 italic text-xs">Chưa có thông tin mô tả chi tiết.</p>
                        )}

                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3.5 text-xs text-slate-500 flex flex-col gap-1 italic">
                          <div>📍 Địa điểm: {selectedJob.location}</div>
                          <div>💵 Thu nhập: {selectedJob.salary}</div>
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
                      <p className="text-xs max-w-xs mx-auto leading-relaxed">
                        Vui lòng nhấp chọn bất kỳ vị trí tuyển dụng nào ở danh sách bên cạnh để xem mô tả công việc, yêu cầu tuyển dụng và chế độ đãi ngộ chi tiết.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
