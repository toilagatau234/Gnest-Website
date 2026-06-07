'use server';

import { revalidatePath } from 'next/cache';

import {
  inviteAdminUser,
  updateAdminUserRole,
  setAdminUserActive,
  removeAdminUserAccess,
  resetAdminUserPassword,
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
      return { ok: false, error: 'Ten hien thi la bat buoc.' };
    }

    if (!username) {
      return { ok: false, error: 'Ten dang nhap la bat buoc.' };
    }

    if (contactEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactEmail)) {
        return { ok: false, error: 'Email lien he khong dung dinh dang.' };
      }
    }

    if (!role) {
      return { ok: false, error: 'Vai tro la bat buoc.' };
    }

    const { ok, data, error } = await inviteAdminUser({
      displayName,
      username,
      contactEmail,
      role,
    });

    if (!ok || error || !data) {
      return { ok: false, error: error || 'Khong the tao tai khoan quan tri noi bo.' };
    }

    revalidateAdminUsers();
    return { ok: true, createdUser: data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Khong the tao tai khoan quan tri noi bo.',
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
      return { ok: false, error: 'Thieu ID nguoi dung.' };
    }

    if (!role) {
      return { ok: false, error: 'Vai tro la bat buoc.' };
    }

    const actor = await requireAdminAuth(['super_admin']);
    const { ok, error } = await updateAdminUserRole({
      userId,
      role,
      currentAdminId: actor.id,
    });

    if (!ok || error) {
      return { ok: false, error: error || 'Khong the cap nhat vai tro.' };
    }

    revalidateAdminUsers();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Khong the cap nhat vai tro.' };
  }
}

export async function toggleAdminUserActiveAction(formData: FormData): Promise<void> {
  const userId = readString(formData, 'id');
  const isActive = readString(formData, 'next_is_active') === 'true';

  if (!userId) {
    throw new Error('Thieu ID nguoi dung.');
  }

  const actor = await requireAdminAuth(['super_admin']);
  const { ok, error } = await setAdminUserActive(userId, isActive, actor.id);

  if (!ok || error) {
    throw new Error(error || 'Khong the doi trang thai tai khoan.');
  }

  revalidateAdminUsers();
}

export async function removeAdminUserAccessAction(userId: string): Promise<AdminFormState> {
  if (!userId) {
    return { ok: false, error: 'Thieu ID nguoi dung.' };
  }

  try {
    const actor = await requireAdminAuth(['super_admin']);
    const { ok, error } = await removeAdminUserAccess(userId, actor.id);

    if (!ok || error) {
      return { ok: false, error: error || 'Khong the xoa quyen truy cap.' };
    }

    revalidateAdminUsers();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Khong the xoa quyen truy cap.',
    };
  }
}

export async function resetAdminUserPasswordAction(
  userId: string
): Promise<AdminFormState & { temporaryPassword?: string }> {
  if (!userId) {
    return { ok: false, error: 'Thieu ID nguoi dung.' };
  }

  try {
    const actor = await requireAdminAuth(['super_admin']);
    const { ok, data, error } = await resetAdminUserPassword(userId, actor.id);

    if (!ok || error || !data) {
      return { ok: false, error: error || 'Khong the reset mat khau.' };
    }

    revalidateAdminUsers();
    return { ok: true, temporaryPassword: data.temporaryPassword };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Khong the reset mat khau.',
    };
  }
}
