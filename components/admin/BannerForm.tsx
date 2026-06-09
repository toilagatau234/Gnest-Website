'use client';

import { useState } from 'react';
import {
  AlertCircle,
  CalendarClock,
  Eye,
  ImageIcon,
  LayoutGrid,
  Link2,
  Megaphone,
  Monitor,
  Smartphone,
} from 'lucide-react';

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
const helperClass = 'mt-1.5 block text-[10px] font-medium leading-relaxed text-slate-400';

const POSITION_OPTIONS = [
  {
    value: 'site_top',
    label: 'Thanh thông báo đầu trang',
    description: 'Phù hợp cho thông báo ngắn, khuyến mãi nhanh hoặc thông tin toàn website.',
  },
  {
    value: 'home_after_products',
    label: 'Banner lớn ở trang chủ',
    description: 'Phù hợp cho hình ảnh chiến dịch, chương trình nổi bật hoặc bộ sưu tập sản phẩm.',
  },
  {
    value: 'catalog_top',
    label: 'Banner đầu trang danh mục',
    description: 'Phù hợp để nhấn mạnh ưu đãi hoặc thông tin khi khách đang xem danh mục sản phẩm.',
  },
] as const;

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

function getPositionLabel(position: string) {
  return POSITION_OPTIONS.find((option) => option.value === position)?.label ?? 'Vị trí hiển thị';
}

