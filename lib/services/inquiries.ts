import { createClient } from '@/lib/supabase/server';
import type { Inserts } from '@/lib/types/database';

export type CreateInquiryInput = Pick<
  Inserts<'inquiries'>,
  'customer_name' | 'phone' | 'email' | 'product_id' | 'message' | 'metadata'
>;

export async function createInquiry(input: CreateInquiryInput) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('inquiries')
    .insert({
      customer_name: input.customer_name,
      phone: input.phone,
      email: input.email ?? null,
      product_id: input.product_id ?? null,
      message: input.message ?? null,
      metadata: input.metadata ?? {},
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create inquiry: ${error.message}`);
  }

  return data;
}
