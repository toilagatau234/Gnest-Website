import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdminAuth } from '@/lib/services/admin/auth';

export interface HeroContent {
  title: string;
  subtitle: string;
  cta_text: string;
  banner_url: string;
}

export interface FooterContent {
  company_name: string;
  address: string;
  phone: string;
  email: string;
}

export interface CtaContent {
  zalo_url: string;
  hotline: string;
}

export interface SeoContent {
  site_title: string;
  meta_description: string;
}

export interface SiteContentsPayload {
  hero: HeroContent;
  footer: FooterContent;
  cta: CtaContent;
  seo: SeoContent;
}

export const SITE_CONTENT_KEY = 'dynamic_config';

const MUTATION_ROLES = ['super_admin', 'admin', 'editor'] as const;

/**
 * Read the single `dynamic_config` row from site_contents.
 * Returns hardcoded defaults when row is missing.
 * Safe to call from Server Components (service role client).
 */
export async function getSiteContents(): Promise<SiteContentsPayload> {
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

  const val = data.value as Record<string, unknown>;
  return mergeSiteContents(val);
}

/**
 * Upsert the `dynamic_config` row. Requires editor+ role.
 */
export async function saveSiteContents(payload: SiteContentsPayload) {
  const adminUser = await requireAdminAuth(MUTATION_ROLES);
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('site_contents')
    .upsert(
      {
        key: SITE_CONTENT_KEY,
        value: payload as any,
        is_active: true,
      },
      { onConflict: 'key' },
    )
    .select('id, key, updated_at')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: 'update',
    entity: 'site_contents',
    entity_id: data.id,
    metadata: { key: SITE_CONTENT_KEY },
  });

  return { data, error: null };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getDefaultSiteContents(): SiteContentsPayload {
  return {
    hero: {
      title: 'Hũ Thủy Tinh Cao Cấp Đại Tài Lợi',
      subtitle:
        'Nhà máy cung ứng hũ thủy tinh thực phẩm, chai lọ gia vị sỉ B2B lớn nhất miền Nam. Đủ mẫu mã, sẵn hàng kho.',
      cta_text: 'Đăng Ký Nhận Báo Giá Sỉ',
      banner_url: '/assets/banner-glassware.jpg',
    },
    footer: {
      company_name: 'CÔNG TY TNHH MTV ĐẠI TÀI LỢI',
      address: '716 Nguyễn Huệ, P. Mỹ Trà, Tỉnh Đồng Tháp',
      phone: '0939.991.551',
      email: 'congtydaitailoi@gmail.com',
    },
    cta: {
      zalo_url: 'https://zalo.me/0939991551',
      hotline: '0939991551',
    },
    seo: {
      site_title: 'Đại Tài Lợi (ĐTL) – Bao Bì, Chai Lọ Thủy Tinh, Hộp Nhựa, Ngành Yến',
      meta_description:
        'Công Ty TNHH MTV Đại Tài Lợi – Chuyên cung cấp chai lọ thủy tinh, hộp nhựa, bao bì ngành yến, in ấn phẩm và gia công CNC. Hotline: 0939.991.551',
    },
  };
}

function asStr(v: unknown, fallback: string): string {
  return typeof v === 'string' && v.trim() ? v.trim() : fallback;
}

export function mergeSiteContents(val: Record<string, unknown>): SiteContentsPayload {
  const defaults = getDefaultSiteContents();

  const hero = (val.hero ?? {}) as Record<string, unknown>;
  const footer = (val.footer ?? {}) as Record<string, unknown>;
  const cta = (val.cta ?? {}) as Record<string, unknown>;
  const seo = (val.seo ?? {}) as Record<string, unknown>;

  return {
    hero: {
      title: asStr(hero.title, defaults.hero.title),
      subtitle: asStr(hero.subtitle, defaults.hero.subtitle),
      cta_text: asStr(hero.cta_text, defaults.hero.cta_text),
      banner_url: asStr(hero.banner_url, defaults.hero.banner_url),
    },
    footer: {
      company_name: asStr(footer.company_name, defaults.footer.company_name),
      address: asStr(footer.address, defaults.footer.address),
      phone: asStr(footer.phone, defaults.footer.phone),
      email: asStr(footer.email, defaults.footer.email),
    },
    cta: {
      zalo_url: asStr(cta.zalo_url, defaults.cta.zalo_url),
      hotline: asStr(cta.hotline, defaults.cta.hotline),
    },
    seo: {
      site_title: asStr(seo.site_title, defaults.seo.site_title),
      meta_description: asStr(seo.meta_description, defaults.seo.meta_description),
    },
  };
}
