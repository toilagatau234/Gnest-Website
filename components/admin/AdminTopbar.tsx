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
  const avatarInitial = adminUser.email ? adminUser.email.charAt(0).toUpperCase() : 'A';

  return (
    <header className="sticky top-0 z-30 flex h-[68px] min-w-0 items-center justify-between gap-3 border-b border-[#E5E7EF] bg-white/90 px-4 shadow-sm shadow-slate-900/[0.03] backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label={isMenuOpen ? 'Đóng menu' : 'Mở menu'}
          className="admin-focus inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-[#F5F6FA] hover:text-[#202224] lg:hidden"
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div className="min-w-0">
          <p className="truncate text-xs font-extrabold uppercase tracking-[0.05em] text-[#3749A6]">
            {currentTabName}
          </p>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 hidden items-center gap-1 text-[11px] font-semibold text-[#646464] transition-colors hover:text-[#4880FF] sm:inline-flex"
          >
            Xem website <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="hidden min-w-0 flex-1 justify-center xl:flex">
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            placeholder="Tìm kiếm nhanh..."
            disabled
            className="h-10 w-full cursor-not-allowed rounded-full border border-[#E5E7EF] bg-[#F5F6FA] px-11 text-sm font-medium text-slate-400 shadow-inner outline-none"
          />
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 sm:flex">
          <Server className="h-3.5 w-3.5 text-emerald-600" />
          <span className="hidden whitespace-nowrap text-[10px] uppercase tracking-wide md:inline">
            Supabase live
          </span>
        </div>

        <div className="hidden h-6 w-px bg-[#E5E7EF] sm:block" />

        <div className="flex min-w-0 items-center gap-2 rounded-full border border-[#E5E7EF] bg-white px-2 py-1 shadow-sm">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4880FF]/10 text-xs font-extrabold uppercase text-[#3749A6]">
            {avatarInitial}
          </span>
          <div className="hidden min-w-0 text-left sm:block">
            <p className="max-w-36 truncate text-xs font-bold text-[#202224] lg:max-w-48">
              {adminUser.email}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#646464]">
              {ADMIN_ROLE_LABELS[adminUser.role] || 'Admin'}
            </p>
          </div>
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
