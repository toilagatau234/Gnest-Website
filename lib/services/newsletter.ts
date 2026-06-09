import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Inserts } from '@/lib/types/database';

export type CreateNewsletterInput = Pick<
  Inserts<'newsletter_leads'>,
  'name' | 'phone' | 'email' | 'source' | 'metadata'
>;

export async function createNewsletterLead(input: CreateNewsletterInput) {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('newsletter_leads')
    .insert({
      name: input.name?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      source: input.source || 'popup',
      metadata: input.metadata || {},
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Lỗi lưu thông tin đăng ký: ${error.message}`);
  }

  return data;
}
