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
  currentAdminId: string;
}

export interface SetAdminUserActiveInput {
  userId: string;
  isActive: boolean;
  currentAdminId: string;
}

export interface RemoveAdminUserInput {
  userId: string;
  currentAdminId: string;
}

export interface AdminUserActionResult<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
}

export async function getAdminUsers(): Promise<{ data: AdminUserListItem[]; error: string | null }> {
  try {
    await requireAdminAuth();
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, email, role, is_active, created_at, updated_at')
      .order('created_at', { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data ?? []) as AdminUserListItem[], error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : 'Không thể tải danh sách tài khoản quản trị.',
    };
  }
}

export async function inviteAdminUser(
  input: CreateAdminUserInput
): Promise<AdminUserActionResult<AdminUserListItem>> {
  try {
    const actor = await requireAdminAuth(['super_admin']);
    const supabase = createServiceRoleClient();
    
    const email = input.email.trim().toLowerCase();
    
    // Check if the user already exists in admin_users database
    const { data: existingUser, error: checkError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', email)
      .maybeSingle();
      
    if (checkError) {
      return { ok: false, error: checkError.message };
    }
    
    if (existingUser) {
      return { ok: false, error: 'Tài khoản quản trị với email này đã tồn tại trong hệ thống.' };
    }

    // Call inviteUserByEmail
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/login`,
    });

    if (inviteError) {
      return { ok: false, error: `Lỗi gửi thư mời: ${inviteError.message}` };
    }

    const authUser = inviteData.user;
    if (!authUser) {
      return { ok: false, error: 'Không thể khởi tạo tài khoản trên hệ thống Auth.' };
    }

    // Insert into public.admin_users
    const { data: newUser, error: insertError } = await supabase
      .from('admin_users')
      .insert({
        id: authUser.id,
        email: email,
        role: input.role,
        is_active: true,
      })
      .select('id, email, role, is_active, created_at, updated_at')
      .single();

    if (insertError) {
      // Clean up orphan auth user in rollback flow
      await supabase.auth.admin.deleteUser(authUser.id);
      return { ok: false, error: `Lỗi lưu trữ dữ liệu phân quyền: ${insertError.message}` };
    }

    // Write audit log
    await supabase.from('audit_logs').insert({
      actor_id: actor.id,
      action: 'create',
      entity: 'admin_users',
      entity_id: newUser.id,
      metadata: { email: newUser.email, role: newUser.role },
    });

    return { ok: true, data: newUser as AdminUserListItem };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Không thể mời tài khoản quản trị.' };
  }
}

export async function updateAdminUserRole(
  input: UpdateAdminUserRoleInput
): Promise<AdminUserActionResult<AdminUserListItem>> {
  try {
    const actor = await requireAdminAuth(['super_admin']);
    const supabase = createServiceRoleClient();

    if (input.userId === input.currentAdminId) {
      return { ok: false, error: 'Bạn không thể tự thay đổi vai trò của chính mình.' };
    }

    // Get old user details for checks and audit log
    const { data: targetUser, error: targetError } = await supabase
      .from('admin_users')
      .select('id, email, role, is_active')
      .eq('id', input.userId)
      .maybeSingle();

    if (targetError || !targetUser) {
      return { ok: false, error: 'Không tìm thấy tài khoản cần cập nhật vai trò.' };
    }

    const oldRole = targetUser.role;

    // Last active super admin safeguard
    if (oldRole === 'super_admin' && input.role !== 'super_admin') {
      const { count, error: countError } = await supabase
        .from('admin_users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'super_admin')
        .eq('is_active', true);

      if (countError) {
        return { ok: false, error: countError.message };
      }

      if ((count ?? 0) <= 1) {
        return { ok: false, error: 'Không thể hạ cấp tài khoản vì đây là tài khoản Super Admin hoạt động duy nhất.' };
      }
    }

    // Update in database
    const { data: updated, error: updateError } = await supabase
      .from('admin_users')
      .update({ role: input.role })
      .eq('id', input.userId)
      .select('id, email, role, is_active, created_at, updated_at')
      .single();

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    // Write audit log
    await supabase.from('audit_logs').insert({
      actor_id: actor.id,
      action: 'update',
      entity: 'admin_users',
      entity_id: updated.id,
      metadata: { email: updated.email, old_role: oldRole, new_role: updated.role },
    });

    return { ok: true, data: updated as AdminUserListItem };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Không thể cập nhật vai trò quản trị.' };
  }
}

export async function setAdminUserActive(
  userId: string,
  isActive: boolean,
  currentAdminId: string
): Promise<AdminUserActionResult<AdminUserListItem>> {
  try {
    const actor = await requireAdminAuth(['super_admin']);
    const supabase = createServiceRoleClient();

    if (userId === currentAdminId) {
      return { ok: false, error: 'Bạn không thể tự vô hiệu hóa tài khoản của chính mình.' };
    }

    // Get target user details for check
    const { data: targetUser, error: targetError } = await supabase
      .from('admin_users')
      .select('id, email, role, is_active')
      .eq('id', userId)
      .maybeSingle();

    if (targetError || !targetUser) {
      return { ok: false, error: 'Không tìm thấy tài khoản cần cập nhật trạng thái.' };
    }

    // Last active super admin safeguard
    if (targetUser.role === 'super_admin' && !isActive) {
      const { count, error: countError } = await supabase
        .from('admin_users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'super_admin')
        .eq('is_active', true);

      if (countError) {
        return { ok: false, error: countError.message };
      }

      if ((count ?? 0) <= 1) {
        return { ok: false, error: 'Không thể vô hiệu hóa tài khoản vì đây là tài khoản Super Admin hoạt động duy nhất.' };
      }
    }

    // Update in database
    const { data: updated, error: updateError } = await supabase
      .from('admin_users')
      .update({ is_active: isActive })
      .eq('id', userId)
      .select('id, email, role, is_active, created_at, updated_at')
      .single();

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    // Write audit log
    await supabase.from('audit_logs').insert({
      actor_id: actor.id,
      action: isActive ? 'activate' : 'deactivate',
      entity: 'admin_users',
      entity_id: updated.id,
      metadata: { email: updated.email, is_active: updated.is_active },
    });

    return { ok: true, data: updated as AdminUserListItem };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Không thể cập nhật trạng thái tài khoản.' };
  }
}

export async function removeAdminUserAccess(
  userId: string,
  currentAdminId: string
): Promise<AdminUserActionResult<AdminUserListItem>> {
  try {
    const actor = await requireAdminAuth(['super_admin']);
    const supabase = createServiceRoleClient();

    if (userId === currentAdminId) {
      return { ok: false, error: 'Bạn không thể tự xóa tài khoản của chính mình.' };
    }

    // Get details for check
    const { data: targetUser, error: targetError } = await supabase
      .from('admin_users')
      .select('id, email, role, is_active')
      .eq('id', userId)
      .maybeSingle();

    if (targetError || !targetUser) {
      return { ok: false, error: 'Không tìm thấy tài khoản cần xóa truy cập.' };
    }

    // Last active super admin safeguard
    if (targetUser.role === 'super_admin') {
      const { count, error: countError } = await supabase
        .from('admin_users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'super_admin')
        .eq('is_active', true);

      if (countError) {
        return { ok: false, error: countError.message };
      }

      if ((count ?? 0) <= 1) {
        return { ok: false, error: 'Không thể xóa tài khoản vì đây là tài khoản Super Admin hoạt động duy nhất.' };
      }
    }

    // Delete user from Supabase Auth
    // Because of foreign key with 'ON DELETE CASCADE' in DB schema,
    // this automatically deletes the admin_users record in the database!
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      return { ok: false, error: `Lỗi xóa tài khoản auth: ${deleteAuthError.message}` };
    }

    // Write audit log
    await supabase.from('audit_logs').insert({
      actor_id: actor.id,
      action: 'delete',
      entity: 'admin_users',
      entity_id: userId,
      metadata: { email: targetUser.email, role: targetUser.role },
    });

    return { ok: true, data: targetUser as AdminUserListItem };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Không thể xóa quyền truy cập quản trị.' };
  }
}
