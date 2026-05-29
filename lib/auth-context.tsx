'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthError, User } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/client';

interface SignInWithPasswordInput {
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithPassword: (credentials: SignInWithPasswordInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

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

    function handleUserChange(currentUser: User | null) {
      if (mounted) {
        setUser(currentUser ?? null);
        setLoading(false);
      }
    }

    supabaseClient.auth
      .getUser()
      .then(({ data }) => {
        handleUserChange(data.user);
      })
      .catch((err) => {
        console.warn('getUser failed:', err);
        if (mounted) {
          setLoading(false);
        }
      });

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      handleUserChange(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signInWithPassword = async ({ email, password }: SignInWithPasswordInput) => {
    if (!supabase) {
      throw new Error('Thiếu cấu hình Supabase trên trình duyệt.');
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw mapSupabaseAuthError(error);
    }
  };

  const logout = async () => {
    if (!supabase) {
      throw new Error('Thiếu cấu hình Supabase trên trình duyệt.');
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function mapSupabaseAuthError(error: AuthError) {
  if (error.message.toLowerCase().includes('invalid login credentials')) {
    return new Error('Email hoặc mật khẩu không đúng.');
  }

  return new Error(error.message);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
