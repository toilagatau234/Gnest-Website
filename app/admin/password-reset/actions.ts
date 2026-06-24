'use server';

import { getAdminSessionState } from '@/lib/services/admin/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';

export type ChangePasswordResult = { ok: boolean; error?: string };

/**
 * Server-side password strength check — mirrors the client checklist in
 * AdminPasswordResetForm so the rules cannot be bypassed by calling the action directly.
 */
function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return 'Mật khẩu mới cần tối thiểu 8 ký tự.';
  if (password.length > 72) return 'Mật khẩu không được dài quá 72 ký tự.';
  if (!/[A-Z]/.test(password)) return 'Mật khẩu cần ít nhất một chữ hoa.';
  if (!/[a-z]/.test(password)) return 'Mật khẩu cần ít nhất một chữ thường.';
  if (!/[0-9]/.test(password)) return 'Mật khẩu cần ít nhất một chữ số.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Mật khẩu cần ít nhất một ký tự đặc biệt.';
  return null;
}

/**
 * Changes the currently-authenticated admin's own password and clears the
 * `force_password_change` flag — server-side only. This is the ONLY place the flag is
 * cleared: the client can no longer flip it via supabase.auth.updateUser, so the forced
 * first-login reset (with a random temporary password) cannot be skipped.
 *
 * Note: this intentionally does NOT use requireAdminAuth() — that helper redirects users
 * with force_password_change back here, which would deadlock the reset form.
 */
export async function changeOwnPasswordAction(password: string): Promise<ChangePasswordResult> {
  const sessionState = await getAdminSessionState();
  if (sessionState.status !== 'authorized') {
    return { ok: false, error: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.' };
  }

  if (typeof password !== 'string') {
    return { ok: false, error: 'Mật khẩu không hợp lệ.' };
  }

  const strengthError = validatePasswordStrength(password);
  if (strengthError) {
    return { ok: false, error: strengthError };
  }

  const supabase = createServiceRoleClient();
  const currentMetadata =
    sessionState.user.user_metadata && typeof sessionState.user.user_metadata === 'object'
      ? sessionState.user.user_metadata
      : {};

  const { error } = await supabase.auth.admin.updateUserById(sessionState.user.id, {
    password,
    user_metadata: { ...currentMetadata, force_password_change: false },
  });

  if (error) {
    return { ok: false, error: 'Không thể cập nhật mật khẩu. Vui lòng thử lại sau.' };
  }

  return { ok: true };
}
