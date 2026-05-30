import { CtaBanner } from '@/components/CtaBanner';
import { HeroSection } from '@/components/HeroSection';
import { LazyInteractive3DShowcase } from '@/components/LazyInteractive3DShowcase';
import { ProcessSection } from '@/components/ProcessSection';
import { ProductsRender } from '@/components/ProductsRender';
import { ScrollReveal } from '@/components/ScrollReveal';
import { StaffSection } from '@/components/StaffSection';
import { WhyUsSection } from '@/components/WhyUsSection';

export default function Home() {
  return (
    <>
      <HeroSection />

      <ScrollReveal direction="up" delay={0.1}>
        <WhyUsSection />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.05}>
        <ProcessSection />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.1}>
        <ProductsRender />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.1}>
        <LazyInteractive3DShowcase />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.1}>
        <StaffSection />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.1}>
        <CtaBanner />
      </ScrollReveal>
    </>
  );
}
