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
    <div className="flex min-h-screen bg-[#F7F9FB] font-sans text-slate-900 selection:bg-[#E31E24]/10 selection:text-[#E31E24]">
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

<<<<<<< HEAD
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
=======
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
>>>>>>> 3b38c8f142158fddd39741ee7b80a71a7f60a0d6
          <div className="animate-[fadeIn_0.3s_ease-out]">{children}</div>
        </main>
      </div>
    </div>
  );
}
