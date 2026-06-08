import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Inserts, Tables, Updates } from '@/lib/types/database';
import { getRankBefore, getRankBetween } from '@/lib/services/admin/rank-key';

import { buildAuditMetadata, type RequestContext } from '@/lib/services/admin/audit-metadata';
import { requireAdminAuth } from '@/lib/services/admin/auth';

export type AdminSalesContact = Pick<
  Tables<'sales_contacts'>,
  'id' | 'name' | 'role' | 'phone' | 'zalo' | 'avatar_url' | 'sort_order' | 'rank_key' | 'is_active'
>;

export interface SalesContactPayload {
  name: string;
  role: string | null;
  phone: string;
  zalo: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

const SALES_CONTACT_MUTATION_ROLES = ['super_admin', 'admin', 'editor'] as const;
const ADMIN_SALES_CONTACT_SELECT =
  'id, name, role, phone, zalo, avatar_url, sort_order, rank_key, is_active';
const SHOULD_LOG_TIMINGS =
  process.env.NODE_ENV === 'development' && process.env.ADMIN_TIMING_LOGS === '1';

function normalizePhone(phone: string) {
  return phone.trim().replace(/\s+/g, ' ');
}

function normalizeNullableText(value: string | null) {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

function getContactInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'SC';
}

function buildGeneratedAvatar(name: string) {
  const initials = getContactInitials(name);
  const palette = [
    ['#1B3A6B', '#2E5B9A'],
    ['#0F766E', '#14B8A6'],
    ['#9A3412', '#F97316'],
    ['#7C2D12', '#E11D48'],
  ];
  const seed = name
    .split('')
    .reduce((total, char) => total + char.charCodeAt(0), 0);
  const [from, to] = palette[seed % palette.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" role="img" aria-label="${initials}"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/></linearGradient></defs><rect width="160" height="160" rx="36" fill="url(#bg)"/><circle cx="80" cy="80" r="52" fill="rgba(255,255,255,0.12)"/><text x="50%" y="54%" text-anchor="middle" font-family="Arial, sans-serif" font-size="54" font-weight="700" fill="#ffffff">${initials}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function normalizeZalo(value: string | null, phone: string) {
  const trimmed = value?.trim() ?? '';

  if (trimmed.length > 0) {
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    const digits = trimmed.replace(/\D/g, '');
    return digits ? `https://zalo.me/${digits}` : trimmed;
  }

  const phoneDigits = phone.replace(/\D/g, '');
  return phoneDigits ? `https://zalo.me/${phoneDigits}` : null;
}

function normalizeSalesContactPayload(payload: SalesContactPayload): Omit<Inserts<'sales_contacts'>, 'sort_order' | 'rank_key'> {
  const phone = normalizePhone(payload.phone);
  const name = payload.name.trim();

  return {
    name,
    role: normalizeNullableText(payload.role),
    phone,
    zalo: normalizeZalo(payload.zalo, phone),
    avatar_url: normalizeNullableText(payload.avatar_url) ?? buildGeneratedAvatar(name),
    is_active: payload.is_active,
  };
}

function toSalesContactAuditSnapshot(contact: AdminSalesContact) {
  return {
    name: contact.name,
    role: contact.role,
    phone: contact.phone,
    zalo: contact.zalo,
    avatar_url: contact.avatar_url,
    sort_order: contact.sort_order,
    rank_key: contact.rank_key,
    is_active: contact.is_active,
  };
}

export async function getAdminSalesContacts() {
  try {
    await requireAdminAuth();
    const supabase = createServiceRoleClient();
    const t0 = SHOULD_LOG_TIMINGS ? performance.now() : 0;

    const { data, error } = await supabase
      .from('sales_contacts')
      .select(ADMIN_SALES_CONTACT_SELECT)
      .order('rank_key', { ascending: true })
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (SHOULD_LOG_TIMINGS) console.info(`[admin:sales-contacts] getAdminSalesContacts ${(performance.now() - t0).toFixed(1)}ms`);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể tải liên hệ bán hàng.';
    return { data: null, error: message };
  }
}

export interface GetAdminSalesContactsPageParams {
  page?: number;
  pageSize?: number;
}

export interface GetAdminSalesContactsPageResult {
  data: AdminSalesContact[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  error: string | null;
}

export async function getAdminSalesContactsPage(
  params: GetAdminSalesContactsPageParams = {},
): Promise<GetAdminSalesContactsPageResult> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const offset = (page - 1) * pageSize;

  try {
    await requireAdminAuth();
    const supabase = createServiceRoleClient();

    const { data, error, count } = await supabase
      .from('sales_contacts')
      .select(ADMIN_SALES_CONTACT_SELECT, { count: 'exact' })
      .order('rank_key', { ascending: true })
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      return { data: [], total: 0, page, pageSize, pageCount: 0, error: error.message };
    }

    const total = count ?? 0;
    return {
      data: (data ?? []) as AdminSalesContact[],
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
      error: err instanceof Error ? err.message : 'Không thể tải liên hệ bán hàng.',
    };
  }
}

export interface AdminSalesContactStats {
  total: number;
  activeCount: number;
  hiddenCount: number;
  zaloReadyCount: number;
}

export async function getAdminSalesContactStats(): Promise<{ data: AdminSalesContactStats; error: string | null }> {
  const EMPTY: AdminSalesContactStats = { total: 0, activeCount: 0, hiddenCount: 0, zaloReadyCount: 0 };
  try {
    await requireAdminAuth();
    const supabase = createServiceRoleClient();
    const [totalRes, activeRes, zaloRes] = await Promise.all([
      supabase.from('sales_contacts').select('id', { count: 'exact', head: true }),
      supabase.from('sales_contacts').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('sales_contacts').select('id', { count: 'exact', head: true }).not('zalo', 'is', null),
    ]);
    const total = totalRes.count ?? 0;
    const activeCount = activeRes.count ?? 0;
    return {
      data: { total, activeCount, hiddenCount: total - activeCount, zaloReadyCount: zaloRes.count ?? 0 },
      error: totalRes.error?.message ?? activeRes.error?.message ?? zaloRes.error?.message ?? null,
    };
  } catch (err) {
    return { data: EMPTY, error: err instanceof Error ? err.message : 'Lỗi không xác định' };
  }
}

export async function createAdminSalesContact(payload: SalesContactPayload, requestContext?: RequestContext) {
  const adminUser = await requireAdminAuth(SALES_CONTACT_MUTATION_ROLES);
  const supabase = createServiceRoleClient();
  const basePayload = normalizeSalesContactPayload(payload);

  // Find first sales contact's rank key to place new item first
  const { data: firstContacts } = await supabase
    .from('sales_contacts')
    .select('rank_key')
    .order('rank_key', { ascending: true })
    .order('sort_order', { ascending: true })
    .limit(1);

  const firstRank = firstContacts?.[0]?.rank_key ?? null;
  const newRank = getRankBefore(firstRank);

  const { data, error } = await supabase
    .from('sales_contacts')
    .insert({ ...basePayload, rank_key: newRank, sort_order: 0 })
    .select('*')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: 'create',
    entity: 'sales_contacts',
    entity_id: data.id,
    metadata: buildAuditMetadata({
      label: data.name,
      after: toSalesContactAuditSnapshot(data),
      requestContext,
    }),
  });

