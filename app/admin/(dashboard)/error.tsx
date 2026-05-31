'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface AdminErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminDashboardError({ error, reset }: AdminErrorProps) {
  useEffect(() => {
    console.error('Admin dashboard error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center shadow-admin">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-[#E31E24]">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-bold text-[#1B3A6B]">Đã xảy ra lỗi</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Không thể hoàn tất thao tác này. Vui lòng thử lại. Nếu lỗi tiếp tục, hãy liên hệ quản trị hệ thống.
        </p>
        <button
          type="button"
          onClick={reset}
          className="admin-focus mx-auto mt-6 inline-flex items-center gap-2 rounded-lg bg-[#1B3A6B] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#16315b]"
        >
          <RefreshCcw className="h-4 w-4" />
          Thử lại
        </button>
      </div>
    </div>
  );
}
