import 'server-only';

import { cache } from 'react';
import type { User } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import type { AdminUser } from '@/lib/types/admin';
import type { AdminRole } from '@/lib/types/database';
export { ADMIN_ROLE_LABELS } from '@/lib/types/admin';

export const ADMIN_ROLES: readonly AdminRole[] = ['super_admin', 'admin', 'editor', 'viewer'];
const VALID_ADMIN_ROLES = new Set<AdminRole>(ADMIN_ROLES);

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

const getAdminUserById = cache(async (userId: string): Promise<AdminUser | null> => {
  const adminClient = createServiceRoleClient();
  const { data: adminUser, error } = await adminClient
    .from('admin_users')
    .select('id, email, role, is_active')
    .eq('id', userId)
    .maybeSingle();

  if (error || !adminUser || !isAdminRole(adminUser.role) || !adminUser.is_active) {
    return null;
  }

  return {
    id: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    is_active: adminUser.is_active,
  };
});

export const getAdminSessionState = cache(async (): Promise<AdminSessionState> => {
  const user = await readCurrentAuthUser();

  if (!user) {
    return {
      status: 'unauthenticated',
      user: null,
      adminUser: null,
    };
  }

  const adminUser = await getAdminUserById(user.id);

  if (!adminUser) {
    return {
      status: 'unauthorized',
      user,
      adminUser: null,
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

  if (sessionState.status === 'unauthorized') {
    return '/admin/access-denied';
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

  if (sessionState.status !== 'authorized') {
    redirect('/admin/access-denied');
  }

  if (!hasRequiredAdminRole(sessionState.adminUser.role, allowedRoles)) {
    redirect('/admin/access-denied');
  }

  return sessionState.adminUser;
}

export async function getAdminUserIfExists(): Promise<AdminUser | null> {
  const sessionState = await getAdminSessionState();
  return sessionState.status === 'authorized' ? sessionState.adminUser : null;
}
