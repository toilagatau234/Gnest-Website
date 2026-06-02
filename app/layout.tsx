import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { getPublicSiteContents } from '@/lib/services/site-content';

const beVietnamPro = Be_Vietnam_Pro({
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  subsets: ['vietnamese', 'latin'],
  variable: '--font-be-vietnam-pro',
});

export async function generateMetadata(): Promise<Metadata> {
  const contents = await getPublicSiteContents();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    title: contents.seo.site_title,
    description: contents.seo.meta_description,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`scroll-smooth ${beVietnamPro.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased text-gray-900 bg-white" suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
