import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Inserts, Tables, Updates } from '@/lib/types/database';
import { requireAdminAuth } from '@/lib/services/admin/auth';

export type AdminJobVacancy = Pick<
  Tables<'job_vacancies'>,
  'id' | 'title' | 'slug' | 'description' | 'location' | 'salary_range' | 'sort_order' | 'is_active' | 'created_at' | 'updated_at'
>;

export interface JobVacancyPayload {
  title: string;
  slug: string;
  description: string | null;
  location: string | null;
  salary_range: string | null;
  sort_order: number;
  is_active: boolean;
}

const JOB_VACANCY_MUTATION_ROLES = ['super_admin', 'admin', 'editor'] as const;
const ADMIN_JOB_VACANCY_SELECT =
  'id, title, slug, description, location, salary_range, sort_order, is_active, created_at, updated_at';
const SHOULD_LOG_TIMINGS =
  process.env.NODE_ENV === 'development' && process.env.ADMIN_TIMING_LOGS === '1';

function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function normalizeNullableText(value: string | null) {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeJobVacancyPayload(payload: JobVacancyPayload): Inserts<'job_vacancies'> {
  const title = payload.title.trim();
  const slug = payload.slug.trim() ? slugify(payload.slug) : slugify(title);

  return {
    title,
    slug,
    description: normalizeNullableText(payload.description),
    location: normalizeNullableText(payload.location),
    salary_range: normalizeNullableText(payload.salary_range),
    sort_order: payload.sort_order,
    is_active: payload.is_active,
  };
}

export async function getAdminJobs() {
  try {
    await requireAdminAuth();
    const supabase = createServiceRoleClient();
    const t0 = SHOULD_LOG_TIMINGS ? performance.now() : 0;

    const { data, error } = await supabase
      .from('job_vacancies')
      .select(ADMIN_JOB_VACANCY_SELECT)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (SHOULD_LOG_TIMINGS) console.info(`[admin:jobs] getAdminJobs ${(performance.now() - t0).toFixed(1)}ms`);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể tải danh sách tin tuyển dụng.';
    return { data: null, error: message };
  }
}

export async function createAdminJob(payload: JobVacancyPayload) {
  const adminUser = await requireAdminAuth(JOB_VACANCY_MUTATION_ROLES);
  const supabase = createServiceRoleClient();
  const insertPayload = normalizeJobVacancyPayload(payload);

  if (!insertPayload.title) {
    return { data: null, error: 'Tiêu đề tuyển dụng là bắt buộc.' };
  }
  if (!insertPayload.slug) {
    return { data: null, error: 'Đường dẫn (slug) là bắt buộc.' };
  }

  const { data, error } = await supabase
    .from('job_vacancies')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: 'create',
    entity: 'job_vacancies',
    entity_id: data.id,
    metadata: { title: data.title, slug: data.slug },
  });

  return { data, error: null };
}

export async function updateAdminJob(jobId: string, payload: JobVacancyPayload) {
  const adminUser = await requireAdminAuth(JOB_VACANCY_MUTATION_ROLES);
  const supabase = createServiceRoleClient();
  const updatePayload: Updates<'job_vacancies'> = normalizeJobVacancyPayload(payload);

  if (!updatePayload.title) {
    return { data: null, error: 'Tiêu đề tuyển dụng là bắt buộc.' };
  }
  if (!updatePayload.slug) {
    return { data: null, error: 'Đường dẫn (slug) là bắt buộc.' };
  }

  const { data, error } = await supabase
    .from('job_vacancies')
    .update(updatePayload)
    .eq('id', jobId)
    .select('*')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: 'update',
    entity: 'job_vacancies',
    entity_id: data.id,
    metadata: { title: data.title, slug: data.slug },
  });

  return { data, error: null };
}

export async function deleteAdminJob(jobId: string) {
  const adminUser = await requireAdminAuth(JOB_VACANCY_MUTATION_ROLES);
  const supabase = createServiceRoleClient();

  const { data: job } = await supabase
    .from('job_vacancies')
    .select('id, title, slug')
    .eq('id', jobId)
    .maybeSingle();

  if (!job) {
    return { data: null, error: 'Không tìm thấy tin tuyển dụng cần xóa.' };
  }

  const { error } = await supabase.from('job_vacancies').delete().eq('id', jobId);

  if (error) {
    return { data: null, error: error.message };
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: 'delete',
    entity: 'job_vacancies',
    entity_id: job.id,
    metadata: { title: job.title, slug: job.slug },
  });

  return { data: job, error: null };
}

export async function setAdminJobActive(jobId: string, isActive: boolean) {
  const adminUser = await requireAdminAuth(JOB_VACANCY_MUTATION_ROLES);
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('job_vacancies')
    .update({ is_active: isActive })
    .eq('id', jobId)
    .select('id, title, slug, is_active')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: isActive ? 'activate' : 'deactivate',
    entity: 'job_vacancies',
    entity_id: data.id,
    metadata: { title: data.title, slug: data.slug },
  });

  return { data, error: null };
}
