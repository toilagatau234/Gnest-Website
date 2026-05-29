import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { AdminRole } from '@/lib/types/database';

const VALID_ADMIN_ROLES = new Set(['super_admin', 'admin', 'editor', 'viewer']);

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  is_active: boolean;
}

export async function requireAdminAuth(): Promise<AdminUser> {
  const supabase = await createClient();

  // Get current auth user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    // No authenticated user; redirect to login
    redirect('/admin/login');
  }

  // Check if user has admin role
  const { data: adminUser, error: adminError } = await supabase
    .from('admin_users')
    .select('id, email, role, is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (adminError) {
    console.error('Error checking admin status:', adminError.message);
    redirect('/admin/access-denied');
  }

  if (!adminUser) {
    // User not in admin_users table
    redirect('/admin/access-denied');
  }

  // Check if user has valid role and is active
  const hasValidRole = VALID_ADMIN_ROLES.has(adminUser.role) && adminUser.is_active;

  if (!hasValidRole) {
    // Invalid role or not active
    redirect('/admin/access-denied');
  }

  return {
    id: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    is_active: adminUser.is_active,
  };
}

export async function getAdminUserIfExists(): Promise<AdminUser | null> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id, email, role, is_active')
      .eq('id', user.id)
      .maybeSingle();

    if (adminError || !adminUser) {
      return null;
    }

    const hasValidRole = VALID_ADMIN_ROLES.has(adminUser.role) && adminUser.is_active;

    if (!hasValidRole) {
      return null;
    }

    return {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      is_active: adminUser.is_active,
    };
  } catch (err) {
    console.error('Error getting admin user:', err);
    return null;
  }
}
