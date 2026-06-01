'use client';

import { useActionState, useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';

import { AdminModal } from '@/components/admin/AdminModal';
import { useToast } from '@/components/admin/AdminToast';
import { updateAdminUserRoleAction, type AdminFormState } from '@/app/admin/(dashboard)/admin-users/actions';
import { ADMIN_ROLE_LABELS } from '@/lib/types/admin';
import type { AdminUserListItem } from '@/lib/services/admin/admin-users';

const INITIAL_STATE: AdminFormState = { ok: false };

interface AdminUserRoleDialogProps {
  user: AdminUserListItem;
  open: boolean;
  onClose: () => void;
}

export function AdminUserRoleDialog({ user, open, onClose }: AdminUserRoleDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const formId = useId();

  const [state, formAction, isPending] = useActionState(updateAdminUserRoleAction, INITIAL_STATE);
  const handledOk = useRef(false);

  useEffect(() => {
    if (open && state.ok && !handledOk.current) {
      handledOk.current = true;
      toast(`Đã cập nhật vai trò phân quyền cho tài khoản ${user.email} thành công.`, 'success');
      onClose();
      router.refresh();
    }
  }, [open, state.ok, user.email, router, toast, onClose]);

  const closeDialog = () => {
    if (isPending) return;
    onClose();
  };

  return (
    <AdminModal
      open={open}
      onClose={closeDialog}
      title="Thay đổi vai trò quản trị"
      description={`Cập nhật quyền hạn truy cập của tài khoản ${user.email} trên hệ thống CMS.`}
      size="md"
      dismissible={!isPending}
      footer={
        <>
          <button
            type="button"
            onClick={closeDialog}
            disabled={isPending}
            className="admin-button-secondary px-5 text-xs"
          >
            Hủy
          </button>
          <button
            type="submit"
            form={formId}
            disabled={isPending}
            className="admin-button-primary px-6 text-xs"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
          </button>
        </>
      }
    >
      <form id={formId} action={formAction} className="space-y-4">
        <input type="hidden" name="userId" value={user.id} />

        <div>
          <label htmlFor="role" className="mb-1 block text-xs font-bold text-slate-600">
            Lựa chọn vai trò mới <span className="text-[#E31E24]">*</span>
          </label>
          <select
            id="role"
            name="role"
            required
            defaultValue={user.role}
            className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] rounded-lg px-3 py-2.5 text-slate-800 text-xs"
          >
            {Object.entries(ADMIN_ROLE_LABELS).map(([role, label]) => (
              <option key={role} value={role}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
          <ShieldAlert className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#1B3A6B]" />
          <div className="text-[11px] leading-relaxed text-slate-600">
            <p className="font-bold text-[#1B3A6B] mb-0.5">Chú thích phân quyền:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li><strong>Super Admin:</strong> Toàn quyền truy cập hệ thống và quản trị nhân sự.</li>
              <li><strong>Quản trị viên (Admin):</strong> Toàn quyền chỉnh sửa danh mục, sản phẩm, liên hệ, tin tuyển dụng.</li>
              <li><strong>Biên tập viên (Editor):</strong> Được phép tạo mới, chỉnh sửa thông tin sản phẩm và tin tuyển dụng.</li>
              <li><strong>Người xem (Viewer):</strong> Chỉ được phép đọc/xem dữ liệu báo cáo và danh sách.</li>
            </ul>
          </div>
        </div>

        {state.error ? (
          <div className="rounded-xl border border-red-200 bg-[#FFF5F5] p-3 text-xs text-[#B42318] font-medium leading-relaxed">
            {state.error}
          </div>
        ) : null}
      </form>
    </AdminModal>
  );
}
