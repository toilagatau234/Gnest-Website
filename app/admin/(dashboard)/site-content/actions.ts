'use server';

import { revalidatePath } from 'next/cache';
import { saveSiteContents, type SiteContentsPayload } from '@/lib/services/admin/site-content';

export type SiteContentFormState = { ok: boolean; error?: string };

function readString(formData: FormData, key: string): string {
  const val = formData.get(key);
  return typeof val === 'string' ? val.trim() : '';
}

function buildPayload(formData: FormData): SiteContentsPayload {
  return {
    hero: {
      title: readString(formData, 'hero.title'),
      subtitle: readString(formData, 'hero.subtitle'),
      cta_text: readString(formData, 'hero.cta_text'),
      banner_url: readString(formData, 'hero.banner_url'),
    },
    footer: {
      company_name: readString(formData, 'footer.company_name'),
      address: readString(formData, 'footer.address'),
      phone: readString(formData, 'footer.phone'),
      email: readString(formData, 'footer.email'),
    },
    cta: {
      zalo_url: readString(formData, 'cta.zalo_url'),
      hotline: readString(formData, 'cta.hotline'),
    },
    seo: {
      site_title: readString(formData, 'seo.site_title'),
      meta_description: readString(formData, 'seo.meta_description'),
    },
  };
}

function revalidateSiteContent() {
  revalidatePath('/');
  revalidatePath('/admin/site-content');
  revalidatePath('/danh-muc');
  revalidatePath('/tuyen-dung');
}

export async function saveSiteContentAction(
  _prevState: SiteContentFormState,
  formData: FormData,
): Promise<SiteContentFormState> {
  try {
    const payload = buildPayload(formData);

    // Basic validation
    if (!payload.hero.title) {
      return { ok: false, error: 'Tiêu đề Hero là bắt buộc.' };
    }
    if (!payload.footer.company_name) {
      return { ok: false, error: 'Tên công ty là bắt buộc.' };
    }
    if (!payload.seo.site_title) {
      return { ok: false, error: 'Tiêu đề SEO là bắt buộc.' };
    }

    const { error } = await saveSiteContents(payload);

    if (error) {
      return { ok: false, error };
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Không thể lưu cấu hình nội dung.',
    };
  }

  revalidateSiteContent();
  return { ok: true };
}
