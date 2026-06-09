'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, MapPin, DollarSign, Search, Check, Shield } from 'lucide-react';

import { JobRowActions } from '@/components/admin/JobRowActions';
import { AdminSortableListDialog } from '@/components/admin/AdminSortableListDialog';
import { moveJobAction } from '@/app/admin/(dashboard)/jobs/actions';
import type { AdminJobVacancy } from '@/lib/services/admin/jobs';

interface JobsTableProps {
  jobs: AdminJobVacancy[];
  allJobs: AdminJobVacancy[];
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

function buildUrl(page: number) {
  if (page <= 1) return '/admin/jobs';
  return `/admin/jobs?page=${page}`;
}

function buildDescriptionPreview(description: string) {
  return description
    .replace(/<li[^>]*>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|section|h[1-6])>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`admin-badge ${active ? 'admin-status-active' : 'admin-status-muted'}`}>
      {active ? 'Đang mở tuyển' : 'Đã đóng tuyển'}
    </span>
  );
}

export function JobsTable({ jobs, allJobs, page, pageSize, pageCount, total }: JobsTableProps) {
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

  const reorderScopes = useMemo(
    () => [
      {
        id: 'jobs:global',
        label: 'Toàn bộ tin tuyển dụng',
        description: 'Kéo thả để thay đổi thứ tự hiển thị của toàn bộ danh sách tuyển dụng.',
        items: allJobs.map((job) => ({
          id: job.id,
          label: job.title,
          subtitle: `/${job.slug}`,
          meta: [job.location, job.salary_range].filter(Boolean).join(' • ') || 'Chưa cập nhật thông tin bổ sung',
          is_active: job.is_active,
        })),
      },
    ],
    [allJobs],
  );

  return (
    <div className="admin-card space-y-5 p-4 sm:p-6">
      <div className="flex flex-col justify-between gap-4 border-b border-[#EEF2F6] pb-4 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <h2 className="text-base font-extrabold text-[#202224]">Danh sách tin tuyển dụng</h2>
          <p className="mt-1 max-w-3xl text-xs font-medium leading-relaxed text-[#646464]">
            Xem trước, sửa đổi hoặc xóa các vị trí đang cần chiêu mộ nhân sự tại Đại Tài Lợi. {"Sắp xếp thứ tự bằng cách bấm nút 'Tùy chỉnh sắp xếp' ở góc trên."}
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <AdminSortableListDialog
            buttonLabel="Tùy chỉnh sắp xếp"
            title="Tùy chỉnh thứ tự tuyển dụng"
            description="Kéo thả các tin tuyển dụng để đổi thứ tự hiển thị trên website."
            successMessage="Đã cập nhật thứ tự hiển thị."
            errorMessage="Không thể cập nhật thứ tự hiển thị."
            scopes={reorderScopes}
            onSave={async (_scopeId, moves) => {
              for (const move of moves) {
                const res = await moveJobAction({
                  itemId: move.itemId,
                  beforeId: move.beforeId,
                  afterId: move.afterId,
                });
                if (!res.ok) {
                  return res;
                }
              }
              return { ok: true };
            }}
          />

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
      </div>

      {filteredJobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D8DEEC] bg-[#F7F9FB] px-6 py-16 text-center">
          <Briefcase className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <p className="text-sm font-extrabold text-[#202224]">Không tìm thấy tin tuyển dụng nào</p>
          <p className="mt-1 text-xs font-medium text-[#646464]">Thử đổi từ khóa tìm kiếm hoặc thêm tin tuyển dụng mới.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {filteredJobs.map((job, index) => {
            const displayIndex = (page - 1) * pageSize + index + 1;
            return (
            <article key={job.id} className="flex flex-col justify-between rounded-2xl border border-[#E5E7EF] bg-white p-5 shadow-sm transition hover:border-[#D8DEEC] hover:shadow-admin">
              <div>
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div className="shrink-0 rounded-xl bg-[#1B3A6B]/5 p-2.5 text-[#1B3A6B]">
                    <Briefcase className="h-5 w-5" />
                  </div>

                  <JobRowActions job={job} />
                </div>

                <h3 className="text-sm font-extrabold leading-snug text-slate-800">{job.title}</h3>
                <p className="mt-0.5 font-mono text-[10px] text-slate-400">/{job.slug}</p>

                <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-500">
                  {job.location ? (
                    <span className="flex items-center gap-1 rounded-lg border border-slate-200/40 bg-slate-50 px-2 py-1 text-[10px]">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-red-500" /> {job.location}
                    </span>
                  ) : null}

                  {job.salary_range ? (
                    <span className="flex items-center gap-1 rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-800">
                      <DollarSign className="h-3.5 w-3.5 shrink-0 text-emerald-600" /> {job.salary_range}
                    </span>
                  ) : null}
                </div>

                {job.description ? (
                  <p className="mt-4 line-clamp-3 text-xs font-normal leading-relaxed text-slate-600">
                    {buildDescriptionPreview(job.description)}
                  </p>
                ) : (
                  <p className="mt-4 text-xs italic text-slate-400">Chưa có thông tin mô tả chi tiết.</p>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[#EEF2F6] pt-3 text-[11px] font-medium text-[#646464]">
                <div className="flex items-center gap-2">
                  <StatusBadge active={job.is_active} />
                  <span className="admin-badge border-[#E5E7EF] bg-[#F7F9FB] text-[#646464]">
                    STT #{displayIndex}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-[0.12em] text-[#3749A6]">
                  <Shield className="h-3.5 w-3.5" /> Vacancy post
                </span>
              </div>
            </article>
          );
        })}
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
