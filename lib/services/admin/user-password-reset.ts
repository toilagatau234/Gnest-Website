import type { User } from '@supabase/supabase-js';

export function requiresAdminPasswordReset(user: User | null | undefined) {
  return Boolean(user?.user_metadata?.force_password_change);
}
