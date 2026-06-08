'use server';

import { headers } from 'next/headers';
import { createInquiry } from '@/lib/services/inquiries';
import { getActivePublicProductQuoteContextById } from '@/lib/services/public-products';
import { isRateLimited } from '@/lib/services/rate-limit';

export type QuoteFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

export async function submitQuoteAction(
  _prev: QuoteFormState,
  formData: FormData
): Promise<QuoteFormState> {
  // 1. Honeypot check
  const honeypot = formData.get('website_hp');
  if (honeypot && typeof honeypot === 'string' && honeypot.length > 0) {
    // Silently reject spam or return a generic error
    return { status: 'error', message: 'Bạn đã gửi yêu cầu quá nhanh. Vui lòng thử lại sau ít phút.' };
  }

  // 2. Read and enforce size constraints
  const customerName = (formData.get('customer_name') as string | null)?.trim() ?? '';
  const phone = (formData.get('phone') as string | null)?.trim() ?? '';
  const email = (formData.get('email') as string | null)?.trim() || null;
  const message = (formData.get('message') as string | null)?.trim() || null;
  const productId = (formData.get('product_id') as string | null)?.trim() || null;

  if (
    customerName.length > 200 ||
    phone.length > 50 ||
    (email && email.length > 200) ||
    (message && message.length > 3000) ||
    (productId && productId.length > 100)
  ) {
    return { status: 'error', message: 'Dữ liệu quá dài.' };
  }

  if (!productId) {
    return { status: 'error', message: 'Yêu cầu báo giá phải gắn với một sản phẩm cụ thể.' };
  }

  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(productId)) {
    return { status: 'error', message: 'Mã sản phẩm không hợp lệ.' };
  }

  if (!customerName || customerName.length < 2 || customerName.length > 80) {
    return { status: 'error', message: 'Vui lòng nhập họ tên hợp lệ (từ 2 đến 80 ký tự).' };
  }

  const phoneClean = phone.replace(/\D/g, '');
  if (!phoneClean || phoneClean.length < 9 || phoneClean.length > 12) {
    return { status: 'error', message: 'Vui lòng nhập số điện thoại hợp lệ (9 đến 12 chữ số).' };
  }

  if (email) {
    if (email.length > 120) {
      return { status: 'error', message: 'Email không được dài quá 120 ký tự.' };
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      return { status: 'error', message: 'Địa chỉ email không hợp lệ.' };
    }
  }

  if (message && message.length > 1000) {
    return { status: 'error', message: 'Nội dung tin nhắn không được vượt quá 1000 ký tự.' };
  }

  // 3. Server-side Rate Limiting
  const reqHeaders = await headers();
  const rawIp = reqHeaders.get('x-forwarded-for') || reqHeaders.get('x-real-ip') || '127.0.0.1';
  // If there are multiple IPs in x-forwarded-for, get the first one
  const ip = rawIp.split(',')[0].trim();

  // Rate Limiting by IP: 5 requests / 10 minutes
  if (isRateLimited('ip', ip)) {
    return { status: 'error', message: 'Bạn đã gửi yêu cầu quá nhanh. Vui lòng thử lại sau ít phút.' };
  }

  // Rate Limiting by Phone: 3 requests / 30 minutes
  if (isRateLimited('phone', phoneClean)) {
    return { status: 'error', message: 'Bạn đã gửi yêu cầu quá nhanh. Vui lòng thử lại sau ít phút.' };
  }

  // Rate Limiting by Phone + Product: 2 requests / 15 minutes
  if (isRateLimited('phoneProduct', `${phoneClean}:${productId}`)) {
    return { status: 'error', message: 'Bạn đã gửi yêu cầu quá nhanh. Vui lòng thử lại sau ít phút.' };
  }

  // Rate Limiting by IP + Product: 3 requests / 15 minutes
  if (isRateLimited('ipProduct', `${ip}:${productId}`)) {
    return { status: 'error', message: 'Bạn đã gửi yêu cầu quá nhanh. Vui lòng thử lại sau ít phút.' };
  }

  let verifiedProductId: string;
  let metadata: Record<string, string>;

  try {
    const product = await getActivePublicProductQuoteContextById(productId);
    if (!product) {
      return { status: 'error', message: 'Sản phẩm không tồn tại hoặc không còn được bán.' };
    }
    verifiedProductId = product.id;
    metadata = {
      source: 'product_detail',
      product_slug: product.slug,
      product_name: product.name,
    };
  } catch (err) {
    console.error('[submitQuoteAction] product verification failed', err);
    return { status: 'error', message: 'Gửi yêu cầu thất bại. Vui lòng thử lại sau.' };
  }

  try {
    await createInquiry({
      customer_name: customerName,
      phone: phoneClean,
      email,
      product_id: verifiedProductId,
      message,
      metadata,
    });

    return { status: 'success' };
  } catch (err) {
    console.error('[submitQuoteAction]', err);
    return { status: 'error', message: 'Gửi yêu cầu thất bại. Vui lòng thử lại sau.' };
  }
}

