'use client';

import React, { useState } from 'react';
import { Briefcase, Calendar, MapPin, DollarSign, ArrowLeft } from 'lucide-react';
import { RecruitmentClientActions } from '@/components/RecruitmentClientActions';

export interface MappedJob {
  id: string;
  title: string;
  slug: string;
  description: string;
  location: string;
  salary: string;
  sort_order: number;
}

interface RecruitmentJobsContainerProps {
  jobs: MappedJob[];
}

function formatJobDescription(description: string) {
  return description
    .replace(/<\/?(h1|h2|h3|h4|strong|b)[^>]*>/gi, '')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function RecruitmentJobsContainer({ jobs }: RecruitmentJobsContainerProps) {
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || '');
  const [view, setView] = useState<'list' | 'detail'>('list');

  const selectedJob = jobs.find((job) => job.id === selectedJobId) || jobs[0];

  const handleSelectJob = (id: string) => {
    setSelectedJobId(id);
    setView('detail');
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBackToList = () => {
    setView('list');
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Job List */}
      <div
        className={`${
          view === 'list' ? 'block' : 'hidden'
        } lg:block lg:col-span-7 space-y-5`}
      >
        <h2 className="text-xl font-bold text-dtl-navy flex items-center gap-2 mb-2">
          <Briefcase className="text-dtl-red w-5 h-5" /> Vị Trí Tuyển Dụng Mới Nhất
        </h2>

        <div className="space-y-4">
          {jobs.map((job) => {
            const isSelected = selectedJobId === job.id;
            return (
              <div
                key={job.id}
                onClick={() => handleSelectJob(job.id)}
                className={`block bg-white rounded-xl p-5 border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-dtl-navy ring-2 ring-dtl-navy/10 shadow-md translate-x-1.5'
                    : 'border-[#e2e5ea] hover:border-slate-300 hover:shadow-[0_12px_28px_rgba(27,58,107,0.1)] shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start gap-4 mb-2">
                  <h3
                    className={`font-extrabold text-[15px] transition-colors leading-snug ${
                      isSelected ? 'text-dtl-navy' : 'text-slate-800 hover:text-dtl-red'
                    }`}
                  >
                    {job.title}
                  </h3>
                  <span className="text-[11px] font-bold bg-green-50 text-green-700 py-0.5 px-2 rounded-full border border-green-200 shrink-0 select-none">
                    Tuyển gấp
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-400 mb-4">
                  Đại Tài Lợi • /tuyen-dung/{job.slug}
                </p>

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
                    <span>
                      Hạn nộp: <strong className="text-slate-700">Liên tục tuyển</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Toàn thời gian</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Job Detail */}
      {selectedJob && (
        <div
          className={`${
            view === 'detail' ? 'block' : 'hidden'
          } lg:block lg:col-span-5 lg:sticky lg:top-28 self-start`}
        >
          <div className="bg-white rounded-xl border border-[#e2e5ea] p-6">
            <button
              onClick={handleBackToList}
              className="lg:hidden flex items-center gap-2 text-xs font-bold text-dtl-navy mb-4 py-2 hover:text-dtl-red transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại danh sách
            </button>

            <div className="pb-4 border-b border-[#e2e5ea] mb-5">
              <h3 className="font-black text-base text-dtl-navy leading-snug mb-1">
                {selectedJob.title}
              </h3>
              <p className="text-xs font-bold text-dtl-red tracking-wide uppercase mt-1">
                Chi tiết vị trí tuyển dụng
              </p>
            </div>

            <div className="space-y-5">
              {selectedJob.description ? (
                <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed font-normal">
                  {formatJobDescription(selectedJob.description).map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic text-xs">Chưa có thông tin mô tả chi tiết.</p>
              )}

              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3.5 text-xs text-slate-500 flex flex-col gap-1 italic">
                <div>📍 Địa điểm: {selectedJob.location}</div>
                <div>💵 Thu nhập: {selectedJob.salary}</div>
              </div>

              <RecruitmentClientActions
                className="w-full bg-dtl-red text-white py-3 rounded-lg font-bold text-sm hover:bg-dtl-red-dark transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer"
                label="Ứng tuyển ngay vị trí này"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
