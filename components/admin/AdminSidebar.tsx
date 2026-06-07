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
  Sparkles,
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
      { label: 'Danh mục sản phẩm', href: '/admin/categories', icon: FolderTree },
      { label: 'Dịch vụ chuyên nghiệp', href: '/admin/services', icon: Sparkles },
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
      {isOpen ? (
        <div
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] transition-opacity lg:hidden"
          onClick={onNavigate}
        />
      ) : null}

      <aside
        id="admin-sidebar"
        aria-label="Điều hướng quản trị"
        className={`
          fixed inset-y-0 left-0 z-50 flex w-72 flex-col
          border-r border-white/10 bg-[#152D5B] text-white shadow-2xl shadow-slate-950/15
          transition-transform duration-300 ease-out
          before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,rgba(72,128,255,0.34),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent_44%)]
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="relative flex h-20 shrink-0 items-center border-b border-white/10 px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-16 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-lg shadow-black/10 transition-transform hover:scale-105">
              <svg viewBox="0 0 264 174" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="h-full w-auto">
                <rect x="0" y="0" width="78" height="108" rx="8" fill="#E31E24"/>
                <text x="39" y="58" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="66" fontFamily="Arial Black,Arial" fontWeight="900">Đ</text>
                <rect x="93" y="0" width="78" height="108" rx="8" fill="#E31E24"/>
                <text x="132" y="58" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="66" fontFamily="Arial Black,Arial" fontWeight="900">T</text>
                <rect x="186" y="0" width="78" height="108" rx="8" fill="#E31E24"/>
                <text x="225" y="58" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="66" fontFamily="Arial Black,Arial" fontWeight="900">L</text>
                <text x="132" y="156" textAnchor="middle" fill="#E31E24" fontSize="24" fontFamily="Arial" fontWeight="800" letterSpacing="1">Đại Tài Lợi</text>
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-black tracking-[0.06em] text-white uppercase">
                Admin CMS
              </h1>
              <p className="mt-0.5 truncate text-[9px] font-semibold uppercase tracking-[0.12em] text-white/50">
                Đại Tài Lợi
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigate}
            aria-label="Đóng menu"
            className="admin-focus absolute right-4 top-5 inline-flex h-9 w-9 items-center justify-center rounded-xl text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="admin-scrollbar relative min-h-0 flex-1 space-y-7 overflow-y-auto px-3 py-5">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="mb-2.5 px-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/40">
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
                          group flex h-[46px] min-w-0 items-center justify-between gap-3 rounded-[10px] px-3.5 text-sm
                          transition-[transform,background-color,color,box-shadow] duration-200
                          ${
                            active
                              ? 'bg-[#4C61CC] font-bold text-white shadow-lg shadow-[#0B1534]/20'
                              : 'text-white/70 hover:translate-x-1 hover:bg-white/10 hover:text-white'
                          }
                        `}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                              active ? 'bg-white/15 text-white' : 'bg-white/5 text-white/60 group-hover:text-white'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="truncate">{item.label}</span>
                        </span>

                        {item.badge ? (
                          <span className="ml-2 shrink-0 rounded-full border border-white/20 bg-white/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="relative shrink-0 border-t border-white/10 p-4">
          <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-3 shadow-inner shadow-white/5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4880FF] text-sm font-extrabold uppercase text-white shadow-sm">
              {emailInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">{emailShort}</p>
              <p className="truncate text-[11px] font-semibold text-white/50">
                {adminUser.role ? ADMIN_ROLE_LABELS[adminUser.role] : 'Admin'}
              </p>
            </div>
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.16)]" />
          </div>
        </div>
      </aside>
    </>
  );
}
