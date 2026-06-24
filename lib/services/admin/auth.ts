import 'server-only';

import { cache } from 'react';
import type { User } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

import {
  ADMIN_IDLE_COOKIE_NAME,
  ADMIN_IDLE_TIMEOUT_MS,
  ADMIN_TIMEOUT_CLEAR_PATH,
} from '@/lib/services/admin/auth-config';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requiresAdminPasswordReset } from '@/lib/services/admin/user-password-reset';
import type { AdminUser } from '@/lib/types/admin';
import type { AdminRole } from '@/lib/types/database';

export { ADMIN_ROLE_LABELS } from '@/lib/types/admin';

export const ADMIN_ROLES: readonly AdminRole[] = ['super_admin', 'admin', 'editor', 'viewer'];
export const ADMIN_DISABLED_CLEAR_PATH = '/admin/account-disabled/clear';
export { ADMIN_IDLE_COOKIE_NAME, ADMIN_IDLE_TIMEOUT_MS, ADMIN_TIMEOUT_CLEAR_PATH };

const VALID_ADMIN_ROLES = new Set<AdminRole>(ADMIN_ROLES);

type AdminDirectoryRow = {
  id: string;
  email: string;
  role: unknown;
  is_active: boolean;
};

type AdminSessionState =
  | {
      status: 'unauthenticated';
      user: null;
      adminUser: null;
    }
  | {
      status: 'unauthorized';
      user: User;
      adminUser: null;
    }
  | {
      status: 'disabled';
      user: User;
      adminUser: AdminUser;
    }
  | {
      status: 'authorized';
      user: User;
      adminUser: AdminUser;
    };

export function isAdminRole(role: unknown): role is AdminRole {
  return typeof role === 'string' && VALID_ADMIN_ROLES.has(role as AdminRole);
}

export function hasRequiredAdminRole(
  role: AdminRole,
  allowedRoles: readonly AdminRole[] = ADMIN_ROLES
) {
  return allowedRoles.includes(role);
}

async function readCurrentAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

const getAdminUserRowById = cache(async (userId: string): Promise<AdminDirectoryRow | null> => {
  const adminClient = createServiceRoleClient();
  const { data: adminUser, error } = await adminClient
    .from('admin_users')
    .select('id, email, role, is_active')
    .eq('id', userId)
    .maybeSingle();

  if (error || !adminUser) {
    return null;
  }

  return adminUser;
});

function normalizeAdminUser(adminUser: AdminDirectoryRow): AdminUser | null {
  if (!isAdminRole(adminUser.role)) {
    return null;
  }

  return {
    id: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    is_active: adminUser.is_active,
  };
}

export const getAdminSessionState = cache(async (): Promise<AdminSessionState> => {
  const user = await readCurrentAuthUser();

  if (!user) {
    return {
      status: 'unauthenticated',
      user: null,
      adminUser: null,
    };
  }

  const adminUserRow = await getAdminUserRowById(user.id);
  const adminUser = adminUserRow ? normalizeAdminUser(adminUserRow) : null;

  if (!adminUserRow || !adminUser) {
    return {
      status: 'unauthorized',
      user,
      adminUser: null,
    };
  }

  if (!adminUser.is_active) {
    return {
      status: 'disabled',
      user,
      adminUser,
    };
  }

  return {
    status: 'authorized',
    user,
    adminUser,
  };
});

export async function getAdminEntryPath() {
  const sessionState = await getAdminSessionState();

  if (sessionState.status === 'unauthenticated') {
    return '/admin/login';
  }

  if (sessionState.status === 'disabled') {
    return ADMIN_DISABLED_CLEAR_PATH;
  }

  if (sessionState.status === 'unauthorized') {
    return '/admin/access-denied';
  }

  if (requiresAdminPasswordReset(sessionState.user)) {
    return '/admin/password-reset';
  }

  return '/admin/dashboard';
}

export async function requireAdminAuth(
  allowedRoles: readonly AdminRole[] = ADMIN_ROLES
): Promise<AdminUser> {
  const sessionState = await getAdminSessionState();

  if (sessionState.status === 'unauthenticated') {
    redirect('/admin/login');
  }

  if (sessionState.status === 'disabled') {
    redirect(ADMIN_DISABLED_CLEAR_PATH);
  }

  if (sessionState.status !== 'authorized') {
    redirect('/admin/access-denied');
  }

  if (!hasRequiredAdminRole(sessionState.adminUser.role, allowedRoles)) {
    redirect('/admin/access-denied');
  }

  // Enforce the forced first-login password change on every gated action/page, not just the
  // dashboard layout. The flag is cleared only by changeOwnPasswordAction (which does not call
  // this helper), so an account still on its temporary password cannot perform admin work.
  if (requiresAdminPasswordReset(sessionState.user)) {
    redirect('/admin/password-reset');
  }

  return sessionState.adminUser;
}

export async function getAdminUserIfExists(): Promise<AdminUser | null> {
  const sessionState = await getAdminSessionState();
  return sessionState.status === 'authorized' ? sessionState.adminUser : null;
}
