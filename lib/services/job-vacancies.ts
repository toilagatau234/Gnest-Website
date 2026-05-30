import { createClient } from '@/lib/supabase/client';
import type { Tables } from '@/lib/types/database';

export type JobVacancy = Tables<'job_vacancies'>;

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

export async function getJobVacancies() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('job_vacancies')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load job vacancies: ${error.message}`);
  }

  return data;
}
