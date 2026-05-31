'use client';

import { LogOut, Menu, Search, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth-context';
import { ADMIN_ROLE_LABELS, type AdminUser } from '@/lib/types/admin';

interface AdminTopbarProps {
  adminUser: AdminUser;
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}

const PAGE_LABELS: Record<string, string> = {
  '/admin/dashboard': 'Tổng quan',
  '/admin/inquiries': 'Yêu cầu báo giá',
  '/admin/categories': 'Danh mục',
  '/admin/products': 'Sản phẩm',
  '/admin/sales-contacts': 'Liên hệ bán hàng',
  '/admin/jobs': 'Tuyển dụng',
  '/admin/site-content': 'Nội dung website',
  '/admin/admin-users': 'Người dùng quản trị',
  '/admin/audit-logs': 'Nhật ký hoạt động',
};

function getPageLabel(pathname: string): string {
  const match = Object.keys(PAGE_LABELS)
    .filter((href) => pathname === href || pathname.startsWith(href + '/'))
    .sort((a, b) => b.length - a.length)[0];
  return match ? PAGE_LABELS[match] : 'Quản trị';
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

  const pageLabel = getPageLabel(pathname);

  return (
    <header className="admin-glass sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[#E2E8F0] px-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {/* Mobile drawer toggle */}
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label={isMenuOpen ? 'Đóng menu' : 'Mở menu'}
          aria-expanded={isMenuOpen}
          aria-controls="admin-sidebar"
          className="admin-focus rounded-lg p-2 text-[#1B3A6B] transition-colors hover:bg-[#1B3A6B]/5 lg:hidden"
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Breadcrumb / page context */}
        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex items-center gap-2 text-sm">
            <li className="hidden text-slate-400 sm:block">Quản trị</li>
            <li className="hidden text-slate-300 sm:block">/</li>
            <li className="truncate font-bold tracking-tight text-[#1B3A6B]">{pageLabel}</li>
          </ol>
        </nav>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search (scoped per-page search lives in the toolbars; this is global navigation) */}
        <div className="hidden items-center gap-2 rounded-lg border border-[#E2E8F0] bg-slate-50 px-3 py-1.5 text-sm text-slate-400 md:flex">
          <Search className="h-4 w-4" />
          <span>Tìm kiếm…</span>
        </div>

        <span className="hidden rounded-md bg-[#1B3A6B]/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#1B3A6B] sm:inline-block">
          {ADMIN_ROLE_LABELS[adminUser.role]}
        </span>

        <span className="hidden h-5 w-px bg-[#E2E8F0] sm:block" />

        <button
          type="button"
          onClick={handleLogout}
          aria-label="Đăng xuất khỏi hệ thống"
          title="Đăng xuất khỏi hệ thống"
          className="admin-focus flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-[#E31E24]"
        >
          <LogOut className="h-[18px] w-[18px]" />
          <span className="hidden sm:inline">Đăng xuất</span>
        </button>
      </div>
    </header>
  );
}
