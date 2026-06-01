'use client';

import { useState } from 'react';
import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminToastProvider } from '@/components/admin/AdminToast';
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
    <AdminToastProvider>
    <div className="min-h-screen bg-[#F7F9FB] font-sans text-slate-800 antialiased selection:bg-[#1B3A6B]/10 selection:text-[#1B3A6B]">
      <AdminSidebar isOpen={menuOpen} adminUser={adminUser} onNavigate={closeMenu} />

      <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden lg:pl-72">
        <AdminTopbar adminUser={adminUser} onMenuToggle={toggleMenu} isMenuOpen={menuOpen} />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1440px]">
            <div className="animate-[fadeIn_0.3s_ease-out_both]">
              {children}
            </div>
          </div>
        </main>

        <footer className="border-t border-slate-200 bg-white px-4 py-4 text-center text-[10px] font-medium text-slate-400">
          <p>© 2026 Đại Tài Lợi • Gnest Administration Portal. Đồng bộ Supabase TLS 1.3 encrypted secure platform.</p>
        </footer>
      </div>
    </div>
    </AdminToastProvider>
  );
}
