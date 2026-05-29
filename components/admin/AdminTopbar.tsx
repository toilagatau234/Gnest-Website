'use client';

import { LogOut, Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useAuth } from '@/lib/auth-context';
import { ADMIN_ROLE_LABELS, type AdminUser } from '@/lib/types/admin';

interface AdminTopbarProps {
  adminUser: AdminUser;
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}

export function AdminTopbar({ adminUser, onMenuToggle, isMenuOpen }: AdminTopbarProps) {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/admin/login');
    router.refresh();
  };

  const emailInitial = adminUser.email ? adminUser.email.charAt(0).toUpperCase() : 'A';

  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-[#E2E8F0] bg-white/90 backdrop-blur-md px-4 lg:px-6 transition-all duration-300">
      <div className="flex items-center gap-3">
        {/* Toggle Menu Button for Mobile */}
        <button
          onClick={onMenuToggle}
          className="rounded-xl p-1.5 transition-colors hover:bg-slate-100 lg:hidden text-[#1B3A6B]"
          aria-label={isMenuOpen ? 'Đóng menu' : 'Mở menu'}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Brand Logo Link to Dashboard */}
        <Link href="/admin/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1B3A6B] to-[#E31E24] flex items-center justify-center shadow-md shadow-[#1B3A6B]/10 transition-transform duration-300 group-hover:scale-105">
            <span className="text-white text-xs font-black tracking-widest pt-0.5 pl-0.5">G</span>
          </div>
          <span className="text-base font-black tracking-tight text-[#1B3A6B] uppercase hidden sm:inline-block">
            Gnest <span className="text-[#E31E24]">Quản Trị</span>
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {/* User Profile Block */}
        <div className="flex items-center gap-3 border-l border-slate-150 pl-4 h-8">
          {/* Avatar sphere */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1B3A6B]/10 to-[#E31E24]/10 border border-[#1B3A6B]/15 flex items-center justify-center font-bold text-xs text-[#1B3A6B] shadow-inner select-none">
            {emailInitial}
          </div>

          <div className="hidden text-left sm:block">
            <p className="text-xs font-bold text-slate-800 tracking-tight leading-none mb-0.5">{adminUser.email}</p>
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
              {ADMIN_ROLE_LABELS[adminUser.role]}
            </span>
          </div>

          {/* Logout Trigger */}
          <button
            onClick={handleLogout}
            className="rounded-xl p-2 text-[#E31E24] transition-all duration-300 hover:bg-red-50 hover:text-[#C61A1F] ml-1 flex items-center justify-center"
            title="Đăng xuất khỏi hệ thống"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