function BannerPreview({
  title,
  content,
  linkUrl,
  imageUrl,
  mode,
}: {
  title: string;
  content: string;
  linkUrl: string;
  imageUrl: string;
  mode: 'desktop' | 'mobile';
}) {
  const hasImage = imageUrl.trim().length > 0 && validateImageUrl(imageUrl) && !imageUrl.includes('drive.google.com');
  const previewStyle = hasImage
    ? {
        backgroundImage: `linear-gradient(90deg, rgba(27, 58, 107, 0.82), rgba(27, 58, 107, 0.34)), url(${imageUrl.trim()})`,
      }
    : undefined;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {mode === 'desktop' ? <Monitor className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
        {mode === 'desktop' ? 'Xem trước máy tính' : 'Xem trước điện thoại'}
      </div>
      <div
        className={`overflow-hidden rounded-2xl border border-slate-200 bg-cover bg-center shadow-sm ${
          mode === 'desktop' ? 'min-h-[150px]' : 'mx-auto min-h-[190px] max-w-[260px]'
        }`}
        style={previewStyle}
      >
        <div className={`flex min-h-[inherit] flex-col justify-center gap-3 p-5 ${hasImage ? 'text-white' : 'bg-gradient-to-br from-[#EEF4FF] to-white text-[#1B3A6B]'}`}>
          <div className="inline-flex w-fit items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ring-white/25">
            <Megaphone className="h-3 w-3" />
            Banner
          </div>
          <div>
            <p className={`font-extrabold leading-tight ${mode === 'desktop' ? 'text-lg' : 'text-base'}`}>
              {title.trim() || 'Tên chiến dịch / chương trình'}
            </p>
            <p className={`mt-1.5 leading-relaxed ${mode === 'desktop' ? 'text-sm' : 'text-xs'} ${hasImage ? 'text-white/90' : 'text-slate-600'}`}>
              {content.trim() || 'Nội dung banner sẽ hiển thị tại đây để admin kiểm tra trước khi lưu.'}
            </p>
          </div>
          {linkUrl.trim() ? (
            <span className={`inline-flex w-fit items-center gap-1 rounded-full px-3 py-1.5 text-[10px] font-bold ${hasImage ? 'bg-white text-[#1B3A6B]' : 'bg-[#1B3A6B] text-white'}`}>
              <Link2 className="h-3 w-3" /> Có liên kết khi bấm vào
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function validateImageUrl(url: string): boolean {
  if (!url.trim()) return true;
  try {
    const u = new URL(url.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
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
  const [desktopUrlError, setDesktopUrlError] = useState('');
  const [mobileUrlError, setMobileUrlError] = useState('');
  const selectedPosition = POSITION_OPTIONS.find((option) => option.value === position) ?? POSITION_OPTIONS[0];

  const handleDesktopUrlChange = (value: string) => {
    setImageDesktopUrl(value);
    if (value.trim()) {
      if (!validateImageUrl(value)) {
        setDesktopUrlError('Đường dẫn ảnh không hợp lệ. Vui lòng bắt đầu bằng http:// hoặc https://');
      } else if (value.includes('drive.google.com')) {
        setDesktopUrlError('Cảnh báo: Link Google Drive không phải là link ảnh trực tiếp và có thể không hiển thị được.');
      } else {  
        setDesktopUrlError('');
      }
    } else {
      setDesktopUrlError('');
    }
  };

  const handleMobileUrlChange = (value: string) => {
    setImageMobileUrl(value);
    if (value.trim()) {
      if (!validateImageUrl(value)) {
        setMobileUrlError('Đường dẫn ảnh không hợp lệ. Vui lòng bắt đầu bằng http:// hoặc https://');
      } else if (value.includes('drive.google.com')) {
        setMobileUrlError('Cảnh báo: Link Google Drive không phải là link ảnh trực tiếp và có thể không hiển thị được.');
      } else {
        setMobileUrlError('');
      }
    } else {
      setMobileUrlError('');
    }
  };

  return (
    <form id={formId} action={formAction} className="space-y-5">
      {banner ? <input type="hidden" name="id" value={banner.id} /> : null}

      {state.error ? (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-[#FFF5F5] px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#E31E24]" />
          <p className="text-xs font-medium text-[#B42318]">{state.error}</p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-xs leading-relaxed text-[#1B3A6B]">
        <p className="font-bold">Gợi ý nhanh cho admin</p>
        <p className="mt-1 text-[11px] text-slate-600">
          Chỉ cần nhập tên, nội dung, chọn vị trí và dán link ảnh nếu có. Nếu chưa có ảnh, website vẫn hiển thị banner dạng chữ nên bạn có thể lưu trước rồi bổ sung ảnh sau. Quản trị viên có thể sắp xếp thứ tự hiển thị banner trực quan bằng tính năng kéo thả trên danh sách.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px] xl:grid-cols-[minmax(0,1.2fr)_minmax(380px,1fr)]">
        <div className="space-y-5">
          <section className="space-y-4 rounded-2xl border border-[#EEF2F6] bg-white p-4">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#1B3A6B]">
                <Megaphone className="h-4 w-4 text-slate-400" /> Nội dung banner
              </h3>
              <p className="mt-1 text-[11px] text-slate-400">Thông tin chính mà khách hàng sẽ nhìn thấy trên website.</p>
            </div>

            <label className="block">
              <span className={labelClass}>
                Tên banner để quản lý <span className="text-[#E31E24]">*</span>
              </span>
              <input
                name="name"
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={fieldClass}
                placeholder="VD: Khuyến mãi hè 2026"
              />
              <span className={helperClass}>Tên này giúp bạn nhận diện banner trong trang quản trị, khách hàng có thể không nhìn thấy phần này.</span>
            </label>

            <label className="block">
              <span className={labelClass}>
                Nội dung hiển thị <span className="text-[#E31E24]">*</span>
              </span>
              <textarea
                name="content"
                required
                rows={3}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className={`${fieldClass} min-h-[82px] resize-y`}
                placeholder="VD: Giảm 10% cho đơn hàng hũ thủy tinh trong tuần này!"
              />
              <span className={helperClass}>Nên viết ngắn gọn, dễ hiểu. Nếu dùng banner hình ảnh, nội dung này cũng giúp mô tả ảnh tốt hơn.</span>
            </label>

            <label className="block">
              <span className={labelClass}>Đường dẫn khi bấm vào banner</span>
              <input
                name="link_url"
                type="text"
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                className={fieldClass}
                placeholder="VD: /danh-muc/hu-yen-chung hoặc https://..."
              />
              <span className={helperClass}>Để trống nếu banner chỉ dùng để thông báo và không cần chuyển trang.</span>
            </label>
          </section>

          <section className="space-y-4 rounded-2xl border border-[#EEF2F6] bg-white p-4">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#1B3A6B]">
                <LayoutGrid className="h-4 w-4 text-slate-400" /> Vị trí và thứ tự
              </h3>
              <p className="mt-1 text-[11px] text-slate-400">Chọn nơi banner xuất hiện. Không cần nhớ mã kỹ thuật.</p>
            </div>

            <label className="block">
              <span className={labelClass}>Vị trí hiển thị</span>
              <select
                name="position"
                value={position}
                onChange={(event) => setPosition(event.target.value)}
                className={fieldClass}
              >
                {POSITION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className={helperClass}>{selectedPosition.description}</span>
            </label>

            <input type="hidden" name="sort_order" value={banner?.sort_order ?? 0} />
          </section>

          {position !== 'site_top' && (
            <section className="space-y-4 rounded-2xl border border-[#EEF2F6] bg-white p-4">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#1B3A6B]">
                  <ImageIcon className="h-4 w-4 text-slate-400" /> Ảnh banner
                </h3>
                <p className="mt-1 text-[11px] text-slate-400">Dán đường dẫn ảnh đã upload. Nếu chưa có ảnh, hệ thống sẽ tự hiển thị banner dạng chữ.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>Ảnh banner máy tính</span>
                  <input
                    name="image_desktop_url"
                    type="text"
                    value={imageDesktopUrl}
                    onChange={(event) => handleDesktopUrlChange(event.target.value)}
                    className={`${fieldClass} ${desktopUrlError ? 'border-rose-300 bg-rose-50/50' : ''}`}
                    placeholder="https://..."
                  />
                  {desktopUrlError ? (
                    <span className="mt-1.5 block text-[10px] font-medium text-rose-600">{desktopUrlError}</span>
                  ) : (
                    <span className={helperClass}>Khuyến nghị 1600×500 hoặc 1920×600, ảnh ngang, dung lượng nhẹ.</span>
                  )}
                </label>

                <label className="block">
                  <span className={labelClass}>Ảnh banner điện thoại</span>
                  <input
                    name="image_mobile_url"
                    type="text"
                    value={imageMobileUrl}
                    onChange={(event) => handleMobileUrlChange(event.target.value)}
                    className={`${fieldClass} ${mobileUrlError ? 'border-rose-300 bg-rose-50/50' : ''}`}
                    placeholder="https://..."
                  />
                  {mobileUrlError ? (
                    <span className="mt-1.5 block text-[10px] font-medium text-rose-600">{mobileUrlError}</span>
                  ) : (
                    <span className={helperClass}>Khuyến nghị 800×600 hoặc tỉ lệ gần vuông để hiển thị tốt trên mobile.</span>
                  )}
                </label>
              </div>
            </section>
          )}

          <section className="space-y-4 rounded-2xl border border-[#EEF2F6] bg-white p-4">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#1B3A6B]">
                <CalendarClock className="h-4 w-4 text-slate-400" /> Lịch hiển thị
              </h3>
              <p className="mt-1 text-[11px] text-slate-400">Có thể để trống cả hai ô nếu muốn banner luôn hiển thị khi đang bật trạng thái.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Bắt đầu hiển thị</span>
                <input
                  name="start_at"
                  type="datetime-local"
                  value={startAt}
                  onChange={(event) => setStartAt(event.target.value)}
                  className={fieldClass}
                />
                <span className={helperClass}>Để trống nếu muốn banner có thể hiển thị ngay sau khi lưu.</span>
              </label>

              <label className="block">
                <span className={labelClass}>Ngừng hiển thị</span>
                <input
                  name="end_at"
                  type="datetime-local"
                  value={endAt}
                  onChange={(event) => setEndAt(event.target.value)}
                  className={fieldClass}
                />
                <span className={helperClass}>Để trống nếu không muốn đặt ngày kết thúc tự động.</span>
              </label>
            </div>
          </section>

          <div className="admin-soft-panel px-4 py-3">
            <AdminToggle
              name="is_active"
              defaultChecked={banner?.is_active ?? true}
              label="Bật banner trên website"
              description="Tắt lựa chọn này nếu muốn lưu nháp hoặc tạm ẩn banner khỏi website."
            />
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-2xl border border-[#EEF2F6] bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#1B3A6B]">
                  <Eye className="h-4 w-4 text-slate-400" /> Xem trước banner
                </h3>
                <p className="mt-1 text-[11px] text-slate-400">Preview giúp kiểm tra nhanh trước khi lưu. Giao diện thực tế có thể thay đổi nhẹ theo từng khu vực.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                {getPositionLabel(position)}
              </span>
            </div>

            <div className="space-y-4">
              {position === 'site_top' ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <Megaphone className="h-3.5 w-3.5" />
                    Thanh thông báo đầu trang
                  </div>
                  <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-[#1B3A6B] text-white py-2.5 px-4 text-center text-xs font-semibold leading-snug tracking-wide">
                    <div className="inline-flex flex-wrap items-center justify-center gap-2">
                      <span>{content.trim() || 'Nội dung thông báo đầu trang (site_top)...'}</span>
                      {linkUrl.trim() ? (
                        <span className="inline-flex items-center gap-0.5 underline text-white/90 hover:text-white text-[10px] font-bold">
                          <Link2 className="h-3 w-3" /> Chi tiết
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <BannerPreview
                    title={name}
                    content={content}
                    linkUrl={linkUrl}
                    imageUrl={imageDesktopUrl}
                    mode="desktop"
                  />
                  <BannerPreview
                    title={name}
                    content={content}
                    linkUrl={linkUrl}
                    imageUrl={imageMobileUrl || imageDesktopUrl}
                    mode="mobile"
                  />
                </>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-[11px] leading-relaxed text-amber-800">
            <p className="font-bold">Lưu ý khi dùng ảnh</p>
            <p className="mt-1">Ảnh nên rõ chữ, không đặt quá nhiều nội dung nhỏ. Nếu ảnh chưa đúng tỉ lệ, hãy chỉnh lại trước khi đưa lên website để tránh bị cắt mất thông tin quan trọng.</p>
          </div>
        </aside>
      </div>
    </form>
  );
}
