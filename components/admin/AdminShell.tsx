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
    <div className="flex min-h-screen bg-[#F7F9FB] font-sans text-[#0F172A] selection:bg-[#1B3A6B]/10 selection:text-[#1B3A6B]">
      <AdminSidebar isOpen={menuOpen} adminUser={adminUser} onNavigate={closeMenu} />

      {/* Mobile overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-[2px] lg:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AdminTopbar adminUser={adminUser} onMenuToggle={toggleMenu} isMenuOpen={menuOpen} />

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-7 sm:px-6 lg:px-8">
          <div className="animate-[fadeIn_0.28s_ease-out_both]">{children}</div>
        </main>
      </div>
    </div>
  );
}
