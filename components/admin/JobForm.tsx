'use client';

import { AlertCircle, Link2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { AdminToggle } from '@/components/admin/AdminToggle';
import type { AdminJobVacancy } from '@/lib/services/admin/jobs';
import type { AdminFormState } from '@/app/admin/(dashboard)/jobs/actions';

interface JobFormProps {
  formId: string;
  formAction: (payload: FormData) => void;
  state: AdminFormState;
  job?: AdminJobVacancy;
}

interface ParsedJobDescription {
  intro: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  customHtml: string;
}

const fieldClass = 'admin-input text-xs';
const labelClass = 'mb-1.5 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-[#646464]';

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function listToLines(items: string[]) {
  return items.join('\n');
}

function linesToList(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseStructuredDescription(description: string | null | undefined): ParsedJobDescription {
  if (!description) {
    return {
      intro: '',
      responsibilities: [],
      requirements: [],
      benefits: [],
      customHtml: '',
    };
  }

  if (typeof window === 'undefined') {
    return {
      intro: '',
      responsibilities: [],
      requirements: [],
      benefits: [],
      customHtml: description,
    };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(description, 'text/html');
  const sections = Array.from(doc.querySelectorAll('section[data-job-block]'));

  if (sections.length === 0) {
    return {
      intro: '',
      responsibilities: [],
      requirements: [],
      benefits: [],
      customHtml: description,
    };
  }

  const readList = (block: string) =>
    Array.from(doc.querySelectorAll(`section[data-job-block="${block}"] li`))
      .map((item) => item.textContent?.trim() ?? '')
      .filter(Boolean);

  const introNode = doc.querySelector('section[data-job-block="intro"]');
  const customNodes = Array.from(doc.body.children).filter(
    (node) => !node.hasAttribute('data-job-block'),
  );

  return {
    intro: introNode?.textContent?.trim() ?? '',
    responsibilities: readList('responsibilities'),
    requirements: readList('requirements'),
    benefits: readList('benefits'),
    customHtml: customNodes.map((node) => node.outerHTML).join('\n').trim(),
  };
}

function buildDescriptionHtml(parsed: ParsedJobDescription) {
  const chunks: string[] = [];

  if (parsed.intro.trim()) {
    chunks.push(
      `<section data-job-block="intro"><p>${escapeHtml(parsed.intro.trim())}</p></section>`,
    );
  }

  const listSections = [
    { title: 'Mô tả công việc', key: 'responsibilities', items: parsed.responsibilities },
    { title: 'Yêu cầu ứng viên', key: 'requirements', items: parsed.requirements },
    { title: 'Quyền lợi', key: 'benefits', items: parsed.benefits },
  ];

  listSections.forEach((section) => {
    if (section.items.length === 0) {
      return;
    }

    const listHtml = section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    chunks.push(
      `<section data-job-block="${section.key}"><h3>${section.title}</h3><ul>${listHtml}</ul></section>`,
    );
  });

  return chunks.join('');
}

export function JobForm({ formId, formAction, state, job }: JobFormProps) {
  const initialDescription = parseStructuredDescription(job?.description);
  const [title, setTitle] = useState(job?.title ?? '');
  const [slug, setSlug] = useState(job?.slug ?? '');
  const [isSlugManual, setIsSlugManual] = useState(Boolean(job?.slug));
  const [intro, setIntro] = useState(initialDescription.intro);
  const [responsibilities, setResponsibilities] = useState(listToLines(initialDescription.responsibilities));
  const [requirements, setRequirements] = useState(listToLines(initialDescription.requirements));
  const [benefits, setBenefits] = useState(listToLines(initialDescription.benefits));
  const [customHtml] = useState(initialDescription.customHtml);

  const descriptionValue = useMemo(
    () =>
      buildDescriptionHtml({
        intro,
        responsibilities: linesToList(responsibilities),
        requirements: linesToList(requirements),
        benefits: linesToList(benefits),
        customHtml: '',
      }),
    [benefits, intro, requirements, responsibilities],
  );

  const hasLegacyHtml = Boolean(initialDescription.customHtml && !initialDescription.intro);

  return (
    <form id={formId} action={formAction} className="space-y-5">
      {job ? <input type="hidden" name="id" value={job.id} /> : null}
      <input type="hidden" name="description" value={descriptionValue} readOnly />

      {state.error ? (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-[#FFF5F5] px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#E31E24]" />
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
            onChange={(event) => {
              const nextValue = event.target.value;
              setTitle(nextValue);
              if (!isSlugManual && !job) {
                setSlug(slugify(nextValue));
              }
            }}
            className={fieldClass}
            placeholder="VD: Chuyên viên Tư vấn Bán hàng"
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
              onChange={(event) => {
                setSlug(event.target.value);
                setIsSlugManual(true);
              }}
              className={`${fieldClass} pr-10`}
              placeholder="sales-executive"
            />
            <Link2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
          <span className="mt-1.5 block text-[10px] font-medium leading-relaxed text-slate-400">
            Slug được dùng cho URL của bài tuyển dụng. Nhập tiêu đề để hệ thống tự tạo slug.
          </span>
        </label>

        <label className="block">
          <span className={labelClass}>Địa điểm làm việc</span>
          <input
            name="location"
            type="text"
            defaultValue={job?.location ?? ''}
            className={fieldClass}
            placeholder="VD: Đồng Tháp / Hybrid / Tại nhà máy"
          />
        </label>

        <label className="block">
          <span className={labelClass}>Mức lương / Thu nhập</span>
          <input
            name="salary_range"
            type="text"
            defaultValue={job?.salary_range ?? ''}
            className={fieldClass}
            placeholder="VD: 8 - 12 triệu hoặc thỏa thuận"
          />
        </label>

        <div className="sm:col-span-2 space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-[#1B3A6B]">
              Nội dung bài tuyển dụng
            </p>
            <p className="mt-1 text-[10px] font-medium leading-relaxed text-slate-500">
              Điền theo từng phần để hệ thống tự render HTML cho trang tuyển dụng. Mỗi dòng trong danh sách sẽ thành một bullet.
            </p>
          </div>

          <label className="block">
            <span className={labelClass}>Đoạn mở đầu</span>
            <textarea
              rows={3}
              value={intro}
              onChange={(event) => setIntro(event.target.value)}
              className={fieldClass}
              placeholder="Tóm tắt ngắn gọn về vị trí, mục tiêu công việc và bối cảnh phòng ban."
            />
          </label>

          <div className="grid gap-4 lg:grid-cols-3">
            <label className="block">
              <span className={labelClass}>Mô tả công việc</span>
              <textarea
                rows={7}
                value={responsibilities}
                onChange={(event) => setResponsibilities(event.target.value)}
                className={fieldClass}
                placeholder={'Mỗi dòng là một ý.\nTư vấn khách hàng...\nPhối hợp kinh doanh...'}
              />
            </label>

            <label className="block">
              <span className={labelClass}>Yêu cầu ứng viên</span>
              <textarea
                rows={7}
                value={requirements}
                onChange={(event) => setRequirements(event.target.value)}
                className={fieldClass}
                placeholder={'Mỗi dòng là một ý.\nCó kinh nghiệm B2B...\nKỹ năng giao tiếp tốt...'}
              />
            </label>

            <label className="block">
              <span className={labelClass}>Quyền lợi</span>
              <textarea
                rows={7}
                value={benefits}
                onChange={(event) => setBenefits(event.target.value)}
                className={fieldClass}
                placeholder={'Mỗi dòng là một ý.\nLương thưởng rõ ràng...\nĐào tạo nội bộ...'}
              />
            </label>
          </div>

          {hasLegacyHtml ? (
            <div className="space-y-2">
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-[10px] font-medium leading-relaxed text-amber-800">
                Bài đăng này đang chứa HTML cũ. Nội dung bên dưới chỉ hiển thị để tham khảo, không thể chỉnh sửa và sẽ không được lưu lại sau khi bấm lưu.
              </div>
              <pre className="select-all whitespace-pre-wrap overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-[10px] leading-relaxed text-slate-500">
                {customHtml}
              </pre>
            </div>
          ) : null}
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
