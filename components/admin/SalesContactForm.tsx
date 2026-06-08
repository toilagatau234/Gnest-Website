'use client';

import { useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';

import { AdminToggle } from '@/components/admin/AdminToggle';
import type { AdminSalesContact } from '@/lib/services/admin/sales-contacts';
import type { AdminFormState } from '@/app/admin/(dashboard)/sales-contacts/actions';

interface SalesContactFormProps {
  formId: string;
  formAction: (payload: FormData) => void;
  state: AdminFormState;
  contact?: AdminSalesContact;
}

const fieldClass = 'admin-input text-xs';
const labelClass = 'mb-1.5 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-[#646464]';

function getAvatarPreview(name: string) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'SC';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1B3A6B"/><stop offset="100%" stop-color="#3B82F6"/></linearGradient></defs><rect width="160" height="160" rx="36" fill="url(#bg)"/><circle cx="80" cy="80" r="52" fill="rgba(255,255,255,0.12)"/><text x="50%" y="54%" text-anchor="middle" font-family="Arial, sans-serif" font-size="54" font-weight="700" fill="#ffffff">${initials}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function SalesContactForm({ formId, formAction, state, contact }: SalesContactFormProps) {
  const [name, setName] = useState(contact?.name ?? '');
  const [phone, setPhone] = useState(contact?.phone ?? '');
  const [zalo, setZalo] = useState(contact?.zalo ?? '');
  const [avatarUrl, setAvatarUrl] = useState(contact?.avatar_url ?? '');

  const phoneDigits = useMemo(() => phone.replace(/\D/g, ''), [phone]);
  const hasCustomZalo = useMemo(() => {
    return !!(
      contact?.zalo &&
      contact.zalo !== phoneDigits &&
      contact.zalo !== `https://zalo.me/${phoneDigits}`
    );
  }, [contact, phoneDigits]);

  const [showZaloOverride, setShowZaloOverride] = useState(hasCustomZalo);

  const resolvedZalo = useMemo(() => {
    if (zalo.trim()) {
      return zalo.trim();
    }

    const digits = phone.replace(/\D/g, '');
    return digits ? `https://zalo.me/${digits}` : '';
  }, [phone, zalo]);

  const avatarPreview = avatarUrl.trim() || getAvatarPreview(name);

  return (
    <form id={formId} action={formAction} className="space-y-5">
      {contact ? <input type="hidden" name="id" value={contact.id} /> : null}

      {state.error ? (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-[#FFF5F5] px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#E31E24]" />
          <p className="text-xs font-medium text-[#B42318]">{state.error}</p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>
            Tên nhân sự <span className="text-[#E31E24]">*</span>
          </span>
          <input
            name="name"
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={fieldClass}
            placeholder="VD: Nguyễn Văn Tài"
          />
        </label>

        <label className="block">
          <span className={labelClass}>
            Số điện thoại <span className="text-[#E31E24]">*</span>
          </span>
          <input
            name="phone"
            type="tel"
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className={fieldClass}
            placeholder="0908123456"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className={labelClass}>Vai trò / khu vực phụ trách</span>
          <input
            name="role"
            type="text"
            defaultValue={contact?.role ?? ''}
            className={fieldClass}
            placeholder="VD: Tư vấn đại lý miền Nam"
          />
        </label>

        {!showZaloOverride ? (
          <div className="sm:col-span-2 flex items-center justify-between rounded-xl border border-dashed border-[#E5E7EF] bg-[#F7F9FB] px-4 py-3">
            <input type="hidden" name="zalo" value="" />
            <div className="text-xs text-[#646464] font-medium">
              <span className="font-bold text-[#202224]">Zalo:</span> Link Zalo sẽ tự tạo từ số điện thoại.
              {resolvedZalo ? (
                <span className="ml-1.5 font-bold text-[#3749A6] break-all">
                  ({resolvedZalo})
                </span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setShowZaloOverride(true)}
              className="text-xs font-bold text-[#4880FF] hover:text-[#3749A6] transition-colors"
            >
              Tùy chỉnh Zalo khác
            </button>
          </div>
        ) : (
          <div className="block sm:col-span-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className={labelClass}>Zalo URL hoặc số Zalo</span>
              <button
                type="button"
                onClick={() => {
                  setShowZaloOverride(false);
                  setZalo('');
                }}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Dùng mặc định theo SĐT
              </button>
            </div>
            <input
              name="zalo"
              type="text"
              value={zalo}
              onChange={(event) => setZalo(event.target.value)}
              className={fieldClass}
              placeholder="VD: https://zalo.me/0908123456"
            />
            <span className="mt-1.5 block text-[10px] font-medium text-slate-400">
              Có thể nhập link Zalo đầy đủ hoặc chỉ nhập số điện thoại.
            </span>
            {resolvedZalo ? (
              <span className="mt-1.5 block break-all text-[10px] font-semibold text-[#3749A6]">
                Link sẽ dùng: {resolvedZalo}
              </span>
            ) : null}
          </div>
        )}

        <label className="block sm:col-span-2">
          <span className={labelClass}>Avatar URL</span>
          <input
            name="avatar_url"
            type="url"
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            className={`${fieldClass} font-mono`}
            placeholder="https://..."
          />
        </label>
      </div>

      <div className="admin-soft-panel flex items-center gap-4 px-4 py-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#DDE5F8] bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarPreview} alt={name || 'Avatar xem trước'} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 text-xs text-[#646464]">
          <p className="font-extrabold text-[#202224]">Avatar xem trước</p>
          <p className="mt-1 leading-relaxed">
            Nếu không nhập avatar URL, hệ thống sẽ tự tạo avatar từ tên nhân sự để dùng cho website và CMS.
          </p>
        </div>
      </div>

      <div className="admin-soft-panel px-4 py-3">
        <AdminToggle
          name="is_active"
          defaultChecked={contact?.is_active ?? true}
          label="Kích hoạt hiển thị công khai"
          description="Tắt để ẩn nhân sự này khỏi các khu vực liên hệ trên website."
        />
      </div>
    </form>
  );
}
