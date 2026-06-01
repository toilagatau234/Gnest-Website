'use server';

import { revalidatePath } from 'next/cache';
import {
  inviteAdminUser,
  updateAdminUserRole,
  setAdminUserActive,
  removeAdminUserAccess,
} from '@/lib/services/admin/admin-users';
import { requireAdminAuth } from '@/lib/services/admin/auth';
import type { AdminRole } from '@/lib/types/database';

export type AdminFormState = { ok: boolean; error?: string };

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
  formData: FormData
): Promise<AdminFormState> {
  try {
    const email = readString(formData, 'email');
    const role = readString(formData, 'role') as AdminRole;

    if (!email) {
      return { ok: false, error: 'Email là bắt buộc.' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { ok: false, error: 'Email không đúng định dạng.' };
    }

    if (!role) {
      return { ok: false, error: 'Vai trò là bắt buộc.' };
    }

    const { ok, error } = await inviteAdminUser({ email, role });
    if (!ok || error) {
      return { ok: false, error: error || 'Không thể mời người dùng quản trị.' };
    }

    revalidateAdminUsers();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Không thể mời người dùng quản trị.' };
  }
}

export async function updateAdminUserRoleAction(
  _prevState: AdminFormState,
  formData: FormData
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
    return { ok: false, error: err instanceof Error ? err.message : 'Không thể xóa quyền truy cập.' };
  }
}
