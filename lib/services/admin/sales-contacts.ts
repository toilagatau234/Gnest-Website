import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Inserts, Tables, Updates } from '@/lib/types/database';

import { buildAuditMetadata } from '@/lib/services/admin/audit-metadata';
import { requireAdminAuth } from '@/lib/services/admin/auth';

export type AdminSalesContact = Pick<
  Tables<'sales_contacts'>,
  'id' | 'name' | 'role' | 'phone' | 'zalo' | 'avatar_url' | 'sort_order' | 'is_active'
>;

export interface SalesContactPayload {
  name: string;
  role: string | null;
  phone: string;
  zalo: string | null;
  avatar_url: string | null;
  sort_order: number;
  is_active: boolean;
}

const SALES_CONTACT_MUTATION_ROLES = ['super_admin', 'admin', 'editor'] as const;
const ADMIN_SALES_CONTACT_SELECT =
  'id, name, role, phone, zalo, avatar_url, sort_order, is_active';
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

function normalizeSalesContactPayload(payload: SalesContactPayload): Inserts<'sales_contacts'> {
  const phone = normalizePhone(payload.phone);
  const name = payload.name.trim();

  return {
    name,
    role: normalizeNullableText(payload.role),
    phone,
    zalo: normalizeZalo(payload.zalo, phone),
    avatar_url: normalizeNullableText(payload.avatar_url) ?? buildGeneratedAvatar(name),
    sort_order: payload.sort_order,
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

export async function createAdminSalesContact(payload: SalesContactPayload) {
  const adminUser = await requireAdminAuth(SALES_CONTACT_MUTATION_ROLES);
  const supabase = createServiceRoleClient();
  const insertPayload = normalizeSalesContactPayload(payload);

  const { data, error } = await supabase
    .from('sales_contacts')
    .insert(insertPayload)
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
    }),
  });

  return { data, error: null };
}

export async function updateAdminSalesContact(contactId: string, payload: SalesContactPayload) {
  const adminUser = await requireAdminAuth(SALES_CONTACT_MUTATION_ROLES);
  const supabase = createServiceRoleClient();
  const { data: before } = await supabase
    .from('sales_contacts')
    .select(ADMIN_SALES_CONTACT_SELECT)
    .eq('id', contactId)
    .maybeSingle<AdminSalesContact>();
  const updatePayload: Updates<'sales_contacts'> = normalizeSalesContactPayload(payload);

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
    }),
  });

  return { data, error: null };
}

export async function deleteAdminSalesContact(contactId: string) {
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
    }),
  });

  return { data: contact, error: null };
}

export async function setAdminSalesContactActive(contactId: string, isActive: boolean) {
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
    .select('id, name, phone, is_active')
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
        is_active: data.is_active,
      },
    }),
  });

  return { data, error: null };
}
