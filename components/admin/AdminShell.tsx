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
    <div className="flex min-h-screen bg-[#F7F9FB] font-sans text-slate-800 antialiased selection:bg-[#1B3A6B]/10 selection:text-[#1B3A6B]">
      
      {/* Sidebar Navigation */}
      <AdminSidebar isOpen={menuOpen} adminUser={adminUser} onNavigate={closeMenu} />

      {/* Main Content Area Wrap */}
      <div className="flex-grow flex-1 flex flex-col min-h-screen min-w-0 overflow-hidden lg:pl-72 transition-all duration-300">
        
        {/* Top Header Navigation */}
        <AdminTopbar adminUser={adminUser} onMenuToggle={toggleMenu} isMenuOpen={menuOpen} />

        {/* Operational Canvas Main */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1400px]">
            <div className="animate-[fadeIn_0.3s_ease-out_both]">
              {children}
            </div>
          </div>
        </main>

        {/* Credit System Footer */}
        <footer className="py-4 text-center text-[10px] text-slate-400 font-medium bg-white border-t border-slate-200 select-none">
          <p>© 2026 Đại Tài Lợi • Gnest Administration Portal. Đồng bộ Supabase TLS 1.3 encrypted secure platform.</p>
        </footer>

      </div>
    </div>
  );
}
