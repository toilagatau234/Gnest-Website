'use client';

import { useState } from 'react';
import { Mail, Loader } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function AdminLoginPage() {
  const { login, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await login();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to sign in with Google. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = isLoading || loading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Đăng nhập quản trị</h1>
            <p className="text-gray-600">Đăng nhập để quản lý nội dung của bạn</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isDisabled}
            className={`
              w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
              font-medium transition-all duration-200
              ${
                isDisabled
                  ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                  : 'bg-white border-2 border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400'
              }
            `}
          >
            {isLoading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Đang đăng nhập...</span>
              </>
            ) : (
              <>
                <Mail className="w-5 h-5" />
                <span>Đăng nhập bằng Google</span>
              </>
            )}
          </button>

          {/* Info */}
          <p className="text-center text-xs text-gray-500 mt-6">
            Liên hệ quản trị viên để được cấp quyền truy cập
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-8">
          © Đại Tài Lợi. Bảo lưu mọi quyền.
        </p>
      </div>
    </div>
  );
}
