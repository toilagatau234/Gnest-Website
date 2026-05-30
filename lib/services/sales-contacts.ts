import { createClient } from '@/lib/supabase/client';
import type { Tables } from '@/lib/types/database';

export type SalesContact = Tables<'sales_contacts'>;

function isSupabaseConfigured() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

function getSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase environment variables are not configured.');
  }

  return createClient();
}

export async function getSalesContacts() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('sales_contacts')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to load sales contacts: ${error.message}`);
  }

  return data;
}
