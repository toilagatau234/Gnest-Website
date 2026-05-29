import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { AdminRole, Tables } from '@/lib/types/database';

import { requireAdminAuth } from '@/lib/services/admin/auth';

export type AdminUserListItem = Pick<
  Tables<'admin_users'>,
  'id' | 'email' | 'role' | 'is_active' | 'created_at' | 'updated_at'
>;

export interface CreateAdminUserInput {
  email: string;
  role: AdminRole;
}

export interface UpdateAdminUserRoleInput {
  userId: string;
  role: AdminRole;
}

export interface PlaceholderAdminActionResult {
  ok: false;
  message: string;
  todo: string;
}

const STAFF_ADMIN_TODO =
  'TODO: Tạo staff thật cần server action hoặc route handler chạy với service role để tạo auth user, gửi luồng đặt mật khẩu, rồi mới ghi vào public.admin_users.';

export async function getAdminUsers() {
  await requireAdminAuth();

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, email, role, is_active, created_at, updated_at')
    .order('created_at', { ascending: true });

  if (error) {
    return {
      data: [] as AdminUserListItem[],
      error: error.message,
    };
  }

  return {
    data: (data ?? []) as AdminUserListItem[],
    error: null,
  };
}

export async function createAdminUserPlaceholder(
  _input: CreateAdminUserInput
): Promise<PlaceholderAdminActionResult> {
  await requireAdminAuth(['super_admin']);

  return {
    ok: false,
    message: 'Chưa triển khai tạo nhân sự quản trị từ UI.',
    todo: STAFF_ADMIN_TODO,
  };
}

export async function updateAdminUserRolePlaceholder(
  _input: UpdateAdminUserRoleInput
): Promise<PlaceholderAdminActionResult> {
  await requireAdminAuth(['super_admin']);

  return {
    ok: false,
    message: 'Chưa triển khai cập nhật role quản trị từ UI.',
    todo: STAFF_ADMIN_TODO,
  };
}

export async function deactivateAdminUserPlaceholder(
  _userId: string
): Promise<PlaceholderAdminActionResult> {
  await requireAdminAuth(['super_admin']);

  return {
    ok: false,
    message: 'Chưa triển khai vô hiệu hóa tài khoản quản trị từ UI.',
    todo: STAFF_ADMIN_TODO,
  };
}
