import { HeroSection } from "@/components/HeroSection";
import { ProcessSection } from "@/components/ProcessSection";
import { ProductsRender } from "@/components/ProductsRender";
import { WhyUsSection } from "@/components/WhyUsSection";
import { StaffSection } from "@/components/StaffSection";
import { CtaBanner } from "@/components/CtaBanner";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Interactive3DShowcase } from "@/components/Interactive3DShowcase";

export default function Home() {
  return (
    <>
      {/* HeroSection is above-the-fold and should render immediately, so we don't delay it */}
      <HeroSection />
      
      {/* Giới thiệu */}
      <ScrollReveal direction="up" delay={0.1}>
        <WhyUsSection />
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.05}>
        <ProcessSection />
      </ScrollReveal>
      
      {/* Sản phẩm */}
      <ScrollReveal direction="up" delay={0.1}>
        <ProductsRender />
      </ScrollReveal>

      {/* Dịch vụ */}
      <ScrollReveal direction="up" delay={0.1}>
        <Interactive3DShowcase />
      </ScrollReveal>
      
      {/* Liên hệ & Hotline */}
      <ScrollReveal direction="up" delay={0.1}>
        <StaffSection />
      </ScrollReveal>
      
      <ScrollReveal direction="up" delay={0.1}>
        <CtaBanner />
      </ScrollReveal>
    </>
  );
}


