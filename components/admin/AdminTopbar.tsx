'use client';

import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import type { AdminUser } from '@/lib/services/admin/auth';

interface AdminTopbarProps {
  adminUser: AdminUser;
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}

export function AdminTopbar({ adminUser, onMenuToggle, isMenuOpen }: AdminTopbarProps) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      {/* Mobile Menu Toggle */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-1 hover:bg-gray-100 rounded-md"
        aria-label={isMenuOpen ? 'Đóng menu' : 'Mở menu'}
      >
        {isMenuOpen ? (
          <X className="w-5 h-5 text-gray-700" />
        ) : (
          <Menu className="w-5 h-5 text-gray-700" />
        )}
      </button>

      {/* Logo / Title (hidden on mobile when menu is open) */}
      {!isMenuOpen && (
        <h1 className="text-lg font-semibold text-gray-900 lg:hidden">Quản trị</h1>
      )}

      {/* Spacer */}
      <div className="flex-1 lg:flex-none" />

      {/* User Menu */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-gray-900">{user?.email ?? adminUser.email}</p>
            <p className="text-xs text-gray-500">{adminUser.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-600 hover:text-gray-900"
            title="Đăng xuất"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
