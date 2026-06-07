'use server';

import { revalidatePath } from 'next/cache';

import {
  inviteAdminUser,
  removeAdminUserAccess,
  resetAdminUserPassword,
  setAdminUserActive,
  updateAdminUserRole,
  type CreatedAdminUserPayload,
} from '@/lib/services/admin/admin-users';
import { requireAdminAuth } from '@/lib/services/admin/auth';
import type { AdminRole } from '@/lib/types/database';

export type AdminFormState = {
  ok: boolean;
  error?: string;
  createdUser?: CreatedAdminUserPayload;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function revalidateAdminUsers() {
  revalidatePath('/admin/admin-users');
  revalidatePath('/admin/dashboard');
}

export async function inviteAdminUserAction(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  try {
    const displayName = readString(formData, 'display_name');
    const username = readString(formData, 'username');
    const contactEmail = readString(formData, 'contact_email');
    const role = readString(formData, 'role') as AdminRole;

    if (!displayName) {
      return { ok: false, error: 'Tên hiển thị là bắt buộc.' };
    }

    if (!username) {
      return { ok: false, error: 'Tên email là bắt buộc.' };
    }

    if (contactEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactEmail)) {
        return { ok: false, error: 'Email liên hệ không đúng định dạng.' };
      }
    }

    if (!role) {
      return { ok: false, error: 'Vai trò là bắt buộc.' };
    }

    const { ok, data, error } = await inviteAdminUser({
      displayName,
      username,
      contactEmail,
      role,
    });

    if (!ok || error || !data) {
      return { ok: false, error: error || 'Không thể tạo tài khoản quản trị.' };
    }

    revalidateAdminUsers();
    return { ok: true, createdUser: data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Không thể tạo tài khoản quản trị.',
    };
  }
}

export async function updateAdminUserRoleAction(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  try {
    const userId = readString(formData, 'userId');
    const role = readString(formData, 'role') as AdminRole;

    if (!userId) {
      return { ok: false, error: 'Thiếu ID người dùng.' };
    }

    if (!role) {
      return { ok: false, error: 'Vai trò là bắt buộc.' };
    }

    const actor = await requireAdminAuth(['super_admin']);
    const { ok, error } = await updateAdminUserRole({
      userId,
      role,
      currentAdminId: actor.id,
    });

    if (!ok || error) {
      return { ok: false, error: error || 'Không thể cập nhật vai trò.' };
    }

    revalidateAdminUsers();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Không thể cập nhật vai trò.' };
  }
}

export async function toggleAdminUserActiveAction(formData: FormData): Promise<void> {
  const userId = readString(formData, 'id');
  const isActive = readString(formData, 'next_is_active') === 'true';

  if (!userId) {
    throw new Error('Thiếu ID người dùng.');
  }

  const actor = await requireAdminAuth(['super_admin']);
  const { ok, error } = await setAdminUserActive(userId, isActive, actor.id);

  if (!ok || error) {
    throw new Error(error || 'Không thể đổi trạng thái tài khoản.');
  }

  revalidateAdminUsers();
}

export async function removeAdminUserAccessAction(userId: string): Promise<AdminFormState> {
  if (!userId) {
    return { ok: false, error: 'Thiếu ID người dùng.' };
  }

  try {
    const actor = await requireAdminAuth(['super_admin']);
    const { ok, error } = await removeAdminUserAccess(userId, actor.id);

    if (!ok || error) {
      return { ok: false, error: error || 'Không thể xóa quyền truy cập.' };
    }

    revalidateAdminUsers();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Không thể xóa quyền truy cập.',
    };
  }
}

export async function resetAdminUserPasswordAction(
  userId: string
): Promise<AdminFormState & { temporaryPassword?: string }> {
  if (!userId) {
    return { ok: false, error: 'Thiếu ID người dùng.' };
  }

  try {
    const actor = await requireAdminAuth(['super_admin']);
    const { ok, data, error } = await resetAdminUserPassword(userId, actor.id);

    if (!ok || error || !data) {
      return { ok: false, error: error || 'Không thể đặt lại mật khẩu.' };
    }

    revalidateAdminUsers();
    return { ok: true, temporaryPassword: data.temporaryPassword };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Không thể đặt lại mật khẩu.',
    };
  }
}
