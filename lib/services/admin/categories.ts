import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { CategoryType, Inserts, Tables, Updates } from '@/lib/types/database';

import { buildAuditMetadata } from '@/lib/services/admin/audit-metadata';
import { requireAdminAuth } from '@/lib/services/admin/auth';
import { sortCategoriesDeterministically } from '@/lib/services/category-visibility';

export type AdminCategory = Pick<
  Tables<'categories'>,
  'id' | 'name' | 'slug' | 'type' | 'parent_id' | 'sort_order' | 'has_filters' | 'is_active'
>;

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
const ADMIN_CATEGORY_SELECT =
  'id, name, slug, type, parent_id, sort_order, has_filters, is_active';
const SHOULD_LOG_ADMIN_TIMINGS =
  process.env.NODE_ENV === 'development' && process.env.ADMIN_TIMING_LOGS === '1';

type CategoryAuditRow = Pick<
  Tables<'categories'>,
  'id' | 'name' | 'slug' | 'type' | 'parent_id' | 'sort_order' | 'has_filters' | 'is_active'
>;

function now() {
  return performance.now();
}

function logTiming(label: string, durationMs: number) {
  if (!SHOULD_LOG_ADMIN_TIMINGS) {
    return;
  }

  console.info(`[admin:categories] ${label} ${durationMs.toFixed(1)}ms`);
}

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

function toCategoryAuditSnapshot(category: CategoryAuditRow) {
  return {
    name: category.name,
    slug: category.slug,
    type: category.type,
    parent_id: category.parent_id,
    sort_order: category.sort_order,
    has_filters: category.has_filters,
    is_active: category.is_active,
  };
}

async function cascadeCategoryVisibility(
  supabase: ReturnType<typeof createServiceRoleClient>,
  categoryId: string,
  isActive: boolean,
) {
  const { data: categories, error } = await supabase
    .from('categories')
    .select(ADMIN_CATEGORY_SELECT)
    .returns<AdminCategory[]>();

  if (error || !categories) {
    return { updatedIds: [] as string[], error: error?.message ?? null };
  }

  const childrenByParentId = new Map<string, string[]>();

  for (const category of categories) {
    if (!category.parent_id) {
      continue;
    }

    const current = childrenByParentId.get(category.parent_id) ?? [];
    current.push(category.id);
    childrenByParentId.set(category.parent_id, current);
  }

  const pending = [...(childrenByParentId.get(categoryId) ?? [])];
  const descendantIds: string[] = [];

  while (pending.length > 0) {
    const currentId = pending.shift();

    if (!currentId || descendantIds.includes(currentId)) {
      continue;
    }

    descendantIds.push(currentId);
    pending.push(...(childrenByParentId.get(currentId) ?? []));
  }

  if (descendantIds.length === 0) {
    return { updatedIds: [] as string[], error: null };
  }

  const { error: updateError } = await supabase
    .from('categories')
    .update({ is_active: isActive })
    .in('id', descendantIds);

  return { updatedIds: updateError ? [] : descendantIds, error: updateError?.message ?? null };
}

export async function getAdminCategories() {
  const totalStart = now();

  try {
    const authStart = now();
    await requireAdminAuth();
    logTiming('requireAdminAuth', now() - authStart);

    const supabase = createServiceRoleClient();

    const queryStart = now();
    const { data, error } = await supabase
      .from('categories')
      .select(ADMIN_CATEGORY_SELECT)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    logTiming('supabaseQuery', now() - queryStart);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: sortCategoriesDeterministically(data || []), error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể tải danh mục';
    return { data: null, error: message };
  } finally {
    logTiming('total', now() - totalStart);
  }
}

export async function createAdminCategory(payload: CategoryPayload) {
  const adminUser = await requireAdminAuth(CATEGORY_MUTATION_ROLES);
  const supabase = createServiceRoleClient();
  let insertPayload = normalizeCategoryPayload(payload);

  if (insertPayload.parent_id) {
    const { data: parentCategory } = await supabase
      .from('categories')
      .select(ADMIN_CATEGORY_SELECT)
      .eq('id', insertPayload.parent_id)
      .maybeSingle<AdminCategory>();

    if (parentCategory && !parentCategory.is_active) {
      insertPayload = { ...insertPayload, is_active: false };
    }
  }

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
    metadata: buildAuditMetadata({
      label: data.name,
      after: toCategoryAuditSnapshot(data),
    }),
  });

  return { data, error: null };
}

export async function updateAdminCategory(categoryId: string, payload: CategoryPayload) {
  const adminUser = await requireAdminAuth(CATEGORY_MUTATION_ROLES);
  const supabase = createServiceRoleClient();
  const { data: before } = await supabase
    .from('categories')
    .select(ADMIN_CATEGORY_SELECT)
    .eq('id', categoryId)
    .maybeSingle<CategoryAuditRow>();

  let updatePayload: Updates<'categories'> = normalizeCategoryPayload(payload);

  if (updatePayload.parent_id) {
    const { data: parentCategory } = await supabase
      .from('categories')
      .select(ADMIN_CATEGORY_SELECT)
      .eq('id', updatePayload.parent_id)
      .maybeSingle<AdminCategory>();

    if (parentCategory && !parentCategory.is_active) {
      updatePayload = { ...updatePayload, is_active: false };
    }
  }

  const { data, error } = await supabase
    .from('categories')
    .update(updatePayload)
    .eq('id', categoryId)
    .select('*')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  let cascadedChildren = 0;
  if (!data.is_active) {
    const cascadeResult = await cascadeCategoryVisibility(supabase, data.id, false);
    if (cascadeResult.error) {
      return { data: null, error: cascadeResult.error };
    }
    cascadedChildren = cascadeResult.updatedIds.length;
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: 'update',
    entity: 'categories',
    entity_id: data.id,
    metadata: buildAuditMetadata({
      label: data.name,
      before: before ? toCategoryAuditSnapshot(before) : null,
      after: toCategoryAuditSnapshot(data),
      extra: cascadedChildren > 0 ? { cascaded_children: cascadedChildren } : null,
    }),
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
    metadata: buildAuditMetadata({
      label: category.name,
      before: {
        name: category.name,
        slug: category.slug,
      },
    }),
  });

  return { data: category, error: null };
}

export async function setAdminCategoryActive(categoryId: string, isActive: boolean) {
  const adminUser = await requireAdminAuth(CATEGORY_MUTATION_ROLES);
  const supabase = createServiceRoleClient();
  const { data: before } = await supabase
    .from('categories')
    .select(ADMIN_CATEGORY_SELECT)
    .eq('id', categoryId)
    .maybeSingle<CategoryAuditRow>();

  const { data, error } = await supabase
    .from('categories')
    .update({ is_active: isActive })
    .eq('id', categoryId)
    .select('id, name, slug, is_active')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  let cascadedChildren = 0;
  if (!isActive) {
    const cascadeResult = await cascadeCategoryVisibility(supabase, data.id, false);
    if (cascadeResult.error) {
      return { data: null, error: cascadeResult.error };
    }
    cascadedChildren = cascadeResult.updatedIds.length;
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: isActive ? 'activate' : 'deactivate',
    entity: 'categories',
    entity_id: data.id,
    metadata: buildAuditMetadata({
      label: data.name,
      before: before ? toCategoryAuditSnapshot(before) : null,
      after: {
        ...(before ? toCategoryAuditSnapshot(before) : {}),
        is_active: data.is_active,
      },
      extra: cascadedChildren > 0 ? { cascaded_children: cascadedChildren } : null,
    }),
  });

  return { data, error: null };
}
