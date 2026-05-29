'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { SupabaseClient, User } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/client';
import type { AdminRole, Database } from '@/lib/types/database';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  role: AdminRole | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const ADMIN_ROLES = new Set<AdminRole>(['super_admin', 'admin', 'editor', 'viewer']);

async function fetchAdminRole(
  userId: string,
  supabase: SupabaseClient<Database>
): Promise<AdminRole | null> {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.warn('Failed to query admin_users table:', error.message);
      return null;
    }
    return data?.role ?? null;
  } catch (err) {
    console.warn('Error fetching admin role:', err);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<AdminRole | null>(null);

  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);

  const [loading, setLoading] = useState(!!supabase);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const supabaseClient = supabase;
    let mounted = true;

    async function handleUserChange(currentUser: User | null) {
      if (!currentUser) {
        if (mounted) {
          setUser(null);
          setIsAdmin(false);
          setRole(null);
          setLoading(false);
        }
        return;
      }

      if (mounted) {
        setUser(currentUser);
      }

      const roleVal = await fetchAdminRole(currentUser.id, supabaseClient);

      if (mounted) {
        setRole(roleVal);
        setIsAdmin(roleVal ? ADMIN_ROLES.has(roleVal) : false);
        setLoading(false);
      }
    }

    supabaseClient.auth.getUser().then(({ data }) => {
      handleUserChange(data.user);
    }).catch((err) => {
      console.warn('getUser failed:', err);
      if (mounted) {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setLoading(true);
      }
      handleUserChange(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const login = async () => {
    if (!supabase) return;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/admin/dashboard`,
      },
    });

    if (error) {
      console.error('Supabase login error:', error.message);
    }
  };

  const logout = async () => {
    if (!supabase) return;

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Supabase logout error:', error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
