'use client';

import { useState } from 'react';
import { AlertCircle, Globe, LayoutGrid } from 'lucide-react';

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

function toDatetimeLocal(isoString?: string | null) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '';
    const tzoffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
    return localISOTime;
  } catch {
    return '';
  }
}

export function BannerForm({ formId, formAction, state, banner }: BannerFormProps) {
  const [name, setName] = useState(banner?.name ?? '');
  const [content, setContent] = useState(banner?.content ?? '');
  const [linkUrl, setLinkUrl] = useState(banner?.link_url ?? '');
  const [position, setPosition] = useState(banner?.position ?? 'site_top');
  const [imageDesktopUrl, setImageDesktopUrl] = useState(banner?.image_desktop_url ?? '');
  const [imageMobileUrl, setImageMobileUrl] = useState(banner?.image_mobile_url ?? '');
  const [startAt, setStartAt] = useState(toDatetimeLocal(banner?.start_at));
  const [endAt, setEndAt] = useState(toDatetimeLocal(banner?.end_at));

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

        <label className="block">
          <span className={labelClass}>Vị trí hiển thị</span>
          <select
            name="position"
            value={position}
            onChange={(event) => setPosition(event.target.value)}
            className={fieldClass}
          >
            <option value="site_top">Thanh thông báo đầu trang (site_top)</option>
            <option value="home_after_products">Vùng banner trang chủ (home_after_products)</option>
            <option value="catalog_top">Vùng banner trang danh mục (catalog_top)</option>
          </select>
          <span className="mt-1.5 block text-[10px] font-medium leading-relaxed text-slate-400">
            Khu vực mà banner này sẽ xuất hiện trên giao diện.
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

        <label className="block sm:col-span-2">
          <span className={labelClass}>
            Nội dung hiển thị / Headline mô tả <span className="text-[#E31E24]">*</span>
          </span>
          <textarea
            name="content"
            required
            rows={2}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className={`${fieldClass} resize-y min-h-[56px]`}
            placeholder="VD: Giảm ngay 10% cho tất cả đơn hàng hũ yến thủy tinh đặt trong hôm nay!"
          />
          <span className="mt-1.5 block text-[10px] font-medium leading-relaxed text-slate-400">
            Nội dung văn bản hiển thị. Đối với banner hình ảnh, phần này đóng vai trò như thẻ ALT mô tả ảnh.
          </span>
        </label>

        <label className="block sm:col-span-2">
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
            Đường dẫn chuyển tiếp khi người dùng click vào banner. Để trống nếu không cần dẫn link.
          </span>
        </label>

        <div className="border-t border-[#EEF2F6] sm:col-span-2 my-2" />

        {/* Image configurations (primarily used for homepage banner slots) */}
        <div className="sm:col-span-2 space-y-4">
          <h3 className="text-xs font-extrabold text-[#1B3A6B] flex items-center gap-1.5 uppercase tracking-wider">
            <LayoutGrid className="w-4 h-4 text-slate-400" /> Cấu hình hình ảnh (Tùy chọn cho Vùng banner trang chủ)
          </h3>
          <p className="text-[11px] text-slate-400">
            Các đường dẫn hình ảnh này sẽ được ưu tiên hiển thị ở Vùng banner trang chủ. Nếu không nhập, hệ thống sẽ tự động vẽ một card thông tin dạng văn bản nền màu tương ứng.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Desktop Image URL</span>
              <input
                name="image_desktop_url"
                type="url"
                value={imageDesktopUrl}
                onChange={(event) => setImageDesktopUrl(event.target.value)}
                className={`${fieldClass} font-mono`}
                placeholder="https://..."
              />
            </label>

            <label className="block">
              <span className={labelClass}>Mobile Image URL</span>
              <input
                name="image_mobile_url"
                type="url"
                value={imageMobileUrl}
                onChange={(event) => setImageMobileUrl(event.target.value)}
                className={`${fieldClass} font-mono`}
                placeholder="https://..."
              />
            </label>
          </div>
        </div>

        <div className="border-t border-[#EEF2F6] sm:col-span-2 my-2" />

        {/* Schedule settings */}
        <div className="sm:col-span-2 space-y-4">
          <h3 className="text-xs font-extrabold text-[#1B3A6B] flex items-center gap-1.5 uppercase tracking-wider">
            <Globe className="w-4 h-4 text-slate-400" /> Cấu hình lịch trình phát sóng (Tùy chọn)
          </h3>
          <p className="text-[11px] text-slate-400">
            Để trống nếu bạn muốn banner hiển thị ngay lập tức và không giới hạn thời gian (chỉ phụ thuộc vào trạng thái Kích hoạt bên dưới).
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Ngày bắt đầu (Start Time)</span>
              <input
                name="start_at"
                type="datetime-local"
                value={startAt}
                onChange={(event) => setStartAt(event.target.value)}
                className={fieldClass}
              />
            </label>

            <label className="block">
              <span className={labelClass}>Ngày kết thúc (End Time)</span>
              <input
                name="end_at"
                type="datetime-local"
                value={endAt}
                onChange={(event) => setEndAt(event.target.value)}
                className={fieldClass}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="admin-soft-panel px-4 py-3">
        <AdminToggle
          name="is_active"
          defaultChecked={banner?.is_active ?? true}
          label="Kích hoạt hiển thị công khai"
          description="Tắt để tạm thời ẩn banner này khỏi website bất kể lịch trình."
        />
      </div>
    </form>
  );
}
