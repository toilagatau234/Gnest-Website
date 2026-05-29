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

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-[#E31E24]/10 selection:text-[#E31E24]">
      {/* Dynamic light blur backgrounds for premium dashboard feel */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#E31E24]/5 to-transparent rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-[#1B3A6B]/5 to-transparent rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Top Navbar */}
      <AdminTopbar adminUser={adminUser} onMenuToggle={toggleMenu} isMenuOpen={menuOpen} />

      <div className="flex flex-1 pt-14 relative z-10">
        {/* Sidebar Navigation */}
        <AdminSidebar isOpen={menuOpen} />

        {/* Mobile Sidebar Overlay */}
        {menuOpen && (
          <div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm lg:hidden z-20 transition-all duration-300"
            onClick={closeMenu}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 overflow-x-hidden min-h-[calc(100vh-3.5rem)] flex flex-col">
          <div className="animate-[fadeIn_0.5s_ease-out] flex-1 flex flex-col">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