  return { data, error: null };
}

export async function updateAdminSalesContact(contactId: string, payload: SalesContactPayload, requestContext?: RequestContext) {
  const adminUser = await requireAdminAuth(SALES_CONTACT_MUTATION_ROLES);
  const supabase = createServiceRoleClient();
  const { data: before } = await supabase
    .from('sales_contacts')
    .select(ADMIN_SALES_CONTACT_SELECT)
    .eq('id', contactId)
    .maybeSingle<AdminSalesContact>();
  const updatePayload: Updates<'sales_contacts'> = {
    ...normalizeSalesContactPayload(payload),
    sort_order: before?.sort_order ?? 0,
    rank_key: before?.rank_key,
  };

  const { data, error } = await supabase
    .from('sales_contacts')
    .update(updatePayload)
    .eq('id', contactId)
    .select('*')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: 'update',
    entity: 'sales_contacts',
    entity_id: data.id,
    metadata: buildAuditMetadata({
      label: data.name,
      before: before ? toSalesContactAuditSnapshot(before) : null,
      after: toSalesContactAuditSnapshot(data),
      requestContext,
    }),
  });

  return { data, error: null };
}

export async function deleteAdminSalesContact(contactId: string, requestContext?: RequestContext) {
  const adminUser = await requireAdminAuth(SALES_CONTACT_MUTATION_ROLES);
  const supabase = createServiceRoleClient();

  const { data: contact } = await supabase
    .from('sales_contacts')
    .select('id, name, phone')
    .eq('id', contactId)
    .maybeSingle();

  if (!contact) {
    return { data: null, error: 'Không tìm thấy liên hệ cần xóa.' };
  }

  const { error } = await supabase.from('sales_contacts').delete().eq('id', contactId);

  if (error) {
    return { data: null, error: error.message };
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: 'delete',
    entity: 'sales_contacts',
    entity_id: contact.id,
    metadata: buildAuditMetadata({
      label: contact.name,
      before: {
        name: contact.name,
        phone: contact.phone,
      },
      requestContext,
    }),
  });

  return { data: contact, error: null };
}

