export const ADMIN_IDLE_TIMEOUT_MS = 10 * 60 * 1000;
export const ADMIN_IDLE_COOKIE_NAME = 'gnest_admin_last_activity';
export const ADMIN_TIMEOUT_CLEAR_PATH = '/admin/session-timeout/clear';

export function getAdminActivityCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/admin',
  };
}
