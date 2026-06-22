import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/config/site';

export default function robots(): MetadataRoute.Robots {
  const isDev = process.env.NODE_ENV === 'development';
  const siteUrl = siteConfig.url;

  // Prevent indexing on localhost, vercel preview deployments, or dev environments
  const isProd =
    !isDev &&
    !siteUrl.includes('localhost') &&
    !siteUrl.includes('vercel.app');

  if (!isProd) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
