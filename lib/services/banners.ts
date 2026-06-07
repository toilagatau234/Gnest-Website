import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/types/database';

export const ALLOWED_POSITIONS = ['site_top', 'home_after_products', 'catalog_top'] as const;
export type BannerPosition = typeof ALLOWED_POSITIONS[number];

export type PublicBanner = Pick<
  Tables<'promotional_banners'>,
  | 'id'
  | 'content'
  | 'link_url'
  | 'position'
  | 'image_desktop_url'
  | 'image_mobile_url'
  | 'sort_order'
>;

/**
 * Fetch active promotional banners for a specific position (e.g. 'top_bar', 'homepage_slot').
 * Evaluates scheduling (start_at & end_at) dynamically.
 */
export async function getActiveBannersByPosition(position: string): Promise<PublicBanner[]> {
  if (!ALLOWED_POSITIONS.includes(position as any)) {
    return [];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('promotional_banners')
      .select('id, content, link_url, position, image_desktop_url, image_mobile_url, sort_order, start_at, end_at')
      .eq('is_active', true)
      .eq('position', position)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      return [];
    }

    const now = new Date();
    const filtered = (data ?? []).filter((banner) => {
      if (banner.start_at && new Date(banner.start_at) > now) return false;
      if (banner.end_at && new Date(banner.end_at) < now) return false;
      return true;
    });

    return filtered as PublicBanner[];
  } catch {
    return [];
  }
}

/**
 * Backward compatible fetcher for the top bar position.
 */
export async function getActiveBanners(): Promise<PublicBanner[]> {
  return getActiveBannersByPosition('site_top');
}
