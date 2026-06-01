'use client';

import { useActionState, useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Key } from 'lucide-react';

import { AdminActionButton } from '@/components/admin/AdminActionButton';
import { AdminModal } from '@/components/admin/AdminModal';
import { useToast } from '@/components/admin/AdminToast';
import { inviteAdminUserAction, type AdminFormState } from '@/app/admin/(dashboard)/admin-users/actions';
import { ADMIN_ROLE_LABELS } from '@/lib/types/admin';

const INITIAL_STATE: AdminFormState = { ok: false };

export function AdminUserInviteDialog() {
  const router = useRouter();
  const { toast } = useToast();
  const formId = useId();

  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(inviteAdminUserAction, INITIAL_STATE);
  const handledOk = useRef(false);

  useEffect(() => {
    if (open && state.ok && !handledOk.current) {
      handledOk.current = true;
      toast('Đã gửi thư mời và cấp quyền thành công cho quản trị viên mới.', 'success');
      setOpen(false);
      router.refresh();
    }
  }, [open, state.ok, router, toast]);

  const openDialog = () => {
    handledOk.current = false;
    setOpen(true);
  };

  const closeDialog = () => {
    if (isPending) return;
    setOpen(false);
  };

  return (
    <>
      <AdminActionButton icon={<Key className="h-4 w-4" />} onClick={openDialog}>
        Cấp quyền mới
      </AdminActionButton>

      <AdminModal
        open={open}
        onClose={closeDialog}
        title="Cấp quyền quản trị mới"
        description="Nhập email và lựa chọn phân vai hệ thống. Một thư mời kích hoạt bảo mật sẽ được gửi tự động tới địa chỉ email."
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
              {isPending ? 'Đang gửi thư mời…' : 'Gửi thư mời'}
            </button>
          </>
        }
      >
        <form id={formId} action={formAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-bold text-slate-600">
              Email quản trị <span className="text-[#E31E24]">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="admin@gnest.vn"
              className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] rounded-lg px-3 py-2.5 text-slate-800 text-xs"
            />
          </div>

          <div>
            <label htmlFor="role" className="mb-1 block text-xs font-bold text-slate-600">
              Vai trò hệ thống <span className="text-[#E31E24]">*</span>
            </label>
            <select
              id="role"
              name="role"
              required
              defaultValue="viewer"
              className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] rounded-lg px-3 py-2.5 text-slate-800 text-xs"
            >
              {Object.entries(ADMIN_ROLE_LABELS).map(([role, label]) => (
                <option key={role} value={role}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {state.error ? (
            <div className="rounded-xl border border-red-200 bg-[#FFF5F5] p-3 text-xs text-[#B42318] font-medium leading-relaxed">
              {state.error}
            </div>
          ) : null}
        </form>
      </AdminModal>
    </>
  );
}
