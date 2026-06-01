import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  getDefaultSiteContents,
  mergeSiteContents as buildFromRaw,
  SITE_CONTENT_KEY,
  type SiteContentsPayload,
} from '@/lib/services/admin/site-content';

// Re-export types for convenience
export type { SiteContentsPayload, HeroContent, FooterContent, CtaContent, SeoContent } from '@/lib/services/admin/site-content';
export { getDefaultSiteContents } from '@/lib/services/admin/site-content';

/**
 * Public (no auth required) version of getSiteContents.
 * Uses service role so it bypasses RLS, with fallback to defaults.
 * Safe to call from Server Components in the (site) route group.
 */
export async function getPublicSiteContents(): Promise<SiteContentsPayload> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('site_contents')
      .select('value')
      .eq('key', SITE_CONTENT_KEY)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) {
      return getDefaultSiteContents();
    }

    return buildFromRaw(data.value as Record<string, unknown>);
  } catch {
    return getDefaultSiteContents();
  }
}
