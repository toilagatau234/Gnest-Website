'use client';

import { useActionState, useEffect, useId, useMemo, useState } from 'react';
import { KeyRound, Loader2, ShieldCheck, UserPlus2 } from 'lucide-react';

import { inviteAdminUserAction, type AdminFormState } from '@/app/admin/(dashboard)/admin-users/actions';
import { AdminActionButton } from '@/components/admin/AdminActionButton';
import { AdminModal } from '@/components/admin/AdminModal';
import { useToast } from '@/components/admin/AdminToast';
import { ADMIN_ROLE_LABELS } from '@/lib/types/admin';

const INITIAL_STATE: AdminFormState = { ok: false };
const ADMIN_EMAIL_DOMAIN = 'gnest.com';

function normalizeUsername(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/[._-]{2,}/g, '.')
    .replace(/^[._-]+|[._-]+$/g, '');
}

function cleanUsernameInput(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9._-]/g, '');
}

interface DialogContentProps {
  formId: string;
  onClose: () => void;
}

function DialogContent({ formId, onClose }: DialogContentProps) {
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [state, formAction, isPending] = useActionState(inviteAdminUserAction, INITIAL_STATE);

  useEffect(() => {
    if (state.ok) {
      toast(
        'Tài khoản quản trị đã được tạo. Sao chép mật khẩu mặc định trước khi đóng.',
        'success'
      );
    }
  }, [state.ok, toast]);

  const previewLoginEmail = useMemo(() => {
    const safeUsername = normalizeUsername(username);
    return safeUsername ? `${safeUsername}@${ADMIN_EMAIL_DOMAIN}` : `dev.it@${ADMIN_EMAIL_DOMAIN}`;
  }, [username]);

  return state.ok && state.createdUser ? (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-emerald-900">
              {state.createdUser.user.display_name ?? state.createdUser.user.email}
            </p>
            <p className="mt-1 text-xs font-medium text-emerald-800">
              Tài khoản đã được kích hoạt. Nhân sự cần đổi mật khẩu ngay sau khi đăng nhập lần đầu.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Email đăng nhập
          </p>
          <p className="mt-1 break-all text-sm font-semibold text-slate-900">
            {state.createdUser.loginEmail}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">
            Mật khẩu tạm (hiển thị một lần)
          </p>
          <p className="mt-1 break-all font-mono text-sm font-bold text-amber-950">
            {state.createdUser.temporaryPassword}
          </p>
          <p className="mt-1 text-[10px] font-medium text-amber-800">
            Sao chép ngay — mật khẩu này sẽ không hiển thị lại. Dùng cho lần đăng nhập đầu tiên.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
        <p className="font-bold text-slate-800">Lưu ý bàn giao</p>
        <p className="mt-1 leading-relaxed">
          Chia sẻ email đăng nhập và mật khẩu tạm phía trên qua kênh an toàn. Mật khẩu này chỉ
          hiển thị một lần. Sau khi người dùng đổi mật khẩu, cờ{' '}
          <code>force_password_change</code> sẽ tự động được gỡ.
        </p>
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={onClose} className="admin-button-primary px-6 text-xs">
          Đã sao chép, đóng lại
        </button>
      </div>
    </div>
  ) : (
    <form id={formId} action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-bold text-slate-600">
            Tên hiển thị <span className="text-[#E31E24]">*</span>
          </span>
          <input
            name="display_name"
            type="text"
            required
            value={displayName}
            onChange={(event) => {
              const nextValue = event.target.value;
              setDisplayName(nextValue);
              if (!usernameTouched) {
                setUsername(normalizeUsername(nextValue));
              }
            }}
            placeholder="VD: Nguyễn Văn An"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-bold text-slate-600">
            Tên email (tên đăng nhập) <span className="text-[#E31E24]">*</span>
          </span>
          <input
            name="username"
            type="text"
            required
            value={username}
            onChange={(event) => {
              setUsernameTouched(true);
              setUsername(cleanUsernameInput(event.target.value));
            }}
            onBlur={() => setUsername((curr) => normalizeUsername(curr))}
            placeholder="dev.it"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
          />
          <span className="mt-1.5 block text-[10px] font-medium leading-relaxed text-slate-400">
            Không nhập @{ADMIN_EMAIL_DOMAIN}. Hệ thống sẽ tự thêm phần đuôi email.
          </span>
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-bold text-slate-600">
            Vai trò hệ thống <span className="text-[#E31E24]">*</span>
          </span>
          <select
            name="role"
            required
            defaultValue="viewer"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
          >
            {Object.entries(ADMIN_ROLE_LABELS).map(([role, label]) => (
              <option key={role} value={role}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
          <UserPlus2 className="h-3.5 w-3.5 text-[#1B3A6B]" />
          Xem trước email đăng nhập
        </p>
        <p className="mt-1 break-all text-sm font-semibold text-slate-900">{previewLoginEmail}</p>
        <p className="mt-1 text-[10px] font-medium text-slate-500">
          Hệ thống sẽ sinh một mật khẩu tạm ngẫu nhiên và hiển thị sau khi tạo tài khoản. Người
          dùng buộc phải đổi mật khẩu ngay ở lần đăng nhập đầu tiên.
        </p>
      </div>

      {state.error ? (
        <div className="rounded-xl border border-red-200 bg-[#FFF5F5] p-3 text-xs font-medium leading-relaxed text-[#B42318]">
          {state.error}
        </div>
      ) : null}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
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
          {isPending ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
        </button>
      </div>
    </form>
  );
}

export function AdminUserInviteDialog() {
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  const openDialog = () => {
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setSessionKey((current) => current + 1);
  };

  return (
    <>
      <AdminActionButton icon={<KeyRound className="h-4 w-4" />} onClick={openDialog}>
        Tạo tài khoản
      </AdminActionButton>

      <AdminModal
        open={open}
        onClose={closeDialog}
        title="Tạo tài khoản quản trị"
        description="Hệ thống sẽ tự thêm @gnest.com, sinh mật khẩu tạm ngẫu nhiên (hiển thị một lần) và yêu cầu đổi mật khẩu ở lần đăng nhập đầu tiên."
        size="lg"
        footer={null}
      >
        {open ? <DialogContent key={sessionKey} formId={formId} onClose={closeDialog} /> : null}
      </AdminModal>
    </>
  );
}
