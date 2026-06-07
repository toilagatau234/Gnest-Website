'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { UserCheck, UserX, Trash2, Loader2, Key, RefreshCw, KeyRound, AlertTriangle, Check, Copy, ShieldCheck } from 'lucide-react';

import { AdminConfirmDialog } from '@/components/admin/AdminConfirmDialog';
import { AdminUserRoleDialog } from '@/components/admin/AdminUserRoleDialog';
import { AdminModal } from '@/components/admin/AdminModal';
import { useToast } from '@/components/admin/AdminToast';
import type { AdminUserListItem } from '@/lib/services/admin/admin-users';
import {
  toggleAdminUserActiveAction,
  removeAdminUserAccessAction,
  resetAdminUserPasswordAction,
} from '@/app/admin/(dashboard)/admin-users/actions';
import type { AdminRole } from '@/lib/types/database';

interface AdminUserRowActionsProps {
  user: AdminUserListItem;
  currentAdminId: string;
  currentUserRole: AdminRole;
}

export function AdminUserRowActions({ user, currentAdminId, currentUserRole }: AdminUserRowActionsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isToggling, startToggle] = useTransition();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetPending, startResetTransition] = useTransition();
  const [resetError, setResetError] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleResetOpen = () => {
    setResetError(null);
    setTemporaryPassword(null);
    setCopied(false);
    setResetDialogOpen(true);
  };

  const handleCloseResetDialog = () => {
    setResetDialogOpen(false);
    if (temporaryPassword) {
      router.refresh();
    }
  };

  const handleResetConfirm = () => {
    setResetError(null);
    startResetTransition(async () => {
      try {
        const res = await resetAdminUserPasswordAction(user.id);
        if (res.ok && res.temporaryPassword) {
          setTemporaryPassword(res.temporaryPassword);
          toast(`Đã reset mật khẩu tài khoản ${user.email} thành công.`, 'success');
        } else {
          setResetError(res.error ?? 'Không thể đặt lại mật khẩu.');
        }
      } catch (err) {
        setResetError(err instanceof Error ? err.message : 'Đã xảy ra lỗi.');
      }
    });
  };

  const handleCopy = () => {
    if (!temporaryPassword) return;
    navigator.clipboard.writeText(temporaryPassword);
    setCopied(true);
    toast('Đã sao chép mật khẩu tạm vào bộ nhớ tạm.', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  // Non-super_admin accounts are completely restricted from modifying users
  if (currentUserRole !== 'super_admin') {
    return <span className="text-[10px] text-slate-400 font-medium font-mono select-none">READ ONLY</span>;
  }

  const isSelf = user.id === currentAdminId;

  const handleToggleActive = () => {
    if (isSelf) {
      toast('Bạn không thể tự khóa tài khoản của chính mình.', 'error');
      return;
    }

    startToggle(async () => {
      const formData = new FormData();
      formData.set('id', user.id);
      formData.set('next_is_active', String(!user.is_active));

      try {
        await toggleAdminUserActiveAction(formData);
        toast(user.is_active ? 'Đã khóa tài khoản quản trị.' : 'Đã mở khóa tài khoản quản trị.', 'success');
        router.refresh();
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Không thể thay đổi trạng thái tài khoản.', 'error');
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {/* 1. Change Role Action */}
      <button
        type="button"
        disabled={isSelf}
        onClick={() => setRoleDialogOpen(true)}
        className="admin-focus inline-flex h-8 items-center gap-1 rounded-lg border border-[#E5E7EF] bg-white px-2.5 text-[10px] font-bold text-slate-600 transition-[transform,border-color,background-color,color] hover:-translate-y-0.5 hover:border-[#1B3A6B] hover:bg-[#1B3A6B]/5 hover:text-[#1B3A6B] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        title={isSelf ? 'Không thể tự thay đổi vai trò của chính mình' : 'Thay đổi vai trò'}
      >
        <Key className="h-3 w-3" />
        Sửa vai trò
      </button>

      {/* 2. Toggle Active/Locked Status */}
      <button
        type="button"
        onClick={handleToggleActive}
        disabled={isToggling || isSelf}
        className="admin-focus inline-flex h-8 items-center gap-1 rounded-lg border border-[#E5E7EF] bg-white px-2.5 text-[10px] font-bold text-slate-600 transition-[transform,border-color,background-color,color] hover:-translate-y-0.5 hover:border-[#4880FF] hover:bg-[#4880FF]/5 hover:text-[#3749A6] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        title={isSelf ? 'Không thể tự khóa tài khoản của chính mình' : user.is_active ? 'Khóa tài khoản' : 'Mở khóa'}
      >
        {isToggling ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : user.is_active ? (
          <UserX className="h-3 w-3 text-amber-500" />
        ) : (
          <UserCheck className="h-3 w-3 text-emerald-500" />
        )}
        {user.is_active ? 'Khóa' : 'Mở khóa'}
      </button>

      {/* 2.5. Reset Password Action */}
      <button
        type="button"
        onClick={handleResetOpen}
        disabled={isSelf}
        className="admin-focus inline-flex h-8 items-center gap-1 rounded-lg border border-[#E5E7EF] bg-white px-2.5 text-[10px] font-bold text-slate-600 transition-[transform,border-color,background-color,color] hover:-translate-y-0.5 hover:border-amber-500 hover:bg-amber-50/50 hover:text-amber-700 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        title={isSelf ? 'Không thể tự reset mật khẩu của chính mình' : 'Reset mật khẩu'}
      >
        <RefreshCw className="h-3 w-3" />
        Reset mật khẩu
      </button>

      {/* 3. Delete Access Action */}
      <button
        type="button"
        disabled={isSelf}
        onClick={() => setConfirmDeleteOpen(true)}
        aria-label="Xóa quyền truy cập"
        title={isSelf ? 'Không thể tự xóa tài khoản của chính mình' : 'Xóa tài khoản'}
        className="admin-focus inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EF] bg-white text-slate-500 transition-[transform,border-color,background-color,color] hover:-translate-y-0.5 hover:border-[#E31E24] hover:bg-[#E31E24]/5 hover:text-[#E31E24] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      {/* Role Dialog */}
      {roleDialogOpen && (
        <AdminUserRoleDialog
          user={user}
          open={roleDialogOpen}
          onClose={() => setRoleDialogOpen(false)}
        />
      )}

      {/* Access Removal Confirmation */}
      <AdminConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Xóa quyền truy cập quản trị"
        description="Hành động này sẽ xóa vĩnh viễn tài khoản quản trị viên này khỏi hệ thống. Người dùng sẽ không thể đăng nhập vào CMS được nữa."
        itemName={user.email}
        confirmLabel="Xóa tài khoản"
        onConfirm={() => removeAdminUserAccessAction(user.id)}
        onSuccess={() => {
          toast(`Đã xóa quyền truy cập của tài khoản ${user.email} thành công.`, 'success');
          router.refresh();
        }}
      />

      {/* Reset Password Modal */}
      {resetDialogOpen && (
        <AdminModal
          open={resetDialogOpen}
          onClose={handleCloseResetDialog}
          title={temporaryPassword ? "Cấp lại mật khẩu thành công" : "Đặt lại mật khẩu quản trị viên"}
          size="sm"
          dismissible={!resetPending}
          footer={
            <>
              {temporaryPassword ? (
                <button
                  type="button"
                  onClick={handleCloseResetDialog}
                  className="admin-button-primary px-6 text-xs"
                >
                  Đã sao chép, đóng lại
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCloseResetDialog}
                    disabled={resetPending}
                    className="admin-button-secondary px-5 text-xs"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleResetConfirm}
                    disabled={resetPending}
                    className="admin-focus inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-amber-600 hover:bg-amber-700 px-5 text-xs font-extrabold text-white shadow-sm transition-[transform,background-color] duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {resetPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {resetPending ? 'Đang đặt lại…' : 'Xác nhận Đặt lại'}
                  </button>
                </>
              )}
            </>
          }
        >
          {temporaryPassword ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-emerald-800">
                      Mật khẩu của tài khoản <strong>{user.display_name || user.email}</strong> đã được đặt lại thành công.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Tài khoản</p>
                  <p className="mt-1 break-all text-xs font-semibold text-slate-900">{user.email}</p>
                </div>
                
                <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Mật khẩu tạm mới</p>
                    <p className="mt-1 break-all font-mono text-sm font-bold text-amber-950">{temporaryPassword}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-700 transition hover:bg-amber-50 hover:text-amber-800 active:scale-95"
                    title="Sao chép mật khẩu"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                * Lưu ý: Chia sẻ mật khẩu này an toàn. Hệ thống sẽ bắt buộc người dùng thay đổi mật khẩu ngay ở lần đăng nhập tiếp theo.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <div className="min-w-0 space-y-1">
                  <p className="text-sm leading-relaxed text-slate-600">
                    Đặt lại mật khẩu cho tài khoản quản trị viên:
                  </p>
                  <p className="break-words rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-[#EEF2F6]">
                    {user.email}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Sau khi đặt lại, mật khẩu hiện tại sẽ bị vô hiệu hóa ngay lập tức. Người dùng sẽ nhận mật khẩu tạm mới và buộc phải đổi mật khẩu khi đăng nhập lần đầu.
              </p>

              {resetError ? (
                <div className="rounded-xl border border-red-200 bg-[#FFF5F5] p-3 text-xs font-medium leading-relaxed text-[#B42318]">
                  {resetError}
                </div>
              ) : null}
            </div>
          )}
        </AdminModal>
      )}
    </div>
  );
}
