import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Inserts, Tables, Updates } from '@/lib/types/database';
import { buildAuditMetadata, type RequestContext } from '@/lib/services/admin/audit-metadata';
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

function normalizeJobVacancyPayload(payload: JobVacancyPayload): Omit<Inserts<'job_vacancies'>, 'sort_order'> {
  const title = payload.title.trim();
  const slug = payload.slug.trim() ? slugify(payload.slug) : slugify(title);

  return {
    title,
    slug,
    description: normalizeNullableText(payload.description),
    location: normalizeNullableText(payload.location),
    salary_range: normalizeNullableText(payload.salary_range),
    is_active: payload.is_active,
  };
}

async function shiftJobOrdersForNewestFirst(supabase: ReturnType<typeof createServiceRoleClient>) {
  const { data, error } = await supabase
    .from('job_vacancies')
    .select('id, sort_order')
    .order('sort_order', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) {
    return error.message;
  }

  for (const job of data ?? []) {
    const { error: updateError } = await supabase
      .from('job_vacancies')
      .update({ sort_order: (job.sort_order ?? 0) + 1 })
      .eq('id', job.id);

    if (updateError) {
      return updateError.message;
    }
  }

  return null;
}

async function validateGlobalJobOrder(
  supabase: ReturnType<typeof createServiceRoleClient>,
  orderedIds: string[],
) {
  const uniqueIds = new Set(orderedIds);

  if (uniqueIds.size !== orderedIds.length) {
    return 'Danh sách sắp xếp có ID bị lặp.';
  }

  const { data, error } = await supabase.from('job_vacancies').select('id').order('sort_order', { ascending: true });

  if (error) {
    return error.message;
  }

  const existingIds = (data ?? []).map((item) => item.id);

  if (existingIds.length !== orderedIds.length) {
    return 'Danh sách sắp xếp không khớp dữ liệu hiện tại.';
  }

  for (const id of orderedIds) {
    if (!existingIds.includes(id)) {
      return 'Danh sách sắp xếp chứa tin tuyển dụng ngoài phạm vi cho phép.';
    }
  }

  return null;
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

export interface GetAdminJobsPageParams {
  page?: number;
  pageSize?: number;
}

export interface GetAdminJobsPageResult {
  data: AdminJobVacancy[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  error: string | null;
}

export async function getAdminJobsPage(
  params: GetAdminJobsPageParams = {},
): Promise<GetAdminJobsPageResult> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const offset = (page - 1) * pageSize;

  try {
    await requireAdminAuth();
    const supabase = createServiceRoleClient();

    const { data, error, count } = await supabase
      .from('job_vacancies')
      .select(ADMIN_JOB_VACANCY_SELECT, { count: 'exact' })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      return { data: [], total: 0, page, pageSize, pageCount: 0, error: error.message };
    }

    const total = count ?? 0;
    return {
      data: (data ?? []) as AdminJobVacancy[],
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
      error: null,
    };
  } catch (err) {
    return {
      data: [],
      total: 0,
      page,
      pageSize,
      pageCount: 0,
      error: err instanceof Error ? err.message : 'Không thể tải danh sách tin tuyển dụng.',
    };
  }
}

export interface AdminJobStats {
  total: number;
  activeCount: number;
  hiddenCount: number;
  locationCount: number;
}

export async function getAdminJobStats(): Promise<{ data: AdminJobStats; error: string | null }> {
  const EMPTY: AdminJobStats = { total: 0, activeCount: 0, hiddenCount: 0, locationCount: 0 };
  try {
    await requireAdminAuth();
    const supabase = createServiceRoleClient();
    const [totalRes, activeRes, locationRes] = await Promise.all([
      supabase.from('job_vacancies').select('id', { count: 'exact', head: true }),
      supabase.from('job_vacancies').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('job_vacancies').select('id', { count: 'exact', head: true }).not('location', 'is', null),
    ]);
    const total = totalRes.count ?? 0;
    const activeCount = activeRes.count ?? 0;
    return {
      data: { total, activeCount, hiddenCount: total - activeCount, locationCount: locationRes.count ?? 0 },
      error: totalRes.error?.message ?? activeRes.error?.message ?? locationRes.error?.message ?? null,
    };
  } catch (err) {
    return { data: EMPTY, error: err instanceof Error ? err.message : 'Lỗi không xác định' };
  }
}

