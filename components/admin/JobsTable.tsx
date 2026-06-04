'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, MapPin, DollarSign, Search, Check, Shield } from 'lucide-react';

import { JobRowActions } from '@/components/admin/JobRowActions';
import type { AdminJobVacancy } from '@/lib/services/admin/jobs';

interface JobsTableProps {
  jobs: AdminJobVacancy[];
  page: number;
  pageCount: number;
  total: number;
}

function buildUrl(page: number) {
  if (page <= 1) return '/admin/jobs';
  return `/admin/jobs?page=${page}`;
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`admin-badge ${active ? 'admin-status-active' : 'admin-status-muted'}`}>
      {active ? 'Đang mở tuyển' : 'Đã đóng tuyển'}
    </span>
  );
}

export function JobsTable({ jobs, page, pageCount, total }: JobsTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const filteredJobs = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();

    if (!normalized) {
      return jobs;
    }

    return jobs.filter((job) => {
      return [job.title, job.slug, job.location, job.salary_range, job.description]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalized));
    });
  }, [jobs, deferredQuery]);

  return (
    <div className="admin-card space-y-5 p-4 sm:p-6">
      <div className="flex flex-col justify-between gap-4 border-b border-[#EEF2F6] pb-4 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <h2 className="text-base font-extrabold text-[#202224]">Danh sách tin tuyển dụng</h2>
          <p className="mt-1 max-w-3xl text-xs font-medium leading-relaxed text-[#646464]">
            Xem trước, sửa đổi hoặc xóa các vị trí đang cần chiêu mộ nhân sự tại Đại Tài Lợi.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="search"
            placeholder="Tìm theo chức danh, địa điểm, mức lương..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="admin-input h-9 pl-9 text-xs"
          />
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D8DEEC] bg-[#F7F9FB] px-6 py-16 text-center">
          <Briefcase className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <p className="text-sm font-extrabold text-[#202224]">Không tìm thấy tin tuyển dụng nào</p>
          <p className="mt-1 text-xs font-medium text-[#646464]">Thử đổi từ khóa tìm kiếm hoặc thêm tin tuyển dụng mới.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {filteredJobs.map((job) => (
            <article key={job.id} className="rounded-2xl border border-[#E5E7EF] bg-white p-5 shadow-sm transition hover:border-[#D8DEEC] hover:shadow-admin flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div className="p-2.5 bg-[#1B3A6B]/5 text-[#1B3A6B] rounded-xl shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  
                  <JobRowActions job={job} />
                </div>

                <h3 className="text-sm font-extrabold text-slate-800 leading-snug">{job.title}</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">/{job.slug}</p>

                <div className="flex flex-wrap gap-2 mt-3 text-xs text-slate-500 font-medium">
                  {job.location ? (
                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/40 text-[10px]">
                      <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" /> {job.location}
                    </span>
                  ) : null}

                  {job.salary_range ? (
                    <span className="flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2 py-1 rounded-lg border border-emerald-100 text-[10px] font-bold">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> {job.salary_range}
                    </span>
                  ) : null}
                </div>

                {job.description ? (
                  <div 
                    className="prose prose-sm max-w-none text-slate-600 text-xs mt-4 leading-relaxed font-normal line-clamp-3 
                      [&_h3]:text-xs [&_h3]:font-bold [&_p]:mb-1 [&_ul]:list-disc [&_ul]:pl-4 [&_li]:text-slate-500"
                    dangerouslySetInnerHTML={{ __html: job.description }} 
                  />
                ) : (
                  <p className="text-slate-400 italic text-xs mt-4">Chưa có thông tin mô tả chi tiết.</p>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-[#EEF2F6] flex flex-wrap gap-2 items-center justify-between text-[11px] font-medium text-[#646464]">
                <div className="flex items-center gap-2">
                  <StatusBadge active={job.is_active} />
                  <span className="admin-badge border-[#E5E7EF] bg-[#F7F9FB] text-[#646464]">
                    Thứ tự #{job.sort_order}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-[0.12em] text-[#3749A6]">
                  <Shield className="h-3.5 w-3.5" /> Vacancy post
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-2xl border border-[#E5E7EF] bg-[#F7F9FB] p-3.5 text-[11px] font-medium text-[#646464] sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-emerald-600" />
          Dữ liệu tuyển dụng được đồng bộ từ Supabase.
        </p>
        <span className="font-bold text-[#3749A6]">{total} tin tuyển dụng</span>
      </div>

      {pageCount > 1 ? (
        <div className="flex items-center justify-between border-t border-[#EEF2F6] pt-4">
          <span className="text-sm text-slate-500">
            Trang {page} / {pageCount}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => router.push(buildUrl(page - 1))}
              className="admin-focus inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E5E7EF] px-3 text-sm font-medium text-slate-700 transition-colors hover:border-[#4880FF] hover:text-[#3749A6] disabled:pointer-events-none disabled:opacity-40"
            >
              ← Trước
            </button>
            <button
              type="button"
              disabled={page >= pageCount}
              onClick={() => router.push(buildUrl(page + 1))}
              className="admin-focus inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E5E7EF] px-3 text-sm font-medium text-slate-700 transition-colors hover:border-[#4880FF] hover:text-[#3749A6] disabled:pointer-events-none disabled:opacity-40"
            >
              Tiếp →
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
