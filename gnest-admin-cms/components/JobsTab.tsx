'use client';

import React from 'react';
import { Plus, Edit2, Briefcase, MapPin, DollarSign, ArrowUpRight, GraduationCap } from 'lucide-react';
import { JobVacancy } from '@/lib/mock-data';

interface JobsTabProps {
  jobs: JobVacancy[];
  onOpenDrawer: (type: string, data?: any) => void;
  searchText: string;
}

export default function JobsTab({
  jobs,
  onOpenDrawer,
  searchText
}: JobsTabProps) {

  const filteredJobs = jobs.filter(j =>
    j.title.toLowerCase().includes(searchText.toLowerCase()) ||
    j.location.toLowerCase().includes(searchText.toLowerCase()) ||
    j.description.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-100 mb-6">
        <div>
          <h2 className="text-base font-bold text-[#1B3A6B]">Tin Tuyển Dụng Đang Đăng</h2>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Quản trị vị trí ứng tuyển hiển thị trên trang /tuyen-dung ngoài client. Hút nhân tài cho Đại Tài Lợi.
          </p>
        </div>

        <button
          onClick={() => onOpenDrawer('job_add')}
          className="bg-[#1B3A6B] text-white hover:bg-[#112546] transition-all text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 max-w-max"
        >
          <Plus className="w-4 h-4" /> Đăng tin tuyển dụng
        </button>
      </div>

      {/* Grid structure for career vacancies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredJobs.map((job) => (
          <div key={job.id} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200/60 rounded-2xl p-5 shadow-xs relative group transition-all hover:shadow-md flex flex-col justify-between">
            <div>
              
              {/* Header icons info */}
              <div className="flex justify-between items-start gap-4 mb-3">
                <div className="p-2.5 bg-[#1B3A6B]/5 text-[#1B3A6B] rounded-xl">
                  <Briefcase className="w-5 h-5" />
                </div>
                
                <button 
                  onClick={() => onOpenDrawer('job_edit', job)}
                  className="p-1.5 bg-white text-slate-500 hover:text-slate-800 rounded-lg shadow-xs border border-slate-100 hover:border-slate-200 transition-all opacity-80 group-hover:opacity-100"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Title & metadata */}
              <h3 className="font-bold text-slate-800 text-sm">{job.title}</h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">/{job.slug}</p>

              {/* Badges and loc and wage info */}
              <div className="flex flex-wrap gap-2.5 mt-3 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200/40 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-red-500" /> {job.location}
                </span>

                <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200/40 text-[11px] font-bold text-emerald-700">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> {job.salary}
                </span>
              </div>

              {/* Description preview */}
              <p className="text-slate-600 text-xs mt-4 leading-relaxed font-normal">{job.description}</p>

              {/* Requirements sample tags */}
              <div className="mt-4 pt-3 border-t border-slate-200/40 space-y-1.5">
                <p className="text-[10px] font-bold text-[#1B3A6B] uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-[#1B3A6B]" /> Yêu Cầu Công Việc Bản Tóm Lược:
                </p>
                <ul className="list-disc list-inside text-[10px] text-slate-500 pl-1 space-y-0.5">
                  {job.requirements.slice(0, 2).map((req, rIdx) => (
                    <li key={rIdx}>{req}</li>
                  ))}
                  {job.requirements.length > 2 && <li>...và {job.requirements.length - 2} điều khoản khác</li>}
                </ul>
              </div>

            </div>

            {/* Status footer button inside card */}
            <div className="mt-5 pt-3 border-t border-slate-200/40 flex items-center justify-between text-[11px]">
              <span className={`px-2.5 py-0.5 rounded-md font-bold ${
                job.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
              }`}>
                {job.is_active ? 'Đang tuyển (Active)' : 'Đã đóng tuyển'}
              </span>

              <span className="text-[10px] font-medium text-slate-400 flex items-center gap-0.5 hover:underline cursor-pointer"
                    onClick={() => onOpenDrawer('job_edit', job)}>
                Chỉnh sửa đầy đủ quyền lợi <ArrowUpRight className="w-3 h-3 text-[#E31E24]" />
              </span>
            </div>

          </div>
        ))}

        {filteredJobs.length === 0 && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600 font-bold text-sm">Không tìm thấy vị trí ứng tuyển nào</p>
            <p className="text-slate-400 text-xs">Vui lòng thay đổi từ khóa tìm kiếm tuyển dụng của bạn.</p>
          </div>
        )}
      </div>

    </div>
  );
}
