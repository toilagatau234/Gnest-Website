'use client';

import dynamic from 'next/dynamic';

const ProductModal = dynamic(
  () => import('@/components/ProductModal').then((mod) => mod.ProductModal),
  { ssr: false, loading: () => null }
);

const ContactModal = dynamic(
  () => import('@/components/ContactModal').then((mod) => mod.ContactModal),
  { ssr: false, loading: () => null }
);

const QuoteModal = dynamic(
  () => import('@/components/QuoteModal').then((mod) => mod.QuoteModal),
  { ssr: false, loading: () => null }
);

export function SiteOverlays() {
  return (
    <>
      <ProductModal />
      <ContactModal />
      <QuoteModal />
    </>
  );
}
