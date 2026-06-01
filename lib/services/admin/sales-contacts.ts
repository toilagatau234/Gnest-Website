import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Inserts, Tables, Updates } from '@/lib/types/database';

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

function normalizePhone(phone: string) {
  return phone.trim().replace(/\s+/g, ' ');
}

function normalizeNullableText(value: string | null) {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
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

  return {
    name: payload.name.trim(),
    role: normalizeNullableText(payload.role),
    phone,
    zalo: normalizeZalo(payload.zalo, phone),
    avatar_url: normalizeNullableText(payload.avatar_url),
    sort_order: payload.sort_order,
    is_active: payload.is_active,
  };
}

export async function getAdminSalesContacts() {
  try {
    await requireAdminAuth();
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('sales_contacts')
      .select(ADMIN_SALES_CONTACT_SELECT)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể tải liên hệ bán hàng.';
    return { data: null, error: message };
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
    metadata: { name: data.name, phone: data.phone },
  });

  return { data, error: null };
}

export async function updateAdminSalesContact(contactId: string, payload: SalesContactPayload) {
  const adminUser = await requireAdminAuth(SALES_CONTACT_MUTATION_ROLES);
  const supabase = createServiceRoleClient();
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
    metadata: { name: data.name, phone: data.phone },
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
    metadata: { name: contact.name, phone: contact.phone },
  });

  return { data: contact, error: null };
}

export async function setAdminSalesContactActive(contactId: string, isActive: boolean) {
  const adminUser = await requireAdminAuth(SALES_CONTACT_MUTATION_ROLES);
  const supabase = createServiceRoleClient();

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
    metadata: { name: data.name, phone: data.phone },
  });

  return { data, error: null };
}
