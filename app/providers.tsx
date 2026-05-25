'use client';

import { ModalProvider } from '@/lib/context';
import { FirebaseProvider } from '@/lib/firebase-provider';
import { CategoriesProvider } from '@/lib/categories-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseProvider>
      <CategoriesProvider>
        <ModalProvider>
          {children}
        </ModalProvider>
      </CategoriesProvider>
    </FirebaseProvider>
  );
}
