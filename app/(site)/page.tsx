import { CtaBanner } from '@/components/CtaBanner';
import { HeroSection } from '@/components/HeroSection';
import { ProcessSection } from '@/components/ProcessSection';
import { ProductsRender } from '@/components/ProductsRender';
import { ScrollReveal } from '@/components/ScrollReveal';
import { StaffSection } from '@/components/StaffSection';
import { WhyUsSection } from '@/components/WhyUsSection';
import { getPublicSiteContents } from '@/lib/services/site-content';
import { getHomepageProducts } from '@/lib/services/public-products';
import { getActiveBannersByPosition } from '@/lib/services/banners';
import { BannerSlot } from '@/components/BannerSlot';

export default async function Home() {
  const [siteContents, overviewProducts, homepageBanners] = await Promise.all([
    getPublicSiteContents(),
    getHomepageProducts(),
    getActiveBannersByPosition('homepage_slot').catch(() => []),
  ]);

  return (
    <>
      <HeroSection content={siteContents.hero} />

      <ScrollReveal direction="up" delay={0.1}>
        <WhyUsSection />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.05}>
        <ProcessSection />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.1}>
        <ProductsRender overviewProducts={overviewProducts} />
      </ScrollReveal>

      {homepageBanners && homepageBanners.length > 0 ? (
        <ScrollReveal direction="up" delay={0.1}>
          <BannerSlot banners={homepageBanners} />
        </ScrollReveal>
      ) : null}

      <ScrollReveal direction="up" delay={0.1}>
        <StaffSection />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.1}>
        <CtaBanner content={siteContents.cta} />
      </ScrollReveal>
    </>
  );
}

