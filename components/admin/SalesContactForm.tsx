'use client';

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

export function SalesContactForm({ formId, formAction, state, contact }: SalesContactFormProps) {
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
            defaultValue={contact?.name ?? ''}
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
            defaultValue={contact?.phone ?? ''}
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

        <label className="block">
          <span className={labelClass}>Zalo URL hoặc số Zalo</span>
          <input
            name="zalo"
            type="text"
            defaultValue={contact?.zalo ?? ''}
            className={fieldClass}
            placeholder="Để trống để tự tạo từ số điện thoại"
          />
          <span className="mt-1.5 block text-[10px] font-medium text-slate-400">
            Có thể nhập link Zalo đầy đủ hoặc chỉ nhập số điện thoại.
          </span>
        </label>

        <label className="block">
          <span className={labelClass}>Thứ tự hiển thị</span>
          <input
            name="sort_order"
            type="number"
            defaultValue={contact?.sort_order ?? 0}
            className={fieldClass}
          />
        </label>

        <label className="block sm:col-span-2">
          <span className={labelClass}>Avatar URL</span>
          <input
            name="avatar_url"
            type="url"
            defaultValue={contact?.avatar_url ?? ''}
            className={`${fieldClass} font-mono`}
            placeholder="https://..."
          />
        </label>
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
