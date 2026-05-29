'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  // Check admin access
  useEffect(() => {
    if (loading) return; // Still loading auth state

    if (!user || !isAdmin) {
      // No user or not admin; redirect to access denied
      router.push('/admin/access-denied');
    }
  }, [user, loading, isAdmin, router]);

  // Show nothing while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authorized
  if (!user || !isAdmin) {
    return null; // useEffect will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminTopbar onMenuToggle={toggleMenu} isMenuOpen={menuOpen} />

      <div className="flex">
        <AdminSidebar isOpen={menuOpen} />

        {/* Mobile Overlay */}
        {menuOpen && (
          <div
            className="fixed inset-0 bg-black/20 lg:hidden z-20"
            onClick={closeMenu}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 pt-14 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
