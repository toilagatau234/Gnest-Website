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

const navSections: NavSection[] = [
  {
    title: 'Tổng quan',
    items: [
      { label: 'Tổng quan', href: '/admin/dashboard', icon: <LayoutDashboard className="h-[18px] w-[18px]" /> },
      { label: 'Yêu cầu báo giá', href: '/admin/inquiries', icon: <MessageSquare className="h-[18px] w-[18px]" /> },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { label: 'Danh mục', href: '/admin/categories', icon: <FolderOpen className="h-[18px] w-[18px]" /> },
      { label: 'Sản phẩm', href: '/admin/products', icon: <Package className="h-[18px] w-[18px]" /> },
      { label: 'Liên hệ bán hàng', href: '/admin/sales-contacts', icon: <Phone className="h-[18px] w-[18px]" /> },
    ],
  },
  {
    title: 'Hệ thống',
    items: [
      { label: 'Tuyển dụng', href: '/admin/jobs', icon: <Briefcase className="h-[18px] w-[18px]" /> },
      { label: 'Nội dung website', href: '/admin/site-content', icon: <FileText className="h-[18px] w-[18px]" /> },
      { label: 'Người dùng quản trị', href: '/admin/admin-users', icon: <Users className="h-[18px] w-[18px]" /> },
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
        fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col
        bg-gradient-to-b from-[#1B3A6B] to-[#002452] text-white
        shadow-[0px_10px_30px_rgba(27,58,107,0.08)]
        transition-transform duration-300 ease-in-out
        lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-white/10 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-white/15 to-[#E31E24]/40 ring-1 ring-white/20">
          <span className="pt-0.5 text-sm font-black tracking-widest text-white">G</span>
        </div>
        <span className="text-base font-black uppercase tracking-tight">
          Gnest <span className="text-[#FF8A8E]">Quản Trị</span>
        </span>
        <button
          type="button"
          onClick={onNavigate}
          aria-label="Đóng menu"
          className="admin-focus ml-auto rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-5">
        {navSections.map((section) => (
          <div key={section.title} className="mb-6 last:mb-0">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/40">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={`
                      admin-focus group relative flex items-center gap-3 rounded-lg px-3 py-2.5
                      text-sm font-semibold transition-colors duration-200
                      ${
                        active
                          ? 'bg-white/10 text-white'
                          : 'text-white/60 hover:bg-white/5 hover:text-white'
                      }
                    `}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#E31E24]" />
                    )}
                    <span className={active ? 'text-white' : 'text-white/50 group-hover:text-white'}>
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
      <div className="shrink-0 border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white ring-1 ring-white/15">
            {emailInitial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-white">{adminUser.email}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#FF8A8E]">
              {ADMIN_ROLE_LABELS[adminUser.role]}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
