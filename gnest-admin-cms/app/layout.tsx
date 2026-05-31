import type {Metadata} from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css'; // Global styles

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-be-vietnam',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Gnest Admin CMS - Đại Tài Lợi',
  description: 'Hệ thống quản trị nội dung & sản phẩm cho doanh nghiệp Gnest (Đại Tài Lợi)',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="vi" className={beVietnamPro.className}>
      <body suppressHydrationWarning className="bg-[#F7F9FB] text-slate-800 antialiased font-sans min-h-screen">
        {children}
      </body>
    </html>
  );
}