export async function setAdminSalesContactActive(contactId: string, isActive: boolean, requestContext?: RequestContext) {
  const adminUser = await requireAdminAuth(SALES_CONTACT_MUTATION_ROLES);
  const supabase = createServiceRoleClient();
  const { data: before } = await supabase
    .from('sales_contacts')
    .select(ADMIN_SALES_CONTACT_SELECT)
    .eq('id', contactId)
    .maybeSingle<AdminSalesContact>();

  const { data, error } = await supabase
    .from('sales_contacts')
    .update({ is_active: isActive })
    .eq('id', contactId)
    .select('id, name, phone, sort_order, rank_key, is_active')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: isActive ? 'activate' : 'deactivate',
    entity: 'sales_contacts',
    entity_id: data.id,
    metadata: buildAuditMetadata({
      label: data.name,
      before: before ? toSalesContactAuditSnapshot(before) : null,
      after: {
        ...(before ? toSalesContactAuditSnapshot(before) : {}),
        sort_order: data.sort_order,
        rank_key: data.rank_key,
        is_active: data.is_active,
      },
      requestContext,
    }),
  });

  return { data, error: null };
}

export async function moveAdminSalesContact(
  itemId: string,
  beforeId: string | null,
  afterId: string | null,
  requestContext?: RequestContext,
) {
  const adminUser = await requireAdminAuth(SALES_CONTACT_MUTATION_ROLES);
  const supabase = createServiceRoleClient();

  const retryOperation = async () => {
    const ids = [itemId];
    if (beforeId) ids.push(beforeId);
    if (afterId) ids.push(afterId);

    const { data: items, error: fetchError } = await supabase
      .from('sales_contacts')
      .select('id, rank_key, name')
      .in('id', ids);

    if (fetchError || !items) {
      return { data: null, error: fetchError?.message ?? 'Không thể tải thông tin liên hệ.' };
    }

    const itemMap = new Map(items.map((i) => [i.id, i]));
    const item = itemMap.get(itemId);
    if (!item) {
      return { data: null, error: 'Không tìm thấy liên hệ di chuyển.' };
    }

    const beforeRank = beforeId ? itemMap.get(beforeId)?.rank_key ?? null : null;
    const afterRank = afterId ? itemMap.get(afterId)?.rank_key ?? null : null;

    let newRank: string;
    try {
      newRank = getRankBetween(beforeRank, afterRank);
    } catch (err) {
      return { data: null, error: 'Không thể tính toán thứ tự: ' + (err instanceof Error ? err.message : String(err)) };
    }

    const { data: updated, error: updateError } = await supabase
      .from('sales_contacts')
      .update({ rank_key: newRank })
      .eq('id', itemId)
      .select('rank_key')
      .single();

    if (updateError) {
      return { data: null, error: updateError.message };
    }

    await supabase.from('audit_logs').insert({
      actor_id: adminUser.id,
      action: 'reorder',
      entity: 'sales_contacts',
      entity_id: itemId,
      metadata: buildAuditMetadata({
        label: item.name,
        extra: {
          moved_id: itemId,
          before_id: beforeId,
          after_id: afterId,
          new_rank_key: newRank,
        },
        requestContext,
      }),
    });

    return { data: newRank, error: null };
  };

  const result = await retryOperation();
  if (result.error) {
    const retryResult = await retryOperation();
    return retryResult;
  }
  return result;
}
