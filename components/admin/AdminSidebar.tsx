'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Briefcase,
  FileText,
  FolderOpen,
  LayoutDashboard,
  MessageSquare,
  Package,
  Phone,
  ScrollText,
  Users,
  X,
} from 'lucide-react';

import { ADMIN_ROLE_LABELS, type AdminUser } from '@/lib/types/admin';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const iconClass = 'h-[18px] w-[18px]';

const navSections: NavSection[] = [
  {
    title: 'Tổng Quan',
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard className={iconClass} /> },
      { label: 'Yêu cầu báo giá', href: '/admin/inquiries', icon: <MessageSquare className={iconClass} />, badge: 'CRM' },
    ],
  },
  {
    title: 'Catalog Sản Phẩm',
    items: [
      { label: 'Danh mục', href: '/admin/categories', icon: <FolderOpen className={iconClass} /> },
      { label: 'Sản phẩm', href: '/admin/products', icon: <Package className={iconClass} /> },
      { label: 'Liên hệ bán hàng', href: '/admin/sales-contacts', icon: <Phone className={iconClass} /> },
    ],
  },
  {
    title: 'Cấu Hình Hệ Thống',
    items: [
      { label: 'Tuyển dụng', href: '/admin/jobs', icon: <Briefcase className={iconClass} /> },
      { label: 'Nội dung website', href: '/admin/site-content', icon: <FileText className={iconClass} /> },
      { label: 'Người dùng quản trị', href: '/admin/admin-users', icon: <Users className={iconClass} /> },
      { label: 'Nhật ký hoạt động', href: '/admin/audit-logs', icon: <ScrollText className={iconClass} /> },
    ],
  },
];

interface AdminSidebarProps {
  isOpen: boolean;
  adminUser: AdminUser;
  onNavigate: () => void;
}

export function AdminSidebar({ isOpen, adminUser, onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const emailInitial = adminUser.email ? adminUser.email.charAt(0).toUpperCase() : 'A';

  return (
    <aside
      id="admin-sidebar"
      aria-label="Điều hướng quản trị"
      className={`
        fixed inset-y-0 left-0 z-40 flex w-[256px] flex-col
        bg-gradient-to-b from-[#1B3A6B] via-[#162e57] to-[#0f2040] text-white
        shadow-[4px_0_24px_rgba(0,0,0,0.15)]
        transition-transform duration-300 ease-in-out
        lg:sticky lg:top-0 lg:h-screen lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* Brand */}
      <div className="flex h-[60px] shrink-0 items-center gap-3 border-b border-white/[0.08] px-5">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.12] ring-1 ring-white/[0.18] shadow-sm">
          <span className="text-[13px] font-extrabold tracking-wider text-white">G</span>
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#1B3A6B] admin-pulse-dot" />
        </div>
        <div className="leading-tight">
          <p className="text-[13px] font-bold tracking-tight text-white">Gnest Admin</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
            CMS v2.0
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigate}
          aria-label="Đóng menu"
          className="admin-focus ml-auto rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section) => (
          <div key={section.title} className="mb-5 last:mb-0">
            <p className="mb-2 px-3 text-[9.5px] font-bold uppercase tracking-[0.16em] text-white/30">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={`
                      admin-focus group relative flex items-center gap-2.5 rounded-lg px-3 py-2.5
                      text-[13px] tracking-[-0.01em] transition-all duration-150
                      ${
                        active
                          ? 'bg-white/[0.13] font-semibold text-white shadow-sm'
                          : 'font-medium text-white/60 hover:bg-white/[0.07] hover:text-white'
                      }
                    `}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-[22px] w-[3px] -translate-y-1/2 rounded-r-full bg-[#E31E24]" />
                    )}
                    <span className={`shrink-0 transition-colors ${active ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`}>
                      {item.icon}
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${active ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50 group-hover:bg-white/15 group-hover:text-white/70'}`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Divider line */}
      <div className="mx-4 h-px bg-white/[0.08]" />

      {/* User / role area */}
      <div className="shrink-0 p-3">
        <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.07] px-3 py-2.5 ring-1 ring-white/[0.08]">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.15] text-[13px] font-bold text-white ring-1 ring-white/[0.2]">
            {emailInitial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-white/90">{adminUser.email}</p>
            <p className="text-[10px] font-medium text-white/45">{ADMIN_ROLE_LABELS[adminUser.role]}</p>
          </div>
          <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 admin-pulse-dot" />
        </div>
      </div>
    </aside>
  );
}
