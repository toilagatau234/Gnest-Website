type CategoryVisibilityRecord = {
  id: string;
  slug: string;
  parent_id: string | null;
  is_active: boolean;
  sort_order: number | null;
  name: string;
};

export interface CategoryPriorityWarning {
  parentId: string | null;
  sortOrder: number;
  categories: Array<Pick<CategoryVisibilityRecord, 'id' | 'name' | 'slug'>>;
}

export function sortCategoriesDeterministically<T extends CategoryVisibilityRecord>(categories: T[]): T[] {
  return [...categories].sort((left, right) => {
    const leftOrder = left.sort_order ?? 0;
    const rightOrder = right.sort_order ?? 0;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    const byName = left.name.localeCompare(right.name, 'vi');
    if (byName !== 0) {
      return byName;
    }

    return left.slug.localeCompare(right.slug, 'en');
  });
}

export function getVisibleCategoryIds<T extends CategoryVisibilityRecord>(categories: T[]): Set<string> {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const cache = new Map<string, boolean>();

  const isVisible = (category: T): boolean => {
    const cached = cache.get(category.id);
    if (cached !== undefined) {
      return cached;
    }

    if (!category.is_active) {
      cache.set(category.id, false);
      return false;
    }

    if (!category.parent_id) {
      cache.set(category.id, true);
      return true;
    }

    const parent = byId.get(category.parent_id);
    if (!parent) {
      cache.set(category.id, false);
      return false;
    }

    const visible = isVisible(parent as T);
    cache.set(category.id, visible);
    return visible;
  };

  const visibleIds = new Set<string>();

  for (const category of categories) {
    if (isVisible(category)) {
      visibleIds.add(category.id);
    }
  }

  return visibleIds;
}

export function filterVisibleCategories<T extends CategoryVisibilityRecord>(categories: T[]): T[] {
  const visibleIds = getVisibleCategoryIds(categories);
  return sortCategoriesDeterministically(
    categories.filter((category) => visibleIds.has(category.id)),
  );
}

export function getCategoryPriorityWarnings<T extends CategoryVisibilityRecord>(
  categories: T[],
): CategoryPriorityWarning[] {
  const grouped = new Map<string, T[]>();

  for (const category of categories) {
    const key = `${category.parent_id ?? 'root'}:${category.sort_order ?? 0}`;
    const current = grouped.get(key) ?? [];
    current.push(category);
    grouped.set(key, current);
  }

  return Array.from(grouped.values())
    .filter((group) => group.length > 1)
    .map((group) => ({
      parentId: group[0]?.parent_id ?? null,
      sortOrder: group[0]?.sort_order ?? 0,
      categories: sortCategoriesDeterministically(group).map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
      })),
    }))
    .sort((left, right) => left.sortOrder - right.sortOrder);
}
