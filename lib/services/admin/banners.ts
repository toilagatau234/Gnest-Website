import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Inserts, Tables, Updates } from '@/lib/types/database';
import { buildAuditMetadata, type RequestContext } from '@/lib/services/admin/audit-metadata';
import { requireAdminAuth } from '@/lib/services/admin/auth';

export type AdminBanner = Pick<
  Tables<'promotional_banners'>,
  'id' | 'name' | 'content' | 'link_url' | 'sort_order' | 'is_active' | 'created_at' | 'updated_at'
>;

export interface BannerPayload {
  name: string;
  content: string;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
}

const BANNER_MUTATION_ROLES = ['super_admin', 'admin', 'editor'] as const;
const ADMIN_BANNER_SELECT = 'id, name, content, link_url, sort_order, is_active, created_at, updated_at';

function normalizeNullableText(value: string | null) {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeBannerPayload(payload: BannerPayload): Inserts<'promotional_banners'> {
  return {
    name: payload.name.trim(),
    content: payload.content.trim(),
    link_url: normalizeNullableText(payload.link_url),
    sort_order: payload.sort_order,
    is_active: payload.is_active,
  };
}

function toBannerAuditSnapshot(banner: AdminBanner) {
  return {
    name: banner.name,
    content: banner.content,
    link_url: banner.link_url,
    sort_order: banner.sort_order,
    is_active: banner.is_active,
  };
}

export async function getAdminBanners() {
  try {
    await requireAdminAuth();
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('promotional_banners')
      .select(ADMIN_BANNER_SELECT)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể tải danh sách banner.';
    return { data: null, error: message };
  }
}

export interface GetAdminBannersPageParams {
  page?: number;
  pageSize?: number;
}

export interface GetAdminBannersPageResult {
  data: AdminBanner[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  error: string | null;
}

export async function getAdminBannersPage(
  params: GetAdminBannersPageParams = {},
): Promise<GetAdminBannersPageResult> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const offset = (page - 1) * pageSize;

  try {
    await requireAdminAuth();
    const supabase = createServiceRoleClient();

    const { data, error, count } = await supabase
      .from('promotional_banners')
      .select(ADMIN_BANNER_SELECT, { count: 'exact' })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      return { data: [], total: 0, page, pageSize, pageCount: 0, error: error.message };
    }

    const total = count ?? 0;
    return {
      data: (data ?? []) as AdminBanner[],
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
      error: err instanceof Error ? err.message : 'Không thể tải danh sách banner.',
    };
  }
}

export interface AdminBannerStats {
  total: number;
  activeCount: number;
  hiddenCount: number;
}

export async function getAdminBannerStats(): Promise<{ data: AdminBannerStats; error: string | null }> {
  const EMPTY: AdminBannerStats = { total: 0, activeCount: 0, hiddenCount: 0 };
  try {
    await requireAdminAuth();
    const supabase = createServiceRoleClient();
    const [totalRes, activeRes] = await Promise.all([
      supabase.from('promotional_banners').select('id', { count: 'exact', head: true }),
      supabase.from('promotional_banners').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ]);
    const total = totalRes.count ?? 0;
    const activeCount = activeRes.count ?? 0;
    return {
      data: { total, activeCount, hiddenCount: total - activeCount },
      error: totalRes.error?.message ?? activeRes.error?.message ?? null,
    };
  } catch (err) {
    return { data: EMPTY, error: err instanceof Error ? err.message : 'Lỗi không xác định' };
  }
}

export async function createAdminBanner(payload: BannerPayload, requestContext?: RequestContext) {
  const adminUser = await requireAdminAuth(BANNER_MUTATION_ROLES);
  const supabase = createServiceRoleClient();
  const insertPayload = normalizeBannerPayload(payload);

  const { data, error } = await supabase
    .from('promotional_banners')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: 'create',
    entity: 'promotional_banners',
    entity_id: data.id,
    metadata: buildAuditMetadata({
      label: data.name,
      after: toBannerAuditSnapshot(data),
      requestContext,
    }),
  });

  return { data, error: null };
}

export async function updateAdminBanner(bannerId: string, payload: BannerPayload, requestContext?: RequestContext) {
  const adminUser = await requireAdminAuth(BANNER_MUTATION_ROLES);
  const supabase = createServiceRoleClient();
  const { data: before } = await supabase
    .from('promotional_banners')
    .select(ADMIN_BANNER_SELECT)
    .eq('id', bannerId)
    .maybeSingle<AdminBanner>();
  const updatePayload: Updates<'promotional_banners'> = normalizeBannerPayload(payload);

  const { data, error } = await supabase
    .from('promotional_banners')
    .update(updatePayload)
    .eq('id', bannerId)
    .select('*')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: 'update',
    entity: 'promotional_banners',
    entity_id: data.id,
    metadata: buildAuditMetadata({
      label: data.name,
      before: before ? toBannerAuditSnapshot(before) : null,
      after: toBannerAuditSnapshot(data),
      requestContext,
    }),
  });

  return { data, error: null };
}

export async function deleteAdminBanner(bannerId: string, requestContext?: RequestContext) {
  const adminUser = await requireAdminAuth(BANNER_MUTATION_ROLES);
  const supabase = createServiceRoleClient();

  const { data: banner } = await supabase
    .from('promotional_banners')
    .select('id, name')
    .eq('id', bannerId)
    .maybeSingle();

  if (!banner) {
    return { data: null, error: 'Không tìm thấy banner cần xóa.' };
  }

  const { error } = await supabase.from('promotional_banners').delete().eq('id', bannerId);

  if (error) {
    return { data: null, error: error.message };
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: 'delete',
    entity: 'promotional_banners',
    entity_id: banner.id,
    metadata: buildAuditMetadata({
      label: banner.name,
      before: {
        name: banner.name,
      },
      requestContext,
    }),
  });

  return { data: banner, error: null };
}

export async function setAdminBannerActive(bannerId: string, isActive: boolean, requestContext?: RequestContext) {
  const adminUser = await requireAdminAuth(BANNER_MUTATION_ROLES);
  const supabase = createServiceRoleClient();
  const { data: before } = await supabase
    .from('promotional_banners')
    .select(ADMIN_BANNER_SELECT)
    .eq('id', bannerId)
    .maybeSingle<AdminBanner>();

  const { data, error } = await supabase
    .from('promotional_banners')
    .update({ is_active: isActive })
    .eq('id', bannerId)
    .select('id, name, is_active')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: isActive ? 'activate' : 'deactivate',
    entity: 'promotional_banners',
    entity_id: data.id,
    metadata: buildAuditMetadata({
      label: data.name,
      before: before ? toBannerAuditSnapshot(before) : null,
      after: {
        ...(before ? toBannerAuditSnapshot(before) : {}),
        is_active: data.is_active,
      },
      requestContext,
    }),
  });

  return { data, error: null };
}
