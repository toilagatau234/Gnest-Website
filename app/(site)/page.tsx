import { CtaBanner } from '@/components/CtaBanner';
import { HeroSection } from '@/components/HeroSection';
import { ProcessSection } from '@/components/ProcessSection';
import { ProductsRender } from '@/components/ProductsRender';
import { ScrollReveal } from '@/components/ScrollReveal';
import { StaffSection } from '@/components/StaffSection';
import { WhyUsSection } from '@/components/WhyUsSection';
import { getPublicSiteContents } from '@/lib/services/site-content';
import { getHomepageProducts } from '@/lib/services/public-products';
import { BannerSlot } from '@/components/BannerSlot';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

export default async function Home() {
  const [siteContents, overviewProducts] = await Promise.all([
    getPublicSiteContents(),
    getHomepageProducts(),
  ]);

  return (
    <>
      <HeroSection content={siteContents.hero} />

      <BannerSlot position="home_after_products" variant="compact" />

      <ScrollReveal direction="up" delay={0.1}>
        <WhyUsSection />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.05}>
        <ProcessSection />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.1}>
        <ProductsRender overviewProducts={overviewProducts} />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.1}>
        <StaffSection />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.1}>
        <CtaBanner content={siteContents.cta} />
      </ScrollReveal>
    </>
  );
}

