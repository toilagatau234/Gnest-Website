import { FloatingCTA } from '@/components/FloatingCTA';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteOverlays } from '@/components/SiteOverlays';
import { getPublicSiteContents } from '@/lib/services/site-content';
import { PromoBanner } from '@/components/PromoBanner';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const siteContents = await getPublicSiteContents();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PromoBanner position="top_bar" />
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

