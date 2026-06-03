'use client';

import { useState } from 'react';
import { Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth-context';

export function AdminPasswordResetForm() {
  const router = useRouter();
  const { updatePassword, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password.length < 8) {
      setError('Mat khau moi can toi thieu 8 ky tu.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mat khau xac nhan khong trung khop.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await updatePassword(password);
      router.replace('/admin/dashboard');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Khong the doi mat khau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 py-10">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#D7E0EC] bg-white shadow-[0_24px_60px_rgba(27,58,107,0.08)]">
        <div className="bg-[#1B3A6B] px-8 py-7 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide">
            <ShieldCheck className="h-3.5 w-3.5" />
            Bao mat tai khoan
          </div>
          <h1 className="mt-4 text-3xl font-bold">Doi mat khau lan dau</h1>
          <p className="mt-2 text-sm text-white/80">
            Tai khoan noi bo nay dang dung mat khau tam. Ban can dat mat khau moi truoc khi vao dashboard.
          </p>
        </div>

        <div className="space-y-6 px-8 py-8">
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900">
            Mat khau moi nen dai toi thieu 8 ky tu va khac hoan toan voi mat khau tam da duoc cap.
          </div>

          {error ? (
            <div className="rounded-xl border border-[#F2C5C7] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B42318]">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#1B3A6B]">Mat khau moi</span>
              <div className="flex items-center rounded-xl border border-[#D7E0EC] bg-white px-4 focus-within:border-[#1B3A6B]">
                <KeyRound className="h-4 w-4 text-[#1B3A6B]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  className="w-full bg-transparent px-3 py-3.5 text-sm text-slate-900 outline-none"
                  placeholder="Nhap mat khau moi"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="text-slate-500 transition-colors hover:text-[#1B3A6B]"
                  aria-label={showPassword ? 'An mat khau' : 'Hien mat khau'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#1B3A6B]">Xac nhan mat khau moi</span>
              <div className="flex items-center rounded-xl border border-[#D7E0EC] bg-white px-4 focus-within:border-[#1B3A6B]">
                <KeyRound className="h-4 w-4 text-[#1B3A6B]" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  className="w-full bg-transparent px-3 py-3.5 text-sm text-slate-900 outline-none"
                  placeholder="Nhap lai mat khau moi"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="text-slate-500 transition-colors hover:text-[#1B3A6B]"
                  aria-label={showConfirmPassword ? 'An mat khau' : 'Hien mat khau'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  router.replace('/admin/login');
                  router.refresh();
                }}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Dang xuat
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#E31E24] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#C61A1F] disabled:cursor-not-allowed disabled:bg-[#F29A9D]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Dang cap nhat
                  </>
                ) : (
                  'Cap nhat mat khau'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