export async function createAdminJob(payload: JobVacancyPayload, requestContext?: RequestContext) {
  const adminUser = await requireAdminAuth(JOB_VACANCY_MUTATION_ROLES);
  const supabase = createServiceRoleClient();
  const basePayload = normalizeJobVacancyPayload(payload);

  if (!basePayload.title) {
    return { data: null, error: 'Tiêu đề tuyển dụng là bắt buộc.' };
  }
  if (!basePayload.slug) {
    return { data: null, error: 'Đường dẫn (slug) là bắt buộc.' };
  }

  const shiftError = await shiftJobOrdersForNewestFirst(supabase);
  if (shiftError) {
    return { data: null, error: shiftError };
  }

  const { data, error } = await supabase
    .from('job_vacancies')
    .insert({ ...basePayload, sort_order: 0 })
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
    metadata: buildAuditMetadata({
      label: data.title,
      after: { title: data.title, slug: data.slug, sort_order: data.sort_order, is_active: data.is_active },
      requestContext,
    }),
  });

  return { data, error: null };
}

export async function updateAdminJob(jobId: string, payload: JobVacancyPayload, requestContext?: RequestContext) {
  const adminUser = await requireAdminAuth(JOB_VACANCY_MUTATION_ROLES);
  const supabase = createServiceRoleClient();
  const { data: before } = await supabase
    .from('job_vacancies')
    .select(ADMIN_JOB_VACANCY_SELECT)
    .eq('id', jobId)
    .maybeSingle<AdminJobVacancy>();
  const basePayload = normalizeJobVacancyPayload(payload);
  const updatePayload: Updates<'job_vacancies'> = {
    ...basePayload,
    sort_order: before?.sort_order ?? 0,
  };

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
    metadata: buildAuditMetadata({
      label: data.title,
      before: before
        ? {
            title: before.title,
            slug: before.slug,
            sort_order: before.sort_order,
            is_active: before.is_active,
          }
        : null,
      after: { title: data.title, slug: data.slug, sort_order: data.sort_order, is_active: data.is_active },
      requestContext,
    }),
  });

  return { data, error: null };
}

export async function deleteAdminJob(jobId: string, requestContext?: RequestContext) {
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
    metadata: buildAuditMetadata({
      label: job.title,
      before: { title: job.title, slug: job.slug },
      requestContext,
    }),
  });

  return { data: job, error: null };
}

export async function setAdminJobActive(jobId: string, isActive: boolean, requestContext?: RequestContext) {
  const adminUser = await requireAdminAuth(JOB_VACANCY_MUTATION_ROLES);
  const supabase = createServiceRoleClient();
  const { data: before } = await supabase
    .from('job_vacancies')
    .select('title, slug, sort_order, is_active')
    .eq('id', jobId)
    .maybeSingle();

  const { data, error } = await supabase
    .from('job_vacancies')
    .update({ is_active: isActive })
    .eq('id', jobId)
    .select('id, title, slug, sort_order, is_active')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: isActive ? 'activate' : 'deactivate',
    entity: 'job_vacancies',
    entity_id: data.id,
    metadata: buildAuditMetadata({
      label: data.title,
      before,
      after: { title: data.title, slug: data.slug, sort_order: data.sort_order, is_active: data.is_active },
      requestContext,
    }),
  });

  return { data, error: null };
}

export async function reorderAdminJobs(orderedIds: string[], requestContext?: RequestContext) {
  const adminUser = await requireAdminAuth(JOB_VACANCY_MUTATION_ROLES);
  const supabase = createServiceRoleClient();

  const validationError = await validateGlobalJobOrder(supabase, orderedIds);
  if (validationError) {
    return { data: null, error: validationError };
  }

  for (let index = 0; index < orderedIds.length; index += 1) {
    const { error } = await supabase
      .from('job_vacancies')
      .update({ sort_order: index })
      .eq('id', orderedIds[index]);

    if (error) {
      return { data: null, error: error.message };
    }
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: 'reorder',
    entity: 'job_vacancies',
    entity_id: orderedIds[0] ?? adminUser.id,
    metadata: buildAuditMetadata({
      label: 'job_vacancies',
      extra: { ordered_ids: orderedIds },
      requestContext,
    }),
  });

  return { data: orderedIds, error: null };
}
