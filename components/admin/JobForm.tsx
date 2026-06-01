'use client';

import { AlertCircle, Link2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { AdminToggle } from '@/components/admin/AdminToggle';
import type { AdminJobVacancy } from '@/lib/services/admin/jobs';
import type { AdminFormState } from '@/app/admin/(dashboard)/jobs/actions';

interface JobFormProps {
  formId: string;
  formAction: (payload: FormData) => void;
  state: AdminFormState;
  job?: AdminJobVacancy;
}

const fieldClass = 'admin-input text-xs';
const labelClass = 'mb-1.5 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-[#646464]';

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars (except -)
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start
    .replace(/-+$/, ''); // Trim - from end
}

export function JobForm({ formId, formAction, state, job }: JobFormProps) {
  const [title, setTitle] = useState(job?.title ?? '');
  const [slug, setSlug] = useState(job?.slug ?? '');
  const [isSlugManual, setIsSlugManual] = useState(Boolean(job?.slug));

  return (
    <form id={formId} action={formAction} className="space-y-5">
      {job ? <input type="hidden" name="id" value={job.id} /> : null}

      {state.error ? (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-[#FFF5F5] px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#E31E24]" />
          <p className="text-xs font-medium text-[#B42318]">{state.error}</p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className={labelClass}>
            Tiêu đề tuyển dụng <span className="text-[#E31E24]">*</span>
          </span>
          <input
            name="title"
            type="text"
            required
            value={title}
            onChange={(e) => {
              const val = e.target.value;
              setTitle(val);
              if (!isSlugManual && !job) {
                setSlug(slugify(val));
              }
            }}
            className={fieldClass}
            placeholder="VD: Chuyên Viên Tư Vấn Bán Hàng (Sales Executive)"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className={labelClass}>
            Đường dẫn (Slug) <span className="text-[#E31E24]">*</span>
          </span>
          <div className="relative">
            <input
              name="slug"
              type="text"
              required
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setIsSlugManual(true);
              }}
              className={`${fieldClass} pr-10`}
              placeholder="sales-executive"
            />
            <Link2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
          <span className="mt-1.5 block text-[10px] font-medium text-slate-400 leading-relaxed">
            Đường dẫn duy nhất cho tin tuyển dụng (ví dụ: `https://gnest.vn/tuyen-dung/sales-executive`). Nhập tiêu đề để tự động tạo slug.
          </span>
        </label>

        <label className="block">
          <span className={labelClass}>Địa điểm làm việc</span>
          <input
            name="location"
            type="text"
            defaultValue={job?.location ?? ''}
            className={fieldClass}
            placeholder="VD: 716 Nguyễn Huệ, P. Mỹ Trà, Đồng Tháp"
          />
        </label>

        <label className="block">
          <span className={labelClass}>Mức lương / Thu nhập</span>
          <input
            name="salary_range"
            type="text"
            defaultValue={job?.salary_range ?? ''}
            className={fieldClass}
            placeholder="VD: 8.5 - 12 Triệu hoặc Thỏa thuận"
          />
        </label>

        <label className="block">
          <span className={labelClass}>Thứ tự hiển thị</span>
          <input
            name="sort_order"
            type="number"
            defaultValue={job?.sort_order ?? 0}
            className={fieldClass}
          />
          <span className="mt-1.5 block text-[10px] font-medium text-slate-400 leading-relaxed">
            Thứ tự sắp xếp của tin tuyển dụng (số nhỏ hơn hiển thị trước).
          </span>
        </label>

        <div className="block sm:col-span-2">
          <span className={labelClass}>Chi tiết tin tuyển dụng (Mô tả & Yêu cầu)</span>
          <textarea
            name="description"
            rows={8}
            defaultValue={job?.description ?? ''}
            className={`${fieldClass} font-mono`}
            placeholder="<h3>Mô tả công việc:</h3><ul><li>Vận hành xưởng...</li></ul>"
          />
          <span className="mt-1.5 block text-[10px] font-medium text-slate-400 leading-relaxed">
            {"Nhập mô tả chi tiết, yêu cầu công việc và chế độ đãi ngộ. Có thể dùng các thẻ HTML cơ bản như <h3>, <p>, <ul>, <li> để trình bày đẹp mắt."}
          </span>
        </div>
      </div>

      <div className="admin-soft-panel px-4 py-3">
        <AdminToggle
          name="is_active"
          defaultChecked={job?.is_active ?? true}
          label="Mở tuyển dụng công khai"
          description="Bật để hiển thị tin tuyển dụng này trên trang /tuyen-dung ngoài website."
        />
      </div>
    </form>
  );
}
