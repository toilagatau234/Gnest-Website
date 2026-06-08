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
  signInWithPassword: (credentials: SignInWithPasswordInput) => Promise<User>;
  updatePassword: (nextPassword: string) => Promise<User>;
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

    let mounted = true;

    function handleUserChange(currentUser: User | null) {
      if (!mounted) {
        return;
      }

      setUser(currentUser ?? null);
      setLoading(false);
    }

    supabase.auth
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw mapSupabaseAuthError(error);
    }

    if (!data.user) {
      throw new Error('Không thể đọc thông tin tài khoản sau khi đăng nhập.');
    }

    return data.user;
  };

  const updatePassword = async (nextPassword: string) => {
    if (!supabase) {
      throw new Error('Thiếu cấu hình Supabase trên trình duyệt.');
    }

    const { data, error } = await supabase.auth.updateUser({
      password: nextPassword,
      data: {
        force_password_change: false,
      },
    });

    if (error) {
      throw mapSupabaseAuthError(error);
    }

    if (!data.user) {
      throw new Error('Không thể cập nhật mật khẩu tài khoản.');
    }

    return data.user;
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
    <AuthContext.Provider value={{ user, loading, signInWithPassword, updatePassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function mapSupabaseAuthError(error: AuthError) {
  const message = error.message.toLowerCase();

  if (message.includes('invalid login credentials')) {
    return new Error('Email hoặc mật khẩu không đúng.');
  }

  if (
    message.includes('password should be') ||
    message.includes('weak password') ||
    message.includes('password is too weak')
  ) {
    return new Error('Mật khẩu mới chưa đạt yêu cầu bảo mật tối thiểu.');
  }

  return new Error('Đã xảy ra lỗi xác thực. Vui lòng thử lại sau.');
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
