'use client';

import { Database, ExternalLink, LogOut, Menu, Search, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth-context';
import { ADMIN_ROLE_LABELS, type AdminUser } from '@/lib/types/admin';

interface AdminTopbarProps {
  adminUser: AdminUser;
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}

const BREADCRUMB_MAP: Record<string, { label: string; parent?: string }> = {
  '/admin/dashboard':    { label: 'Dashboard' },
  '/admin/inquiries':    { label: 'Yêu cầu báo giá', parent: 'Tổng quan' },
  '/admin/categories':   { label: 'Danh mục', parent: 'Catalog' },
  '/admin/products':     { label: 'Sản phẩm', parent: 'Catalog' },
  '/admin/sales-contacts': { label: 'Liên hệ bán hàng', parent: 'Catalog' },
  '/admin/jobs':         { label: 'Tuyển dụng', parent: 'Hệ thống' },
  '/admin/site-content': { label: 'Nội dung website', parent: 'Hệ thống' },
  '/admin/admin-users':  { label: 'Người dùng quản trị', parent: 'Hệ thống' },
  '/admin/audit-logs':   { label: 'Nhật ký hoạt động', parent: 'Hệ thống' },
};

function getBreadcrumb(pathname: string) {
  const match = Object.keys(BREADCRUMB_MAP)
    .filter((href) => pathname === href || pathname.startsWith(href + '/'))
    .sort((a, b) => b.length - a.length)[0];
  return match ? BREADCRUMB_MAP[match] : { label: 'Quản trị' };
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

  const crumb = getBreadcrumb(pathname);

  return (
    <header className="admin-glass sticky top-0 z-30 flex h-[60px] items-center justify-between gap-3 border-b border-[#E2E8F0]/80 px-4 lg:px-5">
      {/* Left: toggle + breadcrumb */}
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label={isMenuOpen ? 'Đóng menu' : 'Mở menu'}
          aria-expanded={isMenuOpen}
          aria-controls="admin-sidebar"
          className="admin-focus rounded-lg p-2 text-[#1B3A6B] transition-colors hover:bg-[#1B3A6B]/[0.06] lg:hidden"
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex items-center gap-1.5 text-[13px]">
            <li>
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="admin-focus flex items-center gap-1 rounded-md px-1.5 py-0.5 text-slate-400 transition-colors hover:text-[#1B3A6B]"
                title="Xem trang chủ"
              >
                <span className="hidden font-medium sm:inline">Trang chủ</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </li>
            <li className="text-slate-300">/</li>
            {crumb.parent && (
              <>
                <li className="hidden text-slate-400 sm:block">{crumb.parent}</li>
                <li className="hidden text-slate-300 sm:block">/</li>
              </>
            )}
            <li className="truncate font-semibold text-[#1B3A6B]">{crumb.label}</li>
          </ol>
        </nav>
      </div>

      {/* Right: search + status + role + logout */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Search placeholder */}
        <div className="hidden items-center gap-2 rounded-lg border border-[#E2E8F0] bg-slate-50/80 px-3 py-1.5 text-[13px] text-slate-400 transition-colors hover:border-[#CBD5E1] md:flex">
          <Search className="h-3.5 w-3.5" />
          <span>Tìm kiếm…</span>
          <kbd className="ml-1 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
            ⌘K
          </kbd>
        </div>

        {/* Supabase status */}
        <div className="hidden items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-slate-50/60 px-2.5 py-1.5 sm:flex">
          <Database className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-[11px] font-semibold text-emerald-600">LIVE</span>
        </div>

        <span className="hidden h-4 w-px bg-[#E2E8F0] sm:block" />

        {/* Role badge */}
        <div className="hidden items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 sm:flex">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1B3A6B] text-[9px] font-bold text-white">
            {adminUser.email?.charAt(0).toUpperCase()}
          </div>
          <div className="leading-tight">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#1B3A6B]">
              {ADMIN_ROLE_LABELS[adminUser.role]}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Đăng xuất"
          title="Đăng xuất"
          className="admin-focus flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[13px] font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-[#E31E24]"
        >
          <LogOut className="h-[17px] w-[17px]" />
          <span className="hidden sm:inline">Đăng xuất</span>
        </button>
      </div>
    </header>
  );
}
