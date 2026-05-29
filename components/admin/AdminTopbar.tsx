'use client';

import { LogOut, Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

  return (
    <div className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-[#D7E0EC] bg-white px-4 lg:px-6">
      <button
        onClick={onMenuToggle}
        className="rounded-md p-1 transition hover:bg-[#F4F7FB] lg:hidden"
        aria-label={isMenuOpen ? 'Đóng menu' : 'Mở menu'}
      >
        {isMenuOpen ? <X className="h-5 w-5 text-[#1B3A6B]" /> : <Menu className="h-5 w-5 text-[#1B3A6B]" />}
      </button>

      {!isMenuOpen && <h1 className="text-lg font-semibold text-[#1B3A6B] lg:hidden">Quản trị</h1>}

      <div className="flex-1 lg:flex-none" />

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-900">{adminUser.email}</p>
            <p className="text-xs text-slate-500">{ADMIN_ROLE_LABELS[adminUser.role]}</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-md p-1.5 text-[#E31E24] transition-colors hover:bg-[#FFF5F5] hover:text-[#C61A1F]"
            title="Đăng xuất"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
