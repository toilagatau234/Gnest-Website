import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { CategoryType, Inserts, Tables, Updates } from '@/lib/types/database';

import { buildAuditMetadata, type RequestContext } from '@/lib/services/admin/audit-metadata';
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
  has_filters: boolean;
  is_active: boolean;
}

export interface CategoryReorderScope {
  type: CategoryType;
  parent_id: string | null;
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

function normalizeCategoryPayload(payload: CategoryPayload): {
  name: string;
  slug: string;
  type: CategoryType;
  parent_id: string | null;
  has_filters: boolean;
  is_active: boolean;
} {
  const isService = payload.type === 'service';
  return {
    name: payload.name.trim(),
    slug: payload.slug.trim().toLowerCase(),
    type: payload.type,
    parent_id: isService ? null : (payload.parent_id || null),
    has_filters: isService ? false : payload.has_filters,
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

function isSameCategoryScope(a: CategoryReorderScope, b: CategoryReorderScope) {
  return a.type === b.type && a.parent_id === b.parent_id;
}

async function getCategoriesInScope(
  supabase: ReturnType<typeof createServiceRoleClient>,
  scope: CategoryReorderScope,
) {
  let query = supabase
    .from('categories')
    .select(ADMIN_CATEGORY_SELECT)
    .eq('type', scope.type);

  query = scope.parent_id ? query.eq('parent_id', scope.parent_id) : query.is('parent_id', null);

  const { data, error } = await query
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })
    .returns<AdminCategory[]>();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data ?? [], error: null };
}

async function shiftCategoryScopeForNewestFirst(
  supabase: ReturnType<typeof createServiceRoleClient>,
  scope: CategoryReorderScope,
) {
  const scopeResult = await getCategoriesInScope(supabase, scope);

  if (scopeResult.error || !scopeResult.data) {
    return scopeResult.error ?? 'Không thể chuẩn bị thứ tự danh mục.';
  }

  const reversed = [...scopeResult.data].sort((left, right) => (right.sort_order ?? 0) - (left.sort_order ?? 0));

  for (const category of reversed) {
    const { error } = await supabase
      .from('categories')
      .update({ sort_order: (category.sort_order ?? 0) + 1 })
      .eq('id', category.id);

    if (error) {
      return error.message;
    }
  }

  return null;
}

async function validateCategoryReorderScope(
  supabase: ReturnType<typeof createServiceRoleClient>,
  scope: CategoryReorderScope,
  orderedIds: string[],
) {
  const uniqueIds = new Set(orderedIds);

  if (uniqueIds.size !== orderedIds.length) {
    return 'Danh sách sắp xếp có ID bị lặp.';
  }

  const scopeResult = await getCategoriesInScope(supabase, scope);

  if (scopeResult.error || !scopeResult.data) {
    return scopeResult.error ?? 'Không thể kiểm tra phạm vi sắp xếp.';
  }

  const scopeIds = scopeResult.data.map((item) => item.id);

  if (scopeIds.length !== orderedIds.length) {
    return 'Danh sách sắp xếp không khớp với phạm vi danh mục hiện tại.';
  }

  for (const id of orderedIds) {
    if (!scopeIds.includes(id)) {
      return 'Danh sách sắp xếp chứa danh mục ngoài phạm vi cho phép.';
    }
  }

  return null;
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

export async function createAdminCategory(payload: CategoryPayload, requestContext?: RequestContext) {
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

  const shiftError = await shiftCategoryScopeForNewestFirst(supabase, {
    type: insertPayload.type,
    parent_id: insertPayload.parent_id ?? null,
  });
  if (shiftError) {
    return { data: null, error: shiftError };
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({ ...insertPayload, sort_order: 0 })
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
      requestContext,
    }),
  });

  return { data, error: null };
}

export async function updateAdminCategory(categoryId: string, payload: CategoryPayload, requestContext?: RequestContext) {
  const adminUser = await requireAdminAuth(CATEGORY_MUTATION_ROLES);
  const supabase = createServiceRoleClient();
  const { data: before } = await supabase
    .from('categories')
    .select(ADMIN_CATEGORY_SELECT)
    .eq('id', categoryId)
    .maybeSingle<CategoryAuditRow>();

  if (!before) {
    return { data: null, error: 'Không tìm thấy danh mục cần cập nhật.' };
  }

  const normalizedPayload = normalizeCategoryPayload(payload);
  const oldScope: CategoryReorderScope = {
    type: before.type,
    parent_id: before.parent_id ?? null,
  };
  const newScope: CategoryReorderScope = {
    type: normalizedPayload.type,
    parent_id: normalizedPayload.parent_id ?? null,
  };
  const isSameScope = isSameCategoryScope(oldScope, newScope);

  if (!isSameScope) {
    const shiftError = await shiftCategoryScopeForNewestFirst(supabase, newScope);
    if (shiftError) {
      return { data: null, error: shiftError };
    }
  }

  let updatePayload: Updates<'categories'> = {
    ...normalizedPayload,
    sort_order: isSameScope ? before.sort_order : 0,
  };

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
      before: toCategoryAuditSnapshot(before),
      after: toCategoryAuditSnapshot(data),
      extra: cascadedChildren > 0 ? { cascaded_children: cascadedChildren } : null,
      requestContext,
    }),
  });

  return { data, error: null };
}

export async function deleteAdminCategory(categoryId: string, requestContext?: RequestContext) {
  const adminUser = await requireAdminAuth(CATEGORY_MUTATION_ROLES);
  const supabase = createServiceRoleClient();

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
      requestContext,
    }),
  });

  return { data: category, error: null };
}

export async function setAdminCategoryActive(categoryId: string, isActive: boolean, requestContext?: RequestContext) {
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
    .select('id, name, slug, sort_order, is_active')
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
        sort_order: data.sort_order,
        is_active: data.is_active,
      },
      extra: cascadedChildren > 0 ? { cascaded_children: cascadedChildren } : null,
      requestContext,
    }),
  });

  return { data, error: null };
}

export async function reorderAdminCategories(
  scope: CategoryReorderScope,
  orderedIds: string[],
  requestContext?: RequestContext,
) {
  const adminUser = await requireAdminAuth(CATEGORY_MUTATION_ROLES);
  const supabase = createServiceRoleClient();

  const validationError = await validateCategoryReorderScope(supabase, scope, orderedIds);
  if (validationError) {
    return { data: null, error: validationError };
  }

  for (let index = 0; index < orderedIds.length; index += 1) {
    let query = supabase
      .from('categories')
      .update({ sort_order: index })
      .eq('id', orderedIds[index])
      .eq('type', scope.type);

    query = scope.parent_id ? query.eq('parent_id', scope.parent_id) : query.is('parent_id', null);

    const { error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: 'reorder',
    entity: 'categories',
    entity_id: orderedIds[0] ?? adminUser.id,
    metadata: buildAuditMetadata({
      label: 'categories',
      extra: {
        scope,
        ordered_ids: orderedIds,
      },
      requestContext,
    }),
  });

  return { data: orderedIds, error: null };
}
