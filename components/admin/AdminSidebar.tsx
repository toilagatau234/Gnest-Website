'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Briefcase,
  FolderTree,
  LayoutDashboard,
  Quote,
  Package,
  PhoneCall,
  Globe,
  Users,
  History,
  X,
} from 'lucide-react';

import { ADMIN_ROLE_LABELS, type AdminUser } from '@/lib/types/admin';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'TỔNG QUAN',
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Yêu cầu báo giá', href: '/admin/inquiries', icon: Quote, badge: 'Mới' },
    ],
  },
  {
    title: 'CATALOG SẢN PHẨM',
    items: [
      { label: 'Danh mục', href: '/admin/categories', icon: FolderTree },
      { label: 'Sản phẩm', href: '/admin/products', icon: Package },
      { label: 'Liên hệ bán hàng', href: '/admin/sales-contacts', icon: PhoneCall },
    ],
  },
  {
    title: 'CẤU HÌNH HỆ THỐNG',
    items: [
      { label: 'Tuyển dụng', href: '/admin/jobs', icon: Briefcase },
      { label: 'Nội dung website', href: '/admin/site-content', icon: Globe },
      { label: 'Người dùng quản trị', href: '/admin/admin-users', icon: Users },
      { label: 'Nhật ký hoạt động', href: '/admin/audit-logs', icon: History },
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
  const emailShort = adminUser.email ? adminUser.email.split('@')[0] : 'Admin';

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onNavigate}
        />
      )}

      {/* Main Sidebar */}
      <aside
        id="admin-sidebar"
        aria-label="Điều hướng quản trị"
        className={`
          fixed inset-y-0 left-0 z-50 flex w-72 flex-col
          bg-gradient-to-b from-[#1B3A6B] to-[#132d56] text-white border-r border-white/10
          transition-transform duration-300 ease-in-out
          lg:sticky lg:top-0 lg:h-screen lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-white/10 relative flex h-20 items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-[#1B3A6B] font-extrabold text-xl font-mono">G</span>
            </div>
            <div>
              <h1 className="text-sm font-bold leading-none tracking-tight uppercase flex items-center gap-1.5 text-white">
                ĐẠI TÀI LỢI
                <span className="w-2 h-2 rounded-full bg-[#E31E24] animate-pulse"></span>
              </h1>
              <p className="text-[10px] text-white/60 mt-1 uppercase tracking-widest leading-none font-medium">
                Admin CMS v2.0
              </p>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            type="button"
            onClick={onNavigate}
            aria-label="Đóng menu"
            className="absolute top-6 right-4 lg:hidden p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-8">
          {navSections.map((section, gIdx) => (
            <div key={gIdx}>
              <p className="px-4 text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 select-none">
                {section.title}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? 'page' : undefined}
                        className={`
                          w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-all group duration-150 text-left cursor-pointer
                          ${
                            active
                              ? 'bg-white/10 text-white border-l-4 border-white font-medium shadow-sm'
                              : 'text-white/70 hover:bg-white/5 hover:text-white font-normal'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`w-4 h-4 transition-transform duration-200 ${
                              active ? 'text-white scale-105' : 'text-white/60 group-hover:text-white group-hover:scale-105'
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="ml-auto bg-[#E31E24] text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User / role area */}
        <div className="p-4 border-t border-white/10 shrink-0">
          <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3 border border-white/[0.05]">
            <div className="w-8 h-8 rounded-full bg-[#E31E24] flex items-center justify-center font-bold text-xs uppercase shadow-sm shrink-0">
              {emailInitial}
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-xs font-bold truncate text-slate-100">{emailShort}</p>
              <p className="text-[10px] text-white/50 truncate font-mono">{adminUser.role ? ADMIN_ROLE_LABELS[adminUser.role] : 'Admin'}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          </div>
        </div>
      </aside>
    </>
  );
}
