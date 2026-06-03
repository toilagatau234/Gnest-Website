'use client';

import { useActionState, useEffect, useId, useMemo, useState } from 'react';
import { Loader2, KeyRound, ShieldCheck, UserPlus2 } from 'lucide-react';

import { AdminActionButton } from '@/components/admin/AdminActionButton';
import { AdminModal } from '@/components/admin/AdminModal';
import { useToast } from '@/components/admin/AdminToast';
import { inviteAdminUserAction, type AdminFormState } from '@/app/admin/(dashboard)/admin-users/actions';
import { ADMIN_ROLE_LABELS } from '@/lib/types/admin';

const INITIAL_STATE: AdminFormState = { ok: false };
const INTERNAL_EMAIL_DOMAIN = 'internal.admin.gnest.local';

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

interface DialogContentProps {
  formId: string;
  onClose: () => void;
}

function DialogContent({ formId, onClose }: DialogContentProps) {
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [state, formAction, isPending] = useActionState(inviteAdminUserAction, INITIAL_STATE);

  useEffect(() => {
    if (state.ok) {
      toast('Tai khoan noi bo da duoc tao. Sao chep mat khau tam truoc khi dong.', 'success');
    }
  }, [state.ok, toast]);

  const previewLoginEmail = useMemo(() => {
    const safeUsername = normalizeUsername(username);
    return safeUsername ? `${safeUsername}@${INTERNAL_EMAIL_DOMAIN}` : `username@${INTERNAL_EMAIL_DOMAIN}`;
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
              Tai khoan da duoc kich hoat. Nhan su can doi mat khau ngay sau khi dang nhap lan dau.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Email dang nhap</p>
          <p className="mt-1 break-all text-sm font-semibold text-slate-900">
            {state.createdUser.loginEmail}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">Mat khau tam</p>
          <p className="mt-1 break-all font-mono text-sm font-bold text-amber-950">
            {state.createdUser.temporaryPassword}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
        <p className="font-bold text-slate-800">Luu y ban giao</p>
        <p className="mt-1 leading-relaxed">
          Chia se thong tin dang nhap qua kenh noi bo an toan. Sau khi doi mat khau, co `force_password_change`
          se tu dong duoc go.
        </p>
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={onClose} className="admin-button-primary px-6 text-xs">
          Da sao chep, dong lai
        </button>
      </div>
    </div>
  ) : (
    <form id={formId} action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-bold text-slate-600">
            Ten hien thi <span className="text-[#E31E24]">*</span>
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
            placeholder="VD: Nguyen Van An"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-bold text-slate-600">
            Ten dang nhap <span className="text-[#E31E24]">*</span>
          </span>
          <input
            name="username"
            type="text"
            required
            value={username}
            onChange={(event) => {
              setUsernameTouched(true);
              setUsername(normalizeUsername(event.target.value));
            }}
            placeholder="nguyen.van.an"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
          />
          <span className="mt-1.5 block text-[10px] font-medium leading-relaxed text-slate-400">
            Chi dung chu thuong, so va cac ky tu `.`, `_`, `-`.
          </span>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-bold text-slate-600">Email lien he</span>
          <input
            name="contact_email"
            type="email"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
            placeholder="nhansu@gnest.vn"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
          />
          <span className="mt-1.5 block text-[10px] font-medium leading-relaxed text-slate-400">
            Dung de lien he noi bo, khong phai email dang nhap.
          </span>
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-bold text-slate-600">
            Vai tro he thong <span className="text-[#E31E24]">*</span>
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
          Login preview
        </p>
        <p className="mt-1 break-all text-sm font-semibold text-slate-900">{previewLoginEmail}</p>
        <p className="mt-1 text-[10px] font-medium text-slate-500">
          He thong se tao mat khau tam va yeu cau doi mat khau sau khi dang nhap lan dau.
        </p>
      </div>

      {state.error ? (
        <div className="rounded-xl border border-red-200 bg-[#FFF5F5] p-3 text-xs font-medium leading-relaxed text-[#B42318]">
          {state.error}
        </div>
      ) : null}

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} disabled={isPending} className="admin-button-secondary px-5 text-xs">
          Huy
        </button>
        <button type="submit" form={formId} disabled={isPending} className="admin-button-primary px-6 text-xs">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isPending ? 'Dang tao tai khoan...' : 'Tao tai khoan'}
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
        Tao tai khoan
      </AdminActionButton>

      <AdminModal
        open={open}
        onClose={closeDialog}
        title="Tao tai khoan quan tri noi bo"
        description="Cap tai khoan dang nhap noi bo cho nhan su. He thong se tao email dang nhap noi bo, mat khau tam va bat buoc doi mat khau o lan dang nhap dau tien."
        size="lg"
        footer={null}
      >
        {open ? <DialogContent key={sessionKey} formId={formId} onClose={closeDialog} /> : null}
      </AdminModal>
    </>
  );
}
