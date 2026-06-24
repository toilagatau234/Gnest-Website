'use server';

import { headers } from 'next/headers';
import { createNewsletterLead } from '@/lib/services/newsletter';
import { isRateLimited } from '@/lib/services/rate-limit';
import { createServiceRoleClient } from '@/lib/supabase/server';

export type NewsletterFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

export async function submitNewsletterAction(
  _prev: NewsletterFormState,
  formData: FormData
): Promise<NewsletterFormState> {
  try {
    // 1. Honeypot check
    const honeypot = formData.get('website_hp');
    if (honeypot && typeof honeypot === 'string' && honeypot.length > 0) {
      return { status: 'error', message: 'Yêu cầu được gửi quá nhanh. Vui lòng thử lại sau.' };
    }

    // 2. Read fields
    const name = (formData.get('name') as string | null)?.trim() || null;
    const email = (formData.get('email') as string | null)?.trim() || null;
    const phone = (formData.get('phone') as string | null)?.trim() || null;

    // 3. Validation
    if (!email && !phone) {
      return { status: 'error', message: 'Vui lòng điền số điện thoại hoặc email để nhận ưu đãi.' };
    }

    if (name && name.length > 80) {
      return { status: 'error', message: 'Họ tên không được vượt quá 80 ký tự.' };
    }

    let phoneClean: string | null = null;
    if (phone) {
      phoneClean = phone.replace(/\D/g, '');
      if (phoneClean.length < 9 || phoneClean.length > 12) {
        return { status: 'error', message: 'Số điện thoại không hợp lệ (yêu cầu từ 9 đến 12 chữ số).' };
      }
    }

    if (email) {
      if (email.length > 120) {
        return { status: 'error', message: 'Email không được vượt quá 120 ký tự.' };
      }
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(email)) {
        return { status: 'error', message: 'Địa chỉ email không hợp lệ.' };
      }
    }

    // 4. Rate Limiting by IP
    const reqHeaders = await headers();
    const rawIp = reqHeaders.get('x-forwarded-for') || reqHeaders.get('x-real-ip') || '127.0.0.1';
    const ip = rawIp.split(',')[0].trim();

    if (await isRateLimited('ip', ip)) {
      return { status: 'error', message: 'Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau ít phút.' };
    }

    if (phoneClean && (await isRateLimited('phone', phoneClean))) {
      return { status: 'error', message: 'Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau ít phút.' };
    }

    if (!phoneClean && email && (await isRateLimited('phone', email))) {
      return { status: 'error', message: 'Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau ít phút.' };
    }

    // 5. Anti-spam: check database for duplicate submissions in last 5 minutes using safe queries
    const adminSupabase = createServiceRoleClient();
    const cutoffTime = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    if (email) {
      const { data: existingEmail } = await adminSupabase
        .from('newsletter_leads')
        .select('id')
        .eq('email', email)
        .gt('created_at', cutoffTime)
        .limit(1);

      if (existingEmail && existingEmail.length > 0) {
        return { status: 'error', message: 'Thông tin này đã được đăng ký nhận ưu đãi gần đây.' };
      }
    }

    if (phoneClean) {
      const { data: existingPhone } = await adminSupabase
        .from('newsletter_leads')
        .select('id')
        .eq('phone', phoneClean)
        .gt('created_at', cutoffTime)
        .limit(1);

      if (existingPhone && existingPhone.length > 0) {
        return { status: 'error', message: 'Thông tin này đã được đăng ký nhận ưu đãi gần đây.' };
      }
    }

    // 6. DB Write - IP is omitted for privacy compliance
    await createNewsletterLead({
      name,
      email,
      phone: phoneClean,
      source: 'popup',
      metadata: {},
    });

    return { status: 'success' };
  } catch (err) {
    console.error('[submitNewsletterAction] error:', err);
    return { status: 'error', message: 'Đăng ký thất bại. Vui lòng thử lại sau.' };
  }
}
