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
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const iconClass = 'h-[18px] w-[18px]';

const navSections: NavSection[] = [
  {
    title: 'Tổng quan',
    items: [
      { label: 'Tổng quan', href: '/admin/dashboard', icon: <LayoutDashboard className={iconClass} /> },
      { label: 'Yêu cầu báo giá', href: '/admin/inquiries', icon: <MessageSquare className={iconClass} /> },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { label: 'Danh mục', href: '/admin/categories', icon: <FolderOpen className={iconClass} /> },
      { label: 'Sản phẩm', href: '/admin/products', icon: <Package className={iconClass} /> },
      { label: 'Liên hệ bán hàng', href: '/admin/sales-contacts', icon: <Phone className={iconClass} /> },
    ],
  },
  {
    title: 'Hệ thống',
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
        fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col
        bg-gradient-to-b from-[#1B3A6B] to-[#13294d] text-white
        transition-transform duration-300 ease-in-out
        lg:sticky lg:top-0 lg:h-screen lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-white/10 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
          <span className="text-sm font-bold tracking-wide text-white">G</span>
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-tight text-white">Gnest</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
            Quản trị
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigate}
          aria-label="Đóng menu"
          className="admin-focus ml-auto rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {navSections.map((section) => (
          <div key={section.title} className="mb-5 last:mb-0">
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
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
                      admin-focus group relative flex items-center gap-3 rounded-lg px-3 py-2
                      text-sm transition-colors duration-150
                      ${
                        active
                          ? 'bg-white/12 font-semibold text-white'
                          : 'font-medium text-white/65 hover:bg-white/5 hover:text-white'
                      }
                    `}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#E31E24]" />
                    )}
                    <span className={active ? 'text-white' : 'text-white/55 group-hover:text-white'}>
                      {item.icon}
                    </span>
                    <span className="tracking-tight">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User / role area */}
      <div className="shrink-0 border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white ring-1 ring-white/15">
            {emailInitial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-white">{adminUser.email}</p>
            <p className="text-[11px] text-white/50">{ADMIN_ROLE_LABELS[adminUser.role]}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
