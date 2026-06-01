'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { UserCheck, UserX, Trash2, Loader2, Key } from 'lucide-react';

import { AdminConfirmDialog } from '@/components/admin/AdminConfirmDialog';
import { AdminUserRoleDialog } from '@/components/admin/AdminUserRoleDialog';
import { useToast } from '@/components/admin/AdminToast';
import type { AdminUserListItem } from '@/lib/services/admin/admin-users';
import {
  toggleAdminUserActiveAction,
  removeAdminUserAccessAction,
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
    </div>
  );
}
