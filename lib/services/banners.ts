import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/types/database';

export type PublicBanner = Pick<
  Tables<'promotional_banners'>,
  'id' | 'content' | 'link_url' | 'sort_order'
>;

/**
 * Fetch active promotional banners for public pages.
 * Covered by RLS (only active rows are accessible publically).
 */
export async function getActiveBanners(): Promise<PublicBanner[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('promotional_banners')
      .select('id, content, link_url, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active banners:', error.message);
      return [];
    }

    return (data ?? []) as PublicBanner[];
  } catch (err) {
    console.error('Error in getActiveBanners:', err);
    return [];
  }
}
