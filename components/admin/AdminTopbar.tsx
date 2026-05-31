'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ExternalLink, LogOut, Menu, Search, Server, X } from 'lucide-react';

import { useAuth } from '@/lib/auth-context';
import { ADMIN_ROLE_LABELS, type AdminUser } from '@/lib/types/admin';

interface AdminTopbarProps {
  adminUser: AdminUser;
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}

const BREADCRUMB_MAP: Record<string, string> = {
  '/admin/dashboard': 'Tổng quan / Bảng điều khiển',
  '/admin/inquiries': 'Tổng quan / Yêu cầu báo giá',
  '/admin/categories': 'Catalog / Danh mục',
  '/admin/products': 'Catalog / Sản phẩm',
  '/admin/sales-contacts': 'Catalog / Đầu mối liên hệ',
  '/admin/jobs': 'Hệ thống / Tuyển dụng',
  '/admin/site-content': 'Hệ thống / Nội dung website',
  '/admin/admin-users': 'Hệ thống / Tài khoản quản trị',
  '/admin/audit-logs': 'Hệ thống / Nhật ký hoạt động',
};

function getBreadcrumbName(pathname: string) {
  const match = Object.keys(BREADCRUMB_MAP)
    .filter((href) => pathname === href || pathname.startsWith(href + '/'))
    .sort((a, b) => b.length - a.length)[0];

  return match ? BREADCRUMB_MAP[match] : 'Trang quản trị';
}

export function AdminTopbar({ adminUser, onMenuToggle, isMenuOpen }: AdminTopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/admin/login');
    router.refresh();
  };

  const currentTabName = getBreadcrumbName(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 min-w-0 items-center justify-between gap-3 border-b border-[#E2E8F0] bg-white/95 px-4 shadow-xs backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label={isMenuOpen ? 'Đóng menu' : 'Mở menu'}
          className="admin-focus inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 lg:hidden"
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-[0.04em] text-[#1B3A6B]">
            {currentTabName}
          </p>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 hidden items-center gap-1 text-[11px] font-semibold text-slate-400 transition-colors hover:text-[#1B3A6B] sm:inline-flex"
          >
            Xem website <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="hidden min-w-0 flex-1 justify-center xl:flex">
        <div className="relative w-full max-w-xs">
          <input
            type="text"
            placeholder="Tìm kiếm nhanh..."
            disabled
            className="h-9 w-full cursor-not-allowed rounded-full border border-[#E2E8F0] bg-[#F7F9FB] px-10 text-xs text-slate-400"
          />
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 sm:flex">
          <Server className="h-3.5 w-3.5 text-emerald-600" />
          <span className="hidden text-[9px] font-bold uppercase tracking-wider md:inline">Supabase live</span>
        </div>

        <div className="hidden h-5 w-px bg-slate-200 sm:block" />

        <div className="min-w-0 text-right">
          <p className="max-w-32 truncate text-xs font-bold text-slate-800 sm:max-w-44">
            {adminUser.email}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#1B3A6B]">
            {ADMIN_ROLE_LABELS[adminUser.role] || 'Admin'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          title="Đăng xuất"
          className="admin-focus inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-[#E31E24]/5 hover:text-[#E31E24]"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
