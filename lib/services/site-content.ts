import 'server-only';

import { createClient } from '@/lib/supabase/server';
import {
  getDefaultSiteContents,
  mergeSiteContents as buildFromRaw,
  SITE_CONTENT_KEY,
  type SiteContentsPayload,
} from '@/lib/services/admin/site-content';

// Re-export types for convenience.
export type { SiteContentsPayload, HeroContent, FooterContent, CtaContent, SeoContent } from '@/lib/services/admin/site-content';
export { getDefaultSiteContents } from '@/lib/services/admin/site-content';

/**
 * Public-safe site content reader.
 *
 * This intentionally uses the normal Supabase server client instead of the
 * service role client. Public reads are already covered by RLS: only active
 * `site_contents` rows are selectable, and failures fall back to defaults.
 */
export async function getPublicSiteContents(): Promise<SiteContentsPayload> {
  try {
    const supabase = await createClient();
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
