import { FloatingCTA } from '@/components/FloatingCTA';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteOverlays } from '@/components/SiteOverlays';
import { getPublicSiteContents } from '@/lib/services/site-content';
import { getActiveBannersByPosition } from '@/lib/services/banners';
import { PromoBanner } from '@/components/PromoBanner';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [siteContents, activeBanners] = await Promise.all([
    getPublicSiteContents(),
    getActiveBannersByPosition('top_bar').catch(() => []),
  ]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {activeBanners.length > 0 ? <PromoBanner banners={activeBanners} /> : null}
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter
        companyName={siteContents.footer.company_name}
        address={siteContents.footer.address}
        phone={siteContents.footer.phone}
        email={siteContents.footer.email}
      />
      <FloatingCTA content={siteContents.cta} />
      <SiteOverlays />
    </div>
  );
}

