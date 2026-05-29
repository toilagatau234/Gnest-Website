'use client';

import { ModalProvider } from '@/lib/context';
import { AuthProvider } from '@/lib/auth-context';
import { CategoriesProvider } from '@/lib/categories-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CategoriesProvider>
        <ModalProvider>
          {children}
        </ModalProvider>
      </CategoriesProvider>
    </AuthProvider>
  );
}
