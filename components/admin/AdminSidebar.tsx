'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  FolderOpen,
  Package,
  Phone,
  Briefcase,
  FileText,
  Users,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Yêu cầu báo giá', href: '/admin/inquiries', icon: <MessageSquare className="w-5 h-5" /> },
  { label: 'Danh mục', href: '/admin/categories', icon: <FolderOpen className="w-5 h-5" /> },
  { label: 'Sản phẩm', href: '/admin/products', icon: <Package className="w-5 h-5" /> },
  { label: 'Liên hệ / Sales', href: '/admin/sales-contacts', icon: <Phone className="w-5 h-5" /> },
  { label: 'Tuyển dụng', href: '/admin/jobs', icon: <Briefcase className="w-5 h-5" /> },
  { label: 'Nội dung website', href: '/admin/site-content', icon: <FileText className="w-5 h-5" /> },
  { label: 'Admin users', href: '/admin/admin-users', icon: <Users className="w-5 h-5" /> },
];

interface AdminSidebarProps {
  isOpen: boolean;
}

export function AdminSidebar({ isOpen }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav
      className={`
        fixed lg:static
        top-14 left-0 bottom-0
        w-60 bg-white border-r border-gray-200
        overflow-y-auto
        transform transition-transform duration-300 ease-in-out
        lg:transform-none
        z-30
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      <div className="p-4 space-y-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-2.5 rounded-lg
                transition-colors font-medium text-sm
                ${
                  active
                    ? 'bg-red-50 text-red-700 border-l-4 border-red-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
