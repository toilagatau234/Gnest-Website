'use client';

import { useState } from 'react';
import { Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { changeOwnPasswordAction } from '@/app/admin/password-reset/actions';
import { useAuth } from '@/lib/auth-context';

export function AdminPasswordResetForm() {
  const router = useRouter();
  const { logout } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password requirements checklist
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const criteriaCount = [hasMinLength, hasUpper && hasLower, hasDigit, hasSpecial].filter(Boolean).length;
  const strengthText = ['Yếu', 'Yếu', 'Trung bình', 'Mạnh'][Math.min(criteriaCount, 3)];
  const strengthColor = [
    'bg-rose-500', // Yếu
    'bg-rose-500', // Yếu
    'bg-amber-500', // Trung bình
    'bg-emerald-500' // Mạnh
  ][Math.min(criteriaCount, 3)];

  const passwordsMatch = password && confirmPassword ? password === confirmPassword : null;
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasDigit && hasSpecial && passwordsMatch;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password.length < 8) {
      setError('Mật khẩu mới cần tối thiểu 8 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const result = await changeOwnPasswordAction(password);
      if (!result.ok) {
        setError(result.error ?? 'Không thể đổi mật khẩu. Vui lòng thử lại.');
        return;
      }
      router.replace('/admin/dashboard');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không thể đổi mật khẩu. Vui lòng thử lại.');
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
            Bảo mật tài khoản
          </div>
          <h1 className="mt-4 text-3xl font-bold">Đổi mật khẩu lần đầu</h1>
          <p className="mt-2 text-sm text-white/80">
            Tài khoản này đang sử dụng mật khẩu tạm. Bạn cần đặt mật khẩu mới trước khi vào trang quản trị.
          </p>
        </div>

        <div className="space-y-6 px-8 py-8">
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900">
            Mật khẩu mới nên dài tối thiểu 8 ký tự và khác với mật khẩu tạm đã được cấp.
          </div>

          {error ? (
            <div className="rounded-xl border border-[#F2C5C7] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B42318]">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#1B3A6B]">Mật khẩu mới</span>
              <div className="flex items-center rounded-xl border border-[#D7E0EC] bg-white px-4 focus-within:border-[#1B3A6B]">
                <KeyRound className="h-4 w-4 text-[#1B3A6B]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  className="w-full bg-transparent px-3 py-3.5 text-sm text-slate-900 outline-none"
                  placeholder="Nhập mật khẩu mới"
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((current) => !current)}
                  className="text-slate-500 transition-colors hover:text-[#1B3A6B]"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {password && (
                <div className="mt-2.5 space-y-2 rounded-xl border border-slate-100 bg-[#F8FAFC] p-3 text-xs">
                  {/* Strength meter */}
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500">Độ mạnh mật khẩu:</span>
                    <span className={`font-bold ${criteriaCount >= 3 ? 'text-emerald-600' : criteriaCount >= 2 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {strengthText}
                    </span>
                  </div>
                  <div className="flex gap-1 h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full ${strengthColor} transition-all duration-300`} style={{ width: `${(Math.min(criteriaCount, 4) / 4) * 100}%` }} />
                  </div>
                  {/* Checklist */}
                  <ul className="mt-2 grid grid-cols-2 gap-1.5 font-medium text-slate-500">
                    <li className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${hasMinLength ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      Tối thiểu 8 ký tự
                    </li>
                    <li className={`flex items-center gap-1.5 ${hasUpper && hasLower ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${hasUpper && hasLower ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      Chữ hoa & chữ thường
                    </li>
                    <li className={`flex items-center gap-1.5 ${hasDigit ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${hasDigit ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      Có chữ số (0-9)
                    </li>
                    <li className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${hasSpecial ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      Ký tự đặc biệt (VD: @, !)
                    </li>
                  </ul>
                </div>
              )}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#1B3A6B]">Xác nhận mật khẩu mới</span>
              <div className="flex items-center rounded-xl border border-[#D7E0EC] bg-white px-4 focus-within:border-[#1B3A6B]">
                <KeyRound className="h-4 w-4 text-[#1B3A6B]" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  className="w-full bg-transparent px-3 py-3.5 text-sm text-slate-900 outline-none"
                  placeholder="Nhập lại mật khẩu mới"
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="text-slate-500 transition-colors hover:text-[#1B3A6B]"
                  aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordsMatch !== null && (
                <p className={`mt-1.5 text-xs font-semibold ${passwordsMatch ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {passwordsMatch ? '✓ Mật khẩu khớp.' : '✗ Mật khẩu chưa trùng khớp.'}
                </p>
              )}
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
                Đăng xuất
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isPasswordValid}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#E31E24] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#C61A1F] disabled:cursor-not-allowed disabled:bg-[#F29A9D]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang cập nhật...
                  </>
                ) : (
                  'Cập nhật mật khẩu'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
