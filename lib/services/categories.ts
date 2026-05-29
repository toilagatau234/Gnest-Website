import { createClient } from '@/lib/supabase/client';
import type { Tables } from '@/lib/types/database';

export type Category = Tables<'categories'>;

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

export async function getCategories() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to load categories: ${error.message}`);
  }

  return data;
}

export async function getCategoryBySlug(slug: string) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load category "${slug}": ${error.message}`);
  }

  return data;
}
