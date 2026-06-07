import Link from 'next/link';

export default function AdminAccountDisabledPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-[#D7E0EC] bg-white p-8 text-center shadow-[0_24px_60px_rgba(27,58,107,0.08)]">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-[#FFF5F5] p-4">
              <svg
                className="h-8 w-8 text-[#E31E24]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M12 3a9 9 0 110 18 9 9 0 010-18z"
                />
              </svg>
            </div>
          </div>

          <h1 className="mb-3 text-2xl font-bold text-[#1B3A6B]">Tài khoản quản trị đã bị vô hiệu hóa</h1>
          <p className="mb-6 text-slate-600">
            Phiên đăng nhập đã được kết thúc để bảo vệ hệ thống. Vui lòng liên hệ Super Admin nếu bạn cần
            được hỗ trợ.
          </p>

          <Link
            href="/"
            className="block w-full rounded-xl bg-[#1B3A6B] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#163258]"
          >
            Quay về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
