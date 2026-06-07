import { getActiveBannersByPosition } from '@/lib/services/banners';
import { PromoBannerCarousel } from '@/components/PromoBannerCarousel';

interface PromoBannerProps {
  position?: string;
}

export async function PromoBanner({ position = 'top_bar' }: PromoBannerProps) {
  const banners = await getActiveBannersByPosition(position).catch(() => []);
  if (!banners || banners.length === 0) return null;

  return <PromoBannerCarousel banners={banners} />;
}
