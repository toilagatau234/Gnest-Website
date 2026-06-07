'use client';

import { useState } from 'react';
import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminSessionActivityTracker } from '@/components/admin/AdminSessionActivityTracker';
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
      <div className="min-h-screen bg-[#F5F6FA] bg-[radial-gradient(circle_at_top_right,rgba(72,128,255,0.12),transparent_34%),linear-gradient(180deg,#F8FAFF_0%,#F5F6FA_42%,#F7F9FB_100%)] font-sans text-[#202224] antialiased selection:bg-[#4880FF]/10 selection:text-[#3749A6]">
        <AdminSessionActivityTracker />
        <AdminSidebar isOpen={menuOpen} adminUser={adminUser} onNavigate={closeMenu} />

        <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden lg:pl-72">
          <AdminTopbar adminUser={adminUser} onMenuToggle={toggleMenu} isMenuOpen={menuOpen} />

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1440px]">
              <div className="admin-page-enter">
                {children}
              </div>
            </div>
          </main>

          <footer className="border-t border-[#E5E7EF] bg-white/80 px-4 py-4 text-center text-[11px] font-medium text-[#646464] backdrop-blur">
            <p>© 2026 Đại Tài Lợi · Gnest Admin CMS</p>
          </footer>
        </div>
      </div>
    </AdminToastProvider>
  );
}
