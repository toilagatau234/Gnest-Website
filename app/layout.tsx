import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { getPublicSiteContents } from '@/lib/services/site-content';
import { siteConfig } from '@/lib/config/site';

const beVietnamPro = Be_Vietnam_Pro({
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  subsets: ['vietnamese', 'latin'],
  variable: '--font-be-vietnam-pro',
});

export async function generateMetadata(): Promise<Metadata> {
  const contents = await getPublicSiteContents();
  const siteUrl = siteConfig.url;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: contents.seo.site_title,
      template: `%s | ${siteConfig.name}`,
    },
    description: contents.seo.meta_description,
    alternates: {
      canonical: '/',
    },
    openGraph: {
      type: 'website',
      locale: 'vi_VN',
      url: '/',
      siteName: siteConfig.name,
      title: contents.seo.site_title,
      description: contents.seo.meta_description,
    },
    twitter: {
      card: 'summary_large_image',
      title: contents.seo.site_title,
      description: contents.seo.meta_description,
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'CÔNG TY TNHH MTV ĐẠI TÀI LỢI',
    url: siteConfig.url,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '0939.991.551',
      contactType: 'customer service',
      email: 'congtydaitailoi@gmail.com',
      areaServed: 'VN',
      availableLanguage: 'Vietnamese',
    },
  };

  return (
    <html lang="vi" className={`scroll-smooth ${beVietnamPro.variable}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body className="font-sans antialiased text-gray-900 bg-white" suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
