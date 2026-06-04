'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Command,
  ExternalLink,
  LogOut,
  Menu,
  Search,
  Server,
  X,
} from 'lucide-react';

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
  '/admin/categories': 'Danh mục sản phẩm / Danh mục',
  '/admin/products': 'Danh mục sản phẩm / Sản phẩm',
  '/admin/sales-contacts': 'Danh mục sản phẩm / Đầu mối liên hệ',
  '/admin/jobs': 'Hệ thống / Tuyển dụng',
  '/admin/site-content': 'Hệ thống / Nội dung website',
  '/admin/admin-users': 'Hệ thống / Tài khoản quản trị',
  '/admin/audit-logs': 'Hệ thống / Nhật ký hoạt động',
};

const ADMIN_COMMANDS = [
  { href: '/admin/dashboard', label: 'Tổng quan bảng điều khiển', keywords: ['dashboard', 'tong quan', 'kpi'] },
  { href: '/admin/inquiries', label: 'Yêu cầu báo giá', keywords: ['inquiries', 'bao gia', 'contact'] },
  { href: '/admin/categories', label: 'Danh mục sản phẩm', keywords: ['categories', 'danh muc', 'catalog'] },
  { href: '/admin/products', label: 'Sản phẩm', keywords: ['products', 'san pham', 'catalog'] },
  { href: '/admin/sales-contacts', label: 'Đầu mối liên hệ', keywords: ['sales', 'contacts', 'zalo'] },
  { href: '/admin/jobs', label: 'Tuyển dụng', keywords: ['jobs', 'tuyen dung', 'career'] },
  { href: '/admin/site-content', label: 'Nội dung website', keywords: ['content', 'website', 'landing'] },
  { href: '/admin/admin-users', label: 'Tài khoản quản trị', keywords: ['admin users', 'tai khoan', 'phan quyen'] },
  { href: '/admin/audit-logs', label: 'Nhật ký hoạt động', keywords: ['audit', 'logs', 'lich su'] },
];

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
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const deferredQuery = useDeferredValue(commandQuery);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsPaletteOpen((current) => !current);
      }

      if (event.key === 'Escape') {
        setIsPaletteOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/admin/login');
    router.refresh();
  };

  const filteredCommands = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();

    return ADMIN_COMMANDS.filter((command) => {
      if (!normalized) {
        return true;
      }

      const haystack = `${command.label} ${command.href} ${command.keywords.join(' ')}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [deferredQuery]);

  const currentTabName = getBreadcrumbName(pathname);
  const avatarInitial = adminUser.email ? adminUser.email.charAt(0).toUpperCase() : 'A';

  return (
    <>
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
          <button
            type="button"
            onClick={() => setIsPaletteOpen(true)}
            className="flex h-10 w-full max-w-md items-center justify-between rounded-full border border-[#E5E7EF] bg-[#F7F9FB] px-4 text-sm font-medium text-slate-500 transition hover:border-[#1B3A6B]/20 hover:bg-white"
          >
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4 text-slate-400" />
              Tìm nhanh route admin, bảng dữ liệu, công cụ...
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Ctrl K
            </span>
          </button>
        </div>

        <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsPaletteOpen(true)}
            className="admin-focus inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-[#F5F6FA] hover:text-[#202224] xl:hidden"
            title="Tìm nhanh"
          >
            <Search className="h-4 w-4" />
          </button>

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

      {isPaletteOpen ? (
        <div className="fixed inset-0 z-[90] bg-slate-950/35 px-4 py-10 backdrop-blur-sm" onClick={() => setIsPaletteOpen(false)}>
          <div
            className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3">
                <Command className="h-4 w-4 text-[#1B3A6B]" />
                <input
                  type="search"
                  autoFocus
                  value={commandQuery}
                  onChange={(event) => setCommandQuery(event.target.value)}
                  placeholder="Tìm route admin, module, trang cần mở..."
                  className="h-12 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setIsPaletteOpen(false)}
                  className="text-slate-400 transition hover:text-slate-600"
                  aria-label="Đóng command palette"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto p-3">
              {filteredCommands.length > 0 ? (
                <div className="space-y-2">
                  {filteredCommands.map((command) => {
                    const isCurrent = pathname === command.href;

                    return (
                      <button
                        key={command.href}
                        type="button"
                        onClick={() => {
                          setIsPaletteOpen(false);
                          setCommandQuery('');
                          router.push(command.href);
                          router.refresh();
                        }}
                        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                          isCurrent
                            ? 'border-[#1B3A6B]/20 bg-[#1B3A6B]/5'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{command.label}</p>
                          <p className="mt-1 text-[11px] font-medium text-slate-400">{command.href}</p>
                        </div>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          {isCurrent ? 'Current' : 'Open'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                  <Search className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm font-semibold text-slate-600">Không tìm thấy mục phù hợp.</p>
                  <p className="mt-1 text-xs font-medium text-slate-400">
                    Thử tìm theo tên route, tên module hoặc chức năng.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
