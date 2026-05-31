'use client';

import { useState } from 'react';
import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import type { AdminUser } from '@/lib/types/admin';

interface AdminShellProps {
  children: React.ReactNode;
  adminUser: AdminUser;
}

export function AdminShell({ children, adminUser }: AdminShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((open) => !open);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="flex min-h-screen bg-[#f7f9fb] font-sans text-[#0F172A] selection:bg-[#E31E24]/10 selection:text-[#E31E24]">
      <AdminSidebar isOpen={menuOpen} adminUser={adminUser} onNavigate={closeMenu} />

      {/* Mobile drawer overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-sm lg:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar adminUser={adminUser} onMenuToggle={toggleMenu} isMenuOpen={menuOpen} />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-[fadeIn_0.3s_ease-out]">{children}</div>
        </main>
      </div>
    </div>
  );
}
