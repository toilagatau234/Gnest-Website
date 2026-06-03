'use client';

import { useState } from 'react';
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth-context';

export function AdminLoginForm() {
  const router = useRouter();
  const { loading, signInWithPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDisabled = loading || isSubmitting;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);

      await signInWithPassword({
        email: email.trim(),
        password,
      });

      router.replace('/admin/dashboard');
      router.refresh();
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : 'Không thể đăng nhập. Vui lòng kiểm tra email và mật khẩu.';

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-[#D7E0EC] bg-white shadow-[0_24px_60px_rgba(27,58,107,0.08)]">
          <div className="bg-[#1B3A6B] px-8 py-7 text-white">
            <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide">
              Quản trị Gnest
            </div>
            <h1 className="mt-4 text-3xl font-bold">Đăng nhập quản trị</h1>
            <p className="mt-2 text-sm text-white/80">
              Dùng tài khoản Supabase Auth để truy cập khu vực quản trị.
            </p>
          </div>

          <div className="px-8 py-8">
            {error ? (
              <div className="mb-5 rounded-xl border border-[#F2C5C7] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B42318]">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#1B3A6B]">Email</span>
                <div className="flex items-center rounded-xl border border-[#D7E0EC] bg-white px-4 focus-within:border-[#1B3A6B]">
                  <Mail className="h-4 w-4 text-[#1B3A6B]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@company.com"
                    autoComplete="email"
                    className="w-full bg-transparent px-3 py-3.5 text-sm text-slate-900 outline-none"
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#1B3A6B]">Mật khẩu</span>
                <div className="flex items-center rounded-xl border border-[#D7E0EC] bg-white px-4 focus-within:border-[#1B3A6B]">
                  <Lock className="h-4 w-4 text-[#1B3A6B]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Nhập mật khẩu"
                    autoComplete="current-password"
                    className="w-full bg-transparent px-3 py-3.5 text-sm text-slate-900 outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="text-slate-500 transition-colors hover:text-[#1B3A6B]"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              <button
                type="submit"
                disabled={isDisabled}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E31E24] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#C61A1F] disabled:cursor-not-allowed disabled:bg-[#F29A9D]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang đăng nhập
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
