import 'server-only';

import { randomInt } from 'node:crypto';

import { requireAdminAuth } from '@/lib/services/admin/auth';
import { USER_MANAGER_ROLES } from '@/lib/services/admin/permissions';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { AdminRole, Tables } from '@/lib/types/database';

type AdminUserRow = Pick<
  Tables<'admin_users'>,
  'id' | 'email' | 'role' | 'is_active' | 'created_at' | 'updated_at'
>;

export interface AdminUserListItem extends AdminUserRow {
  display_name: string | null;
  username: string | null;
  contact_email: string | null;
  force_password_change: boolean;
}

export interface CreateAdminUserInput {
  displayName: string;
  username: string;
  role: AdminRole;
  contactEmail?: string;
}

export interface CreatedAdminUserPayload {
  user: AdminUserListItem;
  loginEmail: string;
  temporaryPassword: string;
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

export interface AdminUserActionResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

const ADMIN_USER_COLUMNS = 'id, email, role, is_active, created_at, updated_at';
const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9._-]{1,30}[a-z0-9])?$/;
const ADMIN_EMAIL_DOMAIN = 'gnest.com';
const TEMPORARY_PASSWORD_LENGTH = 16;

function normalizeNullableText(value: string | null | undefined) {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

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

function buildAdminLoginEmail(localPart: string) {
  return `${localPart}@${ADMIN_EMAIL_DOMAIN}`;
}

/**
 * Generates a cryptographically-random temporary password for new/reset admin accounts.
 * Guarantees at least one upper, lower, digit and special char, then shuffles so the
 * guaranteed characters are not in fixed positions. The value is shown once to the
 * super_admin for secure hand-off; users are forced to change it on first login.
 * Ambiguous characters (0/O, 1/l/I) are excluded to ease manual transcription.
 */
function generateTemporaryPassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%^&*?-_';
  const all = upper + lower + digits + special;

  const pick = (set: string) => set[randomInt(set.length)];
  const chars = [pick(upper), pick(lower), pick(digits), pick(special)];
  while (chars.length < TEMPORARY_PASSWORD_LENGTH) {
    chars.push(pick(all));
  }
  // Fisher-Yates shuffle using a CSPRNG.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

function readAuthMetadata(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

async function enrichAdminUsers(
  supabase: ReturnType<typeof createServiceRoleClient>,
  users: AdminUserRow[],
) {
  const enriched = await Promise.all(
    users.map(async (user) => {
      const { data } = await supabase.auth.admin.getUserById(user.id);
      const metadata = readAuthMetadata(data.user?.user_metadata);

      return {
        ...user,
        display_name: typeof metadata.display_name === 'string' ? metadata.display_name : null,
        username: typeof metadata.username === 'string' ? metadata.username : null,
        contact_email: typeof metadata.contact_email === 'string' ? metadata.contact_email : null,
        force_password_change: Boolean(metadata.force_password_change),
      } satisfies AdminUserListItem;
    }),
  );

  return enriched;
}

export async function getAdminUsers(): Promise<{ data: AdminUserListItem[]; error: string | null }> {
  try {
    await requireAdminAuth();
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('admin_users')
      .select(ADMIN_USER_COLUMNS)
      .order('created_at', { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    const users = await enrichAdminUsers(supabase, (data ?? []) as AdminUserRow[]);
    return { data: users, error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : 'Không thể tải danh sách tài khoản quản trị.',
    };
  }
}

export async function inviteAdminUser(
  input: CreateAdminUserInput,
): Promise<AdminUserActionResult<CreatedAdminUserPayload>> {
  try {
    const actor = await requireAdminAuth(USER_MANAGER_ROLES);
    const supabase = createServiceRoleClient();

    const displayName = input.displayName.trim();
    const rawUsername = input.username.trim();
    const username = normalizeUsername(rawUsername);
    const contactEmail = normalizeNullableText(input.contactEmail)?.toLowerCase() ?? null;

    if (!displayName) {
      return { ok: false, error: 'Tên hiển thị là bắt buộc.' };
    }

    if (!rawUsername) {
      return { ok: false, error: 'Tên email là bắt buộc.' };
    }

    if (rawUsername.includes('@') || !USERNAME_PATTERN.test(username)) {
      return {
        ok: false,
        error: 'Tên email chỉ được dùng chữ thường, số và . _ - (3-32 ký tự).',
      };
    }

    const loginEmail = buildAdminLoginEmail(username);

    const { data: existingUser, error: checkError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', loginEmail)
      .maybeSingle();

    if (checkError) {
      return { ok: false, error: checkError.message };
    }

    if (existingUser) {
      return { ok: false, error: 'Tên email này đã tồn tại trong hệ thống.' };
    }

    const temporaryPassword = generateTemporaryPassword();
    const { data: createdAuthUser, error: createAuthError } = await supabase.auth.admin.createUser({
      email: loginEmail,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        username,
        contact_email: contactEmail,
        force_password_change: true,
      },
    });

    if (createAuthError) {
      return { ok: false, error: 'Không thể tạo tài khoản quản trị.' };
    }

    const authUser = createdAuthUser.user;
    if (!authUser) {
      return { ok: false, error: 'Không thể tạo tài khoản quản trị.' };
    }

    const { data: insertedUser, error: insertError } = await supabase
      .from('admin_users')
      .insert({
        id: authUser.id,
        email: loginEmail,
        role: input.role,
        is_active: true,
      })
      .select(ADMIN_USER_COLUMNS)
      .single();

    if (insertError) {
      await supabase.auth.admin.deleteUser(authUser.id);
      return { ok: false, error: 'Không thể tạo tài khoản quản trị.' };
    }

    const enrichedUser = (await enrichAdminUsers(supabase, [insertedUser as AdminUserRow]))[0];

    await supabase.from('audit_logs').insert({
      actor_id: actor.id,
      action: 'create',
      entity: 'admin_users',
      entity_id: enrichedUser.id,
      metadata: {
        login_email: enrichedUser.email,
        username: enrichedUser.username,
        display_name: enrichedUser.display_name,
        role: enrichedUser.role,
        force_password_change: true,
      },
    });

    return {
      ok: true,
      data: {
        user: enrichedUser,
        loginEmail,
        temporaryPassword,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Không thể tạo tài khoản quản trị.',
    };
  }
}

export async function updateAdminUserRole(
  input: UpdateAdminUserRoleInput,
): Promise<AdminUserActionResult<AdminUserListItem>> {
  try {
    const actor = await requireAdminAuth(USER_MANAGER_ROLES);
    const supabase = createServiceRoleClient();

    if (input.userId === input.currentAdminId) {
      return { ok: false, error: 'Bạn không thể tự thay đổi vai trò của chính mình.' };
    }

    const { data: targetUser, error: targetError } = await supabase
      .from('admin_users')
      .select('id, email, role, is_active')
      .eq('id', input.userId)
      .maybeSingle();

    if (targetError || !targetUser) {
      return { ok: false, error: 'Không tìm thấy tài khoản cần cập nhật vai trò.' };
    }

    const oldRole = targetUser.role;

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
        return {
          ok: false,
          error: 'Không thể hạ cấp vì đây là tài khoản Super Admin hoạt động duy nhất.',
        };
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from('admin_users')
      .update({ role: input.role })
      .eq('id', input.userId)
      .select(ADMIN_USER_COLUMNS)
      .single();

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    const enrichedUser = (await enrichAdminUsers(supabase, [updated as AdminUserRow]))[0];

    await supabase.from('audit_logs').insert({
      actor_id: actor.id,
      action: 'update',
      entity: 'admin_users',
      entity_id: updated.id,
      metadata: {
        login_email: enrichedUser.email,
        username: enrichedUser.username,
        old_role: oldRole,
        new_role: enrichedUser.role,
      },
    });

    return { ok: true, data: enrichedUser };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Không thể cập nhật vai trò quản trị.',
    };
  }
}

export async function setAdminUserActive(
  userId: string,
  isActive: boolean,
  currentAdminId: string,
): Promise<AdminUserActionResult<AdminUserListItem>> {
  try {
    const actor = await requireAdminAuth(USER_MANAGER_ROLES);
    const supabase = createServiceRoleClient();

    if (userId === currentAdminId) {
      return { ok: false, error: 'Bạn không thể tự vô hiệu hóa tài khoản của chính mình.' };
    }

    const { data: targetUser, error: targetError } = await supabase
      .from('admin_users')
      .select('id, email, role, is_active')
      .eq('id', userId)
      .maybeSingle();

    if (targetError || !targetUser) {
      return { ok: false, error: 'Không tìm thấy tài khoản cần cập nhật trạng thái.' };
    }

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
        return {
          ok: false,
          error: 'Không thể vô hiệu hóa vì đây là tài khoản Super Admin hoạt động duy nhất.',
        };
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from('admin_users')
      .update({ is_active: isActive })
      .eq('id', userId)
      .select(ADMIN_USER_COLUMNS)
      .single();

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    const enrichedUser = (await enrichAdminUsers(supabase, [updated as AdminUserRow]))[0];

    await supabase.from('audit_logs').insert({
      actor_id: actor.id,
      action: isActive ? 'activate' : 'deactivate',
      entity: 'admin_users',
      entity_id: updated.id,
      metadata: {
        login_email: enrichedUser.email,
        username: enrichedUser.username,
        is_active: enrichedUser.is_active,
      },
    });

    return { ok: true, data: enrichedUser };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Không thể cập nhật trạng thái tài khoản.',
    };
  }
}

export async function removeAdminUserAccess(
  userId: string,
  currentAdminId: string,
): Promise<AdminUserActionResult<AdminUserListItem>> {
  try {
    const actor = await requireAdminAuth(USER_MANAGER_ROLES);
    const supabase = createServiceRoleClient();

    if (userId === currentAdminId) {
      return { ok: false, error: 'Bạn không thể tự xóa tài khoản của chính mình.' };
    }

    const { data: targetUser, error: targetError } = await supabase
      .from('admin_users')
      .select('id, email, role, is_active')
      .eq('id', userId)
      .maybeSingle();

    if (targetError || !targetUser) {
      return { ok: false, error: 'Không tìm thấy tài khoản cần xóa truy cập.' };
    }

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
        return {
          ok: false,
          error: 'Không thể xóa vì đây là tài khoản Super Admin hoạt động duy nhất.',
        };
      }
    }

    const enrichedUser = (await enrichAdminUsers(supabase, [targetUser as AdminUserRow]))[0];
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      return { ok: false, error: 'Không thể xóa tài khoản quản trị.' };
    }

    await supabase.from('audit_logs').insert({
      actor_id: actor.id,
      action: 'delete',
      entity: 'admin_users',
      entity_id: userId,
      metadata: {
        login_email: enrichedUser.email,
        username: enrichedUser.username,
        role: enrichedUser.role,
      },
    });

    return { ok: true, data: enrichedUser };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Không thể xóa quyền truy cập quản trị.',
    };
  }
}

