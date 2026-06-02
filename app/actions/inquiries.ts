'use server';

import { createInquiry } from '@/lib/services/inquiries';

export type QuoteFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

export async function submitQuoteAction(
  _prev: QuoteFormState,
  formData: FormData
): Promise<QuoteFormState> {
  const customerName = (formData.get('customer_name') as string | null)?.trim() ?? '';
  const phone = (formData.get('phone') as string | null)?.trim() ?? '';
  const email = (formData.get('email') as string | null)?.trim() || null;
  const message = (formData.get('message') as string | null)?.trim() || null;
  const productId = (formData.get('product_id') as string | null)?.trim() || null;
  const productSlug = (formData.get('product_slug') as string | null)?.trim() || null;
  const productName = (formData.get('product_name') as string | null)?.trim() || null;

  if (!customerName || customerName.length < 2) {
    return { status: 'error', message: 'Vui lòng nhập họ tên hợp lệ (ít nhất 2 ký tự).' };
  }

  const phoneClean = phone.replace(/\D/g, '');
  if (!phoneClean || phoneClean.length < 9 || phoneClean.length > 12) {
    return { status: 'error', message: 'Vui lòng nhập số điện thoại hợp lệ.' };
  }

  if (email) {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      return { status: 'error', message: 'Địa chỉ email không hợp lệ.' };
    }
  }

  try {
    await createInquiry({
      customer_name: customerName,
      phone: phoneClean,
      email,
      product_id: productId,
      message,
      metadata: {
        source: 'product_detail',
        ...(productSlug ? { product_slug: productSlug } : {}),
        ...(productName ? { product_name: productName } : {}),
      },
    });

    return { status: 'success' };
  } catch (err) {
    console.error('[submitQuoteAction]', err);
    return { status: 'error', message: 'Gửi yêu cầu thất bại. Vui lòng thử lại sau.' };
  }
}
