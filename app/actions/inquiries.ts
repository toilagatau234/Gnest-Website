'use server';

import { createInquiry } from '@/lib/services/inquiries';
import { getActivePublicProductQuoteContextById } from '@/lib/services/public-products';

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

  let verifiedProductId: string | null = null;
  let metadata: Record<string, string> = { source: 'product_detail' };

  if (productId) {
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
