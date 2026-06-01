import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { CategoryType, Inserts, Tables, Updates } from '@/lib/types/database';

import { requireAdminAuth } from '@/lib/services/admin/auth';

export type AdminCategory = Tables<'categories'>;

export interface CategoryPayload {
  name: string;
  slug: string;
  type: CategoryType;
  parent_id: string | null;
  sort_order: number;
  has_filters: boolean;
  is_active: boolean;
}

const CATEGORY_MUTATION_ROLES = ['super_admin', 'admin', 'editor'] as const;

function normalizeCategoryPayload(payload: CategoryPayload): Inserts<'categories'> {
  return {
    name: payload.name.trim(),
    slug: payload.slug.trim().toLowerCase(),
    type: payload.type,
    parent_id: payload.parent_id || null,
    sort_order: payload.sort_order,
    has_filters: payload.has_filters,
    is_active: payload.is_active,
  };
}

export async function getAdminCategories() {
  try {
    await requireAdminAuth();
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể tải danh mục';
    return { data: null, error: message };
  }
}

export async function createAdminCategory(payload: CategoryPayload) {
  const adminUser = await requireAdminAuth(CATEGORY_MUTATION_ROLES);
  const supabase = createServiceRoleClient();
  const insertPayload = normalizeCategoryPayload(payload);

  const { data, error } = await supabase
    .from('categories')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: 'create',
    entity: 'categories',
    entity_id: data.id,
    metadata: { name: data.name, slug: data.slug },
  });

  return { data, error: null };
}

export async function updateAdminCategory(categoryId: string, payload: CategoryPayload) {
  const adminUser = await requireAdminAuth(CATEGORY_MUTATION_ROLES);
  const supabase = createServiceRoleClient();
  const updatePayload: Updates<'categories'> = normalizeCategoryPayload(payload);

  const { data, error } = await supabase
    .from('categories')
    .update(updatePayload)
    .eq('id', categoryId)
    .select('*')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: 'update',
    entity: 'categories',
    entity_id: data.id,
    metadata: { name: data.name, slug: data.slug },
  });

  return { data, error: null };
}

export async function deleteAdminCategory(categoryId: string) {
  const adminUser = await requireAdminAuth(CATEGORY_MUTATION_ROLES);
  const supabase = createServiceRoleClient();

  // Read first so we can write a meaningful audit log and guard against
  // deleting a category that still has children or products attached.
  const { data: category } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('id', categoryId)
    .maybeSingle();

  if (!category) {
    return { data: null, error: 'Không tìm thấy danh mục cần xóa.' };
  }

  const { error } = await supabase.from('categories').delete().eq('id', categoryId);

  if (error) {
    // 23503 = foreign_key_violation (children categories or products reference it).
    if (error.code === '23503') {
      return {
        data: null,
        error: 'Không thể xóa vì đang có sản phẩm hoặc danh mục con liên quan. Hãy ẩn danh mục thay vì xóa.',
      };
    }
    return { data: null, error: error.message };
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: 'delete',
    entity: 'categories',
    entity_id: category.id,
    metadata: { name: category.name, slug: category.slug },
  });

  return { data: category, error: null };
}

export async function setAdminCategoryActive(categoryId: string, isActive: boolean) {
  const adminUser = await requireAdminAuth(CATEGORY_MUTATION_ROLES);
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('categories')
    .update({ is_active: isActive })
    .eq('id', categoryId)
    .select('id, name, slug, is_active')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: isActive ? 'activate' : 'deactivate',
    entity: 'categories',
    entity_id: data.id,
    metadata: { name: data.name, slug: data.slug },
  });

  return { data, error: null };
}
