import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/types/database';

export type JobVacancy = Pick<
  Tables<'job_vacancies'>,
  'id' | 'title' | 'slug' | 'description' | 'location' | 'salary_range' | 'sort_order'
>;

const PUBLIC_JOB_VACANCY_SELECT = 'id, title, slug, description, location, salary_range, sort_order';

export async function getJobVacancies() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('job_vacancies')
    .select(PUBLIC_JOB_VACANCY_SELECT)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .returns<JobVacancy[]>();

  if (error) {
    throw new Error(`Failed to load job vacancies: ${error.message}`);
  }

  return data || [];
}
