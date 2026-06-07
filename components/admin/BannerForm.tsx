'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';

import { AdminToggle } from '@/components/admin/AdminToggle';
import type { AdminBanner } from '@/lib/services/admin/banners';
import type { AdminFormState } from '@/app/admin/(dashboard)/banners/actions';

interface BannerFormProps {
  formId: string;
  formAction: (payload: FormData) => void;
  state: AdminFormState;
  banner?: AdminBanner;
}

const fieldClass = 'admin-input text-xs';
const labelClass = 'mb-1.5 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-[#646464]';

export function BannerForm({ formId, formAction, state, banner }: BannerFormProps) {
  const [name, setName] = useState(banner?.name ?? '');
  const [content, setContent] = useState(banner?.content ?? '');
  const [linkUrl, setLinkUrl] = useState(banner?.link_url ?? '');

  return (
    <form id={formId} action={formAction} className="space-y-5">
      {banner ? <input type="hidden" name="id" value={banner.id} /> : null}

      {state.error ? (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-[#FFF5F5] px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#E31E24]" />
          <p className="text-xs font-medium text-[#B42318]">{state.error}</p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className={labelClass}>
            Tên banner (Quản trị) <span className="text-[#E31E24]">*</span>
          </span>
          <input
            name="name"
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={fieldClass}
            placeholder="VD: Chương trình khuyến mãi hè 2026"
          />
          <span className="mt-1.5 block text-[10px] font-medium leading-relaxed text-slate-400">
            Tên gọi nội bộ giúp nhận diện và quản lý banner trong danh sách CMS.
          </span>
        </label>

        <label className="block sm:col-span-2">
          <span className={labelClass}>
            Nội dung hiển thị <span className="text-[#E31E24]">*</span>
          </span>
          <textarea
            name="content"
            required
            rows={3}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className={`${fieldClass} resize-y min-h-[72px]`}
            placeholder="VD: Giảm ngay 10% cho tất cả đơn hàng hũ yến thủy tinh đặt trong hôm nay!"
          />
          <span className="mt-1.5 block text-[10px] font-medium leading-relaxed text-slate-400">
            Nội dung chữ sẽ xuất hiện trên thanh banner quảng cáo ở đầu website.
          </span>
        </label>

        <label className="block">
          <span className={labelClass}>Đường dẫn liên kết (Link URL)</span>
          <input
            name="link_url"
            type="text"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            className={fieldClass}
            placeholder="VD: /danh-muc/hu-yen-chung hoặc https://..."
          />
          <span className="mt-1.5 block text-[10px] font-medium leading-relaxed text-slate-400">
            Khách click vào banner sẽ chuyển tới trang này. Để trống nếu không cần dẫn link.
          </span>
        </label>

        <label className="block">
          <span className={labelClass}>Thứ tự ưu tiên</span>
          <input
            name="sort_order"
            type="number"
            defaultValue={banner?.sort_order ?? 0}
            className={fieldClass}
          />
          <span className="mt-1.5 block text-[10px] font-medium leading-relaxed text-slate-400">
            Số nhỏ hơn sẽ hiển thị trước. Nếu bằng nhau, banner tạo sau hiển thị trước.
          </span>
        </label>
      </div>

      <div className="admin-soft-panel px-4 py-3">
        <AdminToggle
          name="is_active"
          defaultChecked={banner?.is_active ?? true}
          label="Kích hoạt hiển thị công khai"
          description="Bật để cho phép banner này xuất hiện trên website."
        />
      </div>
    </form>
  );
}
