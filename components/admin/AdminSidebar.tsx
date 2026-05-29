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
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Tổng quan', href: '/admin/dashboard', icon: <LayoutDashboard className="w-4.5 h-4.5" /> },
  { label: 'Yêu cầu báo giá', href: '/admin/inquiries', icon: <MessageSquare className="w-4.5 h-4.5" /> },
  { label: 'Danh mục', href: '/admin/categories', icon: <FolderOpen className="w-4.5 h-4.5" /> },
  { label: 'Sản phẩm', href: '/admin/products', icon: <Package className="w-4.5 h-4.5" /> },
  { label: 'Liên hệ bán hàng', href: '/admin/sales-contacts', icon: <Phone className="w-4.5 h-4.5" /> },
  { label: 'Tuyển dụng', href: '/admin/jobs', icon: <Briefcase className="w-4.5 h-4.5" /> },
  { label: 'Nội dung website', href: '/admin/site-content', icon: <FileText className="w-4.5 h-4.5" /> },
  { label: 'Người dùng quản trị', href: '/admin/admin-users', icon: <Users className="w-4.5 h-4.5" /> },
];

interface AdminSidebarProps {
  isOpen: boolean;
}

export function AdminSidebar({ isOpen }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <aside
      className={`
        fixed lg:sticky
        top-14 left-0 bottom-0
        w-64 bg-white/95 backdrop-blur-md border-r border-[#E2E8F0]
        overflow-y-auto
        transform transition-transform duration-300 ease-in-out
        lg:transform-none
        z-30
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      <div className="p-5 space-y-1.5">
        <div className="px-3 mb-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Menu quản trị</span>
        </div>

        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group flex items-center gap-3 px-4 py-3 rounded-xl
                transition-all duration-300 font-bold text-sm relative overflow-hidden
                ${
                  active
                    ? 'bg-gradient-to-r from-[#1B3A6B]/5 to-transparent text-[#1B3A6B] border-l-4 border-[#E31E24] shadow-[0_4px_12px_rgba(27,58,107,0.03)]'
                    : 'text-slate-600 hover:text-[#1B3A6B] hover:bg-slate-50'
                }
              `}
            >
              {/* Active hover effect background */}
              <div className="absolute inset-0 bg-[#E31E24]/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 -z-10" />

              <div
                className={`
                  transition-colors duration-300
                  ${active ? 'text-[#E31E24]' : 'text-slate-400 group-hover:text-[#1B3A6B]'}
                `}
              >
                {item.icon}
              </div>
              <span className="tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
