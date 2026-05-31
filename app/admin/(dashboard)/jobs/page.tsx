'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Briefcase, MapPin, DollarSign, ArrowUpRight, GraduationCap, Search } from 'lucide-react';

interface JobVacancy {
  id: string;
  title: string;
  slug: string;
  location: string;
  salary: string;
  description: string;
  requirements: string[];
  is_active: boolean;
}

const mockJobs: JobVacancy[] = [
  {
    id: 'j-1',
    title: 'Nhân Viên Vận Hành Xưởng Sản Xuất Thủy Tinh',
    slug: 'van-hanh-xuong-san-xuat',
    location: 'Xưởng Bình Chánh, TP.HCM',
    salary: '8.5 - 12 Triệu',
    description: 'Vận hành trực tiếp lò đúc và kiểm định chất lượng hũ thủy tinh thành phẩm theo lô. Đảm bảo đúng định mức kỹ thuật quy định.',
    requirements: [
      'Có kinh nghiệm làm việc tại xưởng đúc hoặc lò thủy tinh tối thiểu 1 năm',
      'Đủ sức khỏe lao động, sẵn sàng làm ca xoay'
    ],
    is_active: true
  },
  {
    id: 'j-2',
    title: 'Nhân Viên Kinh Doanh Phát Triển Đại Lý Sỉ (B2B)',
    slug: 'kinh-doanh-dai-ly-sỉ',
    location: 'Văn Phòng Quận 6, TP.HCM',
    salary: '10 - 25 Triệu (Lương cứng + % hoa hồng)',
    description: 'Chăm sóc nguồn khách hàng đại lý có sẵn và mở rộng tìm kiếm đại lý phân phối thủy tinh gia dụng, hũ thực phẩm khu vực miền Tây.',
    requirements: [
      'Giao tiếp tốt, chịu khó đi công tác tỉnh ngắn ngày',
      'Ưu tiên ứng viên có kinh nghiệm sales ngành hàng tiêu dùng nhanh (FMCG) hoặc thủy tinh'
    ],
    is_active: true
  }
];

export default function JobsPage() {
  const [searchText, setSearchText] = useState('');
  const [jobs, setJobs] = useState<JobVacancy[]>(mockJobs);

  const filteredJobs = jobs.filter(j =>
    j.title.toLowerCase().includes(searchText.toLowerCase()) ||
    j.location.toLowerCase().includes(searchText.toLowerCase()) ||
    j.description.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1B3A6B]">Tin Tuyển Dụng Đang Đăng</h2>
          <p className="text-xs text-slate-500 mt-1">
            Quản trị vị trí ứng tuyển hiển thị trên trang /tuyen-dung ngoài client. Hút nhân tài cho Đại Tài Lợi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm vị trí..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="bg-[#F7F9FB] border border-[#E2E8F0] rounded-xl pl-8 pr-3 py-1.5 text-xs w-48 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] text-slate-700"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
          </div>

          <button
            onClick={() => alert('Thao tác tuyển dụng CRUD đầy đủ sẽ được bổ sung ở phase riêng.')}
            className="bg-[#1B3A6B] text-white hover:bg-[#112546] transition-all text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Đăng tin mới
          </button>
        </div>
      </div>

      {/* Grid structure for career vacancies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredJobs.map((job) => (
          <div key={job.id} className="bg-white hover:border-slate-350 border border-[#E2E8F0] rounded-2xl p-5 shadow-xs relative group transition-all hover:shadow-md flex flex-col justify-between">
            <div>
              
              {/* Header icons info */}
              <div className="flex justify-between items-start gap-4 mb-3">
                <div className="p-2.5 bg-[#1B3A6B]/5 text-[#1B3A6B] rounded-xl">
                  <Briefcase className="w-5 h-5" />
                </div>
                
                <button 
                  onClick={() => alert('Chỉnh sửa thông tin tuyển dụng ở chế độ visual mockup.')}
                  className="p-1.5 bg-white text-slate-500 hover:text-slate-800 rounded-lg shadow-xs border border-slate-200 hover:border-slate-350 transition-all opacity-80 group-hover:opacity-100"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Title & metadata */}
              <h3 className="font-bold text-slate-850 text-sm">{job.title}</h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">/{job.slug}</p>

              {/* Badges and loc and wage info */}
              <div className="flex flex-wrap gap-2.5 mt-3 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/40 text-[10px]">
                  <MapPin className="w-3.5 h-3.5 text-red-500" /> {job.location}
                </span>

                <span className="flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2 py-1 rounded-lg border border-emerald-100 text-[10px] font-bold">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600 animate-pulse" /> {job.salary}
                </span>
              </div>

              {/* Description preview */}
              <p className="text-slate-600 text-xs mt-4 leading-relaxed font-normal">{job.description}</p>

              {/* Requirements sample tags */}
              <div className="mt-4 pt-3 border-t border-slate-200/40 space-y-1.5">
                <p className="text-[10px] font-bold text-[#1B3A6B] uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-[#1B3A6B]" /> Yêu Cầu Tóm Tắt:
                </p>
                <ul className="list-disc list-inside text-[10px] text-slate-500 pl-1 space-y-0.5">
                  {job.requirements.map((req, rIdx) => (
                    <li key={rIdx}>{req}</li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Status footer button inside card */}
            <div className="mt-5 pt-3 border-t border-slate-200/40 flex items-center justify-between text-[11px]">
              <span className={`px-2.5 py-0.5 rounded-md font-bold ${
                job.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
              }`}>
                {job.is_active ? 'Đang mở tuyển' : 'Đã đóng tuyển'}
              </span>

              <span 
                className="text-[10px] font-semibold text-slate-400 flex items-center gap-0.5 hover:underline cursor-pointer"
                onClick={() => alert('Chỉnh sửa thông tin tuyển dụng ở chế độ visual mockup.')}
              >
                Chỉnh sửa đầy đủ <ArrowUpRight className="w-3 h-3 text-[#E31E24]" />
              </span>
            </div>

          </div>
        ))}

        {filteredJobs.length === 0 && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600 font-bold text-sm">Không tìm thấy vị trí tuyển dụng nào</p>
            <p className="text-slate-400 text-xs">Vui lòng thay đổi từ khóa tìm kiếm tuyển dụng của bạn.</p>
          </div>
        )}
      </div>
    </div>
  );
}
