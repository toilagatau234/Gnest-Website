'use client';

import React, { useState } from 'react';
import { Briefcase, MapPin, DollarSign, ArrowLeft } from 'lucide-react';
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

interface ParsedJobDescription {
  intro: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
}

function decodeHtml(html: string): string {
  if (typeof window === 'undefined') {
    return html
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
  }
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

function parseJobDescription(description: string | null | undefined): ParsedJobDescription {
  const result: ParsedJobDescription = {
    intro: '',
    responsibilities: [],
    requirements: [],
    benefits: [],
  };

  if (!description) return result;

  if (typeof window === 'undefined') {
    const introMatch = description.match(/<section[^>]*data-job-block=["']intro["'][^>]*><p>(.*?)<\/p>/i);
    if (introMatch) {
      result.intro = decodeHtml(introMatch[1]);
    }
    
    const extractList = (block: string) => {
      const regex = new RegExp(`<section[^>]*data-job-block=["']${block}["'][^>]*>.*?<ul>(.*?)<\/ul>`, 'i');
      const match = description.match(regex);
      if (match) {
        const liRegex = /<li>(.*?)<\/li>/gi;
        const items: string[] = [];
        let liMatch;
        while ((liMatch = liRegex.exec(match[1])) !== null) {
          items.push(decodeHtml(liMatch[1]));
        }
        return items;
      }
      return [];
    };

    result.responsibilities = extractList('responsibilities');
    result.requirements = extractList('requirements');
    result.benefits = extractList('benefits');

    if (!result.intro && result.responsibilities.length === 0 && result.requirements.length === 0 && result.benefits.length === 0) {
      result.responsibilities = description
        .replace(/<[^>]+>/g, '\n')
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);
    }
    return result;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(description, 'text/html');
    const sections = doc.querySelectorAll('section[data-job-block]');

    if (sections.length > 0) {
      const introNode = doc.querySelector('section[data-job-block="intro"]');
      if (introNode) {
        result.intro = introNode.textContent?.trim() || '';
      }

      const readList = (block: string) =>
        Array.from(doc.querySelectorAll(`section[data-job-block="${block}"] li`))
          .map((item) => item.textContent?.trim() ?? '')
          .filter(Boolean);

      result.responsibilities = readList('responsibilities');
      result.requirements = readList('requirements');
      result.benefits = readList('benefits');
    } else {
      const lines = description
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]+>/g, '')
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);
      result.responsibilities = lines;
    }
  } catch (e) {
    console.error('Error parsing description:', e);
  }

  return result;
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

  const selectedJobParsed = selectedJob ? parseJobDescription(selectedJob.description) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Job List */}
      <div
        className={`${
          view === 'list' ? 'block' : 'hidden'
        } lg:block lg:col-span-5 space-y-5`}
      >
        <h2 className="text-xl font-black text-dtl-navy flex items-center gap-2 mb-4">
          <Briefcase className="text-dtl-red w-5 h-5 shrink-0" /> Vị Trí Tuyển Dụng Mới Nhất
        </h2>

        <div className="space-y-4">
          {jobs.map((job) => {
            const isSelected = selectedJobId === job.id;
            
            return (
              <div
                key={job.id}
                onClick={() => handleSelectJob(job.id)}
                className={`bg-white rounded-xl p-5 border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-dtl-navy ring-2 ring-dtl-navy/10 shadow-md translate-x-1.5'
                    : 'border-[#e2e5ea] hover:border-slate-300 hover:shadow-[0_12px_28px_rgba(27,58,107,0.08)] shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start gap-3 mb-2">
                  <h3
                    className={`font-extrabold text-[15px] transition-colors leading-snug ${
                      isSelected ? 'text-dtl-navy' : 'text-slate-800 hover:text-dtl-red'
                    }`}
                  >
                    {job.title}
                  </h3>
                  <span className="text-[10px] font-bold bg-green-50 text-green-700 py-0.5 px-2 rounded-full border border-green-200 shrink-0 select-none">
                    Đang tuyển
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-slate-400 mb-4">
                  Đại Tài Lợi • /tuyen-dung/{job.slug}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{job.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-bold text-dtl-navy truncate">{job.salary}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Job Detail */}
      {selectedJob && selectedJobParsed && (
        <div
          className={`${
            view === 'detail' ? 'block' : 'hidden'
          } lg:block lg:col-span-7 lg:sticky lg:top-28 self-start`}
        >
          <div className="bg-white rounded-2xl border border-[#e2e5ea] p-6 md:p-8 shadow-sm">
            <button
              onClick={handleBackToList}
              className="lg:hidden flex items-center gap-2 text-xs font-bold text-dtl-navy mb-6 py-2 hover:text-dtl-red transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại danh sách
            </button>

            {/* Header / Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-[11px] font-extrabold tracking-wider bg-emerald-50 text-emerald-700 py-1 px-3 rounded-full border border-emerald-200 uppercase">
                Đang tuyển
              </span>
            </div>

            {/* Title */}
            <h1 className="font-black text-2xl md:text-3xl text-dtl-navy leading-tight mb-4">
              {selectedJob.title}
            </h1>

            {/* Metadata Badges Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-100 rounded-xl p-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                  <MapPin className="w-4 h-4 text-dtl-red" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Địa điểm</p>
                  <p className="text-xs font-bold text-slate-800">{selectedJob.location}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                  <DollarSign className="w-4 h-4 text-dtl-red" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mức lương</p>
                  <p className="text-xs font-bold text-slate-800">{selectedJob.salary}</p>
                </div>
              </div>
            </div>

            {/* Job Description Sections */}
            <div className="space-y-6 mb-8 text-[13px] md:text-sm text-slate-600 leading-relaxed">
              {/* Intro paragraph */}
              {selectedJobParsed.intro && (
                <div className="border-l-4 border-dtl-navy pl-4 py-1 italic bg-slate-50/50 rounded-r-lg text-slate-500 font-medium">
                  {selectedJobParsed.intro}
                </div>
              )}

              {/* Responsibilities */}
              {selectedJobParsed.responsibilities.length > 0 && (
                <div>
                  <h3 className="font-extrabold text-dtl-navy text-sm md:text-[15px] mb-2.5 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-dtl-red rounded-full shrink-0" />
                    Mô tả công việc
                  </h3>
                  <ul className="space-y-2 list-none pl-1">
                    {selectedJobParsed.responsibilities.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-dtl-red shrink-0 mt-1.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requirements */}
              {selectedJobParsed.requirements.length > 0 && (
                <div>
                  <h3 className="font-extrabold text-dtl-navy text-sm md:text-[15px] mb-2.5 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-dtl-red rounded-full shrink-0" />
                    Yêu cầu ứng viên
                  </h3>
                  <ul className="space-y-2 list-none pl-1">
                    {selectedJobParsed.requirements.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-dtl-red shrink-0 mt-1.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Benefits */}
              {selectedJobParsed.benefits.length > 0 && (
                <div>
                  <h3 className="font-extrabold text-dtl-navy text-sm md:text-[15px] mb-2.5 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-dtl-red rounded-full shrink-0" />
                    Quyền lợi được hưởng
                  </h3>
                  <ul className="space-y-2 list-none pl-1">
                    {selectedJobParsed.benefits.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-dtl-red shrink-0 mt-1.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Additional Recruitment Info Section */}
              <div>
                <h3 className="font-extrabold text-dtl-navy text-sm md:text-[15px] mb-2.5 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-dtl-red rounded-full shrink-0" />
                  Thông tin tuyển dụng
                </h3>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs space-y-2.5 text-slate-500 font-medium">
                  <p>📍 <strong className="text-slate-700">Nơi làm việc:</strong> {selectedJob.location}</p>
                  <p>💵 <strong className="text-slate-700">Mức lương:</strong> {selectedJob.salary}</p>
                  <p>✨ <strong className="text-slate-700">Trạng thái:</strong> Đang tiếp nhận hồ sơ ứng tuyển</p>
                </div>
              </div>
            </div>

            {/* Apply Button */}
            <div className="pt-4 border-t border-slate-100">
              <RecruitmentClientActions
                className="w-full bg-dtl-red text-white py-3.5 rounded-xl font-bold text-sm hover:bg-dtl-red-dark transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
                label="Ứng tuyển ngay"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
