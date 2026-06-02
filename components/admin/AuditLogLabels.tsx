import React from 'react';

export const ACTION_LABELS: Record<string, { label: string; toneClass: string }> = {
  create: { label: 'Tạo mới', toneClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold' },
  update: { label: 'Cập nhật', toneClass: 'bg-sky-50 text-sky-800 border border-sky-200 font-bold' },
  delete: { label: 'Xóa', toneClass: 'bg-rose-50 text-rose-800 border border-rose-200 font-bold' },
  activate: { label: 'Kích hoạt', toneClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold' },
  deactivate: { label: 'Ngưng hoạt động', toneClass: 'bg-slate-100 text-slate-700 border border-slate-200 font-bold' },
  status_update: { label: 'Đổi trạng thái', toneClass: 'bg-purple-50 text-purple-800 border border-purple-200 font-bold' },
  assign: { label: 'Phân công', toneClass: 'bg-indigo-50 text-indigo-800 border border-indigo-200 font-bold' },
  note_add: { label: 'Thêm ghi chú', toneClass: 'bg-amber-50 text-amber-800 border border-amber-200 font-bold' },
  metadata_update: { label: 'Cập nhật metadata', toneClass: 'bg-sky-50 text-sky-800 border border-sky-200 font-bold' },
  mark_spam: { label: 'Đánh dấu spam', toneClass: 'bg-rose-50 text-rose-800 border border-rose-200 font-bold' },
  close: { label: 'Đóng', toneClass: 'bg-slate-100 text-slate-800 border border-slate-200 font-bold' },
  reopen: { label: 'Mở lại', toneClass: 'bg-teal-50 text-teal-800 border border-teal-200 font-bold' },
  invite: { label: 'Gửi thư mời', toneClass: 'bg-cyan-50 text-cyan-800 border border-cyan-200 font-bold' },
  role_update: { label: 'Đổi quyền', toneClass: 'bg-orange-50 text-orange-800 border border-orange-200 font-bold' },
  remove_access: { label: 'Xóa truy cập', toneClass: 'bg-rose-100 text-rose-900 border border-rose-300 font-bold' },
  upload: { label: 'Tải lên', toneClass: 'bg-teal-50 text-teal-800 border border-teal-200 font-bold' },
  set_primary: { label: 'Đặt ảnh chính', toneClass: 'bg-yellow-50 text-yellow-800 border border-yellow-200 font-bold' },
  reorder: { label: 'Sắp xếp', toneClass: 'bg-slate-50 text-slate-600 border border-slate-200 font-bold' },
};

export const ENTITY_LABELS: Record<string, string> = {
  products: 'Sản phẩm',
  product_images: 'Ảnh sản phẩm',
  product_bulk_discounts: 'Bậc giá sỉ',
  categories: 'Danh mục',
  inquiries: 'Yêu cầu báo giá',
  sales_contacts: 'Danh bạ bán hàng',
  job_vacancies: 'Tin tuyển dụng',
  site_contents: 'Nội dung website',
  admin_users: 'Tài khoản quản trị',
  audit_logs: 'Nhật ký hệ thống',
};

interface AuditLogActionBadgeProps {
  action: string;
}

export function AuditLogActionBadge({ action }: AuditLogActionBadgeProps) {
  const meta = ACTION_LABELS[action] ?? {
    label: action,
    toneClass: 'bg-slate-100 text-slate-500 border border-slate-200',
  };

  return (
    <span className={`px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wide inline-flex items-center ${meta.toneClass}`}>
      {meta.label}
    </span>
  );
}

interface AuditLogEntityLabelProps {
  entity: string;
}

export function AuditLogEntityLabel({ entity }: AuditLogEntityLabelProps) {
  const label = ENTITY_LABELS[entity] ?? entity;
  return <span className="font-semibold text-slate-700">{label}</span>;
}
