import type {Metadata} from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { FloatingCTA } from '@/components/FloatingCTA';
import { ProductModal } from '@/components/ProductModal';
import { ContactModal } from '@/components/ContactModal';

const beVietnamPro = Be_Vietnam_Pro({
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  subsets: ['vietnamese', 'latin'],
  variable: '--font-be-vietnam-pro',
});

export const metadata: Metadata = {
  title: 'Đại Tài Lợi (ĐTL) – Bao Bì, Chai Lọ Thủy Tinh, Hộp Nhựa, Ngành Yến',
  description: 'Công Ty TNHH MTV Đại Tài Lợi – Chuyên cung cấp chai lọ thủy tinh, hộp nhựa, bao bì ngành yến, in ấn phẩm và gia công CNC. Hotline: 0939.991.551',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="vi" className={`scroll-smooth ${beVietnamPro.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased text-gray-900 bg-white" suppressHydrationWarning>
        <Providers>
          <div className="min-h-screen bg-white flex flex-col">
            <SiteHeader />
            <main className="flex-1">
              {children}
            </main>
            <SiteFooter />
            <FloatingCTA />
            <ProductModal />
            <ContactModal />
          </div>
        </Providers>
      </body>
    </html>
  );
}

