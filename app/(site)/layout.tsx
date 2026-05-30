import { FloatingCTA } from '@/components/FloatingCTA';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteOverlays } from '@/components/SiteOverlays';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <FloatingCTA />
      <SiteOverlays />
    </div>
  );
}
