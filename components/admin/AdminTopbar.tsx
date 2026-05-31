'use client';

import { usePathname, useRouter } from 'next/navigation';
import { 
  Search, 
  Menu, 
  LogOut, 
  Database,
  ExternalLink,
  Server,
  Sliders,
  RefreshCw,
  CloudLightning,
  AlertTriangle,
  X
} from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/lib/auth-context';
import { ADMIN_ROLE_LABELS, type AdminUser } from '@/lib/types/admin';

interface AdminTopbarProps {
  adminUser: AdminUser;
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}

const BREADCRUMB_MAP: Record<string, string> = {
  '/admin/dashboard': 'Tổng quan / Bảng điều khiển',
  '/admin/inquiries': 'Tổng quan / Yêu cầu báo giá sỉ',
  '/admin/categories': 'Catalog sản phẩm / Quản lý danh mục',
  '/admin/products': 'Catalog sản phẩm / Quản lý sản phẩm',
  '/admin/sales-contacts': 'Catalog sản phẩm / Đầu mối liên hệ',
  '/admin/jobs': 'Hệ thống / Tuyển dụng nhân sự',
  '/admin/site-content': 'Hệ thống / Cấu hình nội dung website',
  '/admin/admin-users': 'Hệ thống / Tài khoản quản trị',
  '/admin/audit-logs': 'Hệ thống / Nhật ký hoạt động truy vết',
};

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

  const handleLogout = async () => {
    await logout();
    router.replace('/admin/login');
    router.refresh();
  };

  const currentTabName = getBreadcrumbName(pathname);

  return (
    <header className="sticky top-0 right-0 z-30 flex items-center justify-between bg-white/95 backdrop-blur-md h-16 px-6 lg:px-8 border-b border-[#E2E8F0] shadow-xs">
      
      {/* Left: Menu toggle & Breadcrumbs */}
      <div className="flex items-center gap-4 flex-1 max-w-lg md:max-w-2xl">
        <button 
          onClick={onMenuToggle}
          aria-label={isMenuOpen ? 'Đóng menu' : 'Mở menu'}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
        >
          {isMenuOpen ? <X className="w-5.5 h-5.5" /> : <Menu className="w-5.5 h-5.5" />}
        </button>

        {/* Breadcrumb Info */}
        <div className="flex items-center gap-2 text-sm hidden lg:flex select-none">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-[#1B3A6B] transition-colors uppercase tracking-tighter text-[10px] font-bold flex items-center gap-1"
          >
            Trang chủ <ExternalLink className="w-2.5 h-2.5" />
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-[#1B3A6B] uppercase tracking-tighter text-[10px]">{currentTabName}</span>
        </div>
      </div>

      {/* Right: Tools, status, profile, and logout */}
      <div className="flex items-center gap-4 sm:gap-6">
        
        {/* Global Search Bar (Visual Placeholder) */}
        <div className="relative w-full max-w-xs hidden md:block">
          <input
            type="text"
            placeholder="Tìm kiếm nhanh..."
            disabled
            className="bg-[#F7F9FB] border border-[#E2E8F0] rounded-full px-10 py-1.5 text-xs w-52 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] text-slate-400 cursor-not-allowed"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-2 pointer-events-none" />
        </div>

        {/* Floating Simulation Controls (Aesthetic) */}
        <div className="hidden xl:flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 text-xs select-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1 bg-white border border-slate-200/50 rounded-md py-0.5 shadow-xs mr-1 text-slate-500">
            <Sliders className="w-3 h-3 text-[#1B3A6B]" /> Hệ thống:
          </span>
          
          <div className="px-2 py-1 text-slate-500 font-medium text-[10px] flex items-center gap-1">
            <RefreshCw className="w-2.5 h-2.5 text-slate-400" /> Skeletons
          </div>
          <div className="px-2 py-1 text-slate-500 font-medium text-[10px] flex items-center gap-1">
            <CloudLightning className="w-2.5 h-2.5 text-slate-400" /> DB Live
          </div>
        </div>

        {/* Database Status indicator badge */}
        <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 text-xs font-semibold cursor-pointer">
          <Server className="w-3 h-3 text-emerald-600 animate-pulse" />
          <span className="hidden md:inline uppercase text-[9px] tracking-wider font-bold">SUPABASE LIVE</span>
        </div>

        {/* Divider line */}
        <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

        {/* User Role Badge */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end leading-tight">
            <span className="text-xs font-bold text-slate-800">Đại Tài Lợi Co.</span>
            <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-[#1B3A6B] rounded-md font-bold uppercase border border-blue-100">
              {ADMIN_ROLE_LABELS[adminUser.role] || 'Admin'}
            </span>
          </div>
          
          <button 
            onClick={handleLogout}
            title="Đăng xuất"
            className="p-2 text-slate-400 hover:text-[#E31E24] transition-colors rounded-xl hover:bg-[#E31E24]/5"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
