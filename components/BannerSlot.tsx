import { getActiveBannersByPosition } from '@/lib/services/banners';
import { BannerCarousel } from '@/components/BannerCarousel';
import { ScrollReveal } from '@/components/ScrollReveal';

interface BannerSlotProps {
  position: string;
  variant?: 'default' | 'compact';
}

export async function BannerSlot({ position, variant = 'default' }: BannerSlotProps) {
  const banners = await getActiveBannersByPosition(position).catch(() => []);
  if (!banners || banners.length === 0) return null;

  return (
    <ScrollReveal direction="up" delay={0.1}>
      <BannerCarousel banners={banners} variant={variant} />
    </ScrollReveal>
  );
}