export async function resetAdminUserPassword(
  userId: string,
  currentAdminId: string
): Promise<AdminUserActionResult<{ temporaryPassword: string; user: AdminUserListItem }>> {
  try {
    const actor = await requireAdminAuth(USER_MANAGER_ROLES);
    const supabase = createServiceRoleClient();

    if (userId === currentAdminId) {
      return { ok: false, error: 'Bạn không thể tự đặt lại mật khẩu của chính mình.' };
    }

    const { data: targetUser, error: targetError } = await supabase
      .from('admin_users')
      .select(ADMIN_USER_COLUMNS)
      .eq('id', userId)
      .maybeSingle();

    if (targetError || !targetUser) {
      return { ok: false, error: 'Không tìm thấy tài khoản để đặt lại mật khẩu.' };
    }

    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
    if (authError || !authData.user) {
      return { ok: false, error: 'Không tìm thấy thông tin đăng nhập của tài khoản này.' };
    }

    const temporaryPassword = generateTemporaryPassword();
    const currentMetadata = authData.user.user_metadata || {};

    const { error: updateAuthError } = await supabase.auth.admin.updateUserById(userId, {
      password: temporaryPassword,
      user_metadata: {
        ...currentMetadata,
        force_password_change: true,
      },
    });

    if (updateAuthError) {
      return { ok: false, error: 'Không thể đặt lại mật khẩu.' };
    }

    const enrichedUser = (await enrichAdminUsers(supabase, [targetUser as AdminUserRow]))[0];

    await supabase.from('audit_logs').insert({
      actor_id: actor.id,
      action: 'reset_password',
      entity: 'admin_users',
      entity_id: userId,
      metadata: {
        login_email: enrichedUser.email,
        username: enrichedUser.username,
        force_password_change: true,
      },
    });

    return {
      ok: true,
      data: {
        temporaryPassword,
        user: enrichedUser,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Không thể đặt lại mật khẩu.',
    };
  }
}
