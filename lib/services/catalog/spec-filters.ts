import { cache } from 'react';

import { createClient } from '@/lib/supabase/server';

export interface FilterableField {
  key: string;
  label: string;
  type: 'select' | 'multi_select' | 'boolean' | 'number';
  unit: string | null;
  options: string[] | null;
  templateCode: string;
}

export interface FilterDef {
  key: string;
  label: string;
  type: 'select' | 'multi_select' | 'boolean' | 'number';
  unit?: string;
  values: string[]; // Unique values present in the products for select, multi_select, boolean
  range?: { min: number; max: number }; // Min/max range present in the products for number
}

/**
 * Queries active, filterable fields from active templates.
 * Memoized per request (React cache) so repeated catalog calls in one render share one query.
 */
export const getActiveFilterableFields = cache(async (): Promise<FilterableField[]> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('product_spec_fields')
      .select(`
        key,
        label,
        type,
        unit,
        options,
        product_spec_templates!inner (
          code,
          is_active
        )
      `)
      .eq('is_active', true)
      .eq('is_filterable', true)
      .eq('product_spec_templates.is_active', true);

    if (error) {
      console.error('Error fetching active filterable fields:', error);
      return [];
    }

    return (data ?? []).map((row: any) => ({
      key: row.key,
      label: row.label,
      type: row.type as FilterableField['type'],
      unit: row.unit,
      options: Array.isArray(row.options) ? (row.options as string[]) : null,
      templateCode: row.product_spec_templates.code,
    }));
  } catch (err) {
    console.error('Failed to get active filterable fields:', err);
    return [];
  }
});

/**
 * Filters products based on specs in memory on the server side.
 * Supports AND logic between different fields, and OR logic within one field.
 */
export function filterProductsBySpecs(
  products: any[],
  filters: Record<string, string[]>,
  filterableFields: FilterableField[]
): any[] {
  const filterKeys = Object.keys(filters).filter((k) => filters[k] && filters[k].length > 0);
  if (filterKeys.length === 0) return products;

  // Build a map of active filterable fields for fast lookup
  const fieldsMap = new Map<string, FilterableField>();
  filterableFields.forEach((f) => {
    fieldsMap.set(f.key, f);
  });

  return products.filter((product) => {
    const specs = product.specs && typeof product.specs === 'object' ? product.specs : {};
    const templateCode = specs._template;

    // For each active filter, check if the product matches
    for (const key of filterKeys) {
      const fieldDef = fieldsMap.get(key);
      if (!fieldDef) {
        // If it's not a standardized specs filter (e.g. search query or category), skip spec filtering for this key
        continue;
      }

      // If product does not match the active template for this filterable field, it fails the filter
      if (!templateCode || templateCode !== fieldDef.templateCode) {
        return false;
      }

      const productVal = specs[key];
      const selectedValues = filters[key];

      if (productVal === undefined || productVal === null) {
        return false;
      }

      let matches = false;

      switch (fieldDef.type) {
        case 'select': {
          matches = selectedValues.includes(String(productVal));
          break;
        }
        case 'multi_select': {
          const parts = String(productVal)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          matches = selectedValues.some((v) => parts.includes(v));
          break;
        }
        case 'boolean': {
          const isTrue = productVal === true || productVal === 'true' || productVal === 1 || productVal === '1';
          const hasYes = selectedValues.some((v) => {
            const lower = v.toLowerCase();
            return lower === 'yes' || v === 'Có' || lower === 'true' || v === '1';
          });
          const hasNo = selectedValues.some((v) => {
            const lower = v.toLowerCase();
            return lower === 'no' || v === 'Không' || lower === 'false' || v === '0';
          });
          if (hasYes && isTrue) matches = true;
          if (hasNo && !isTrue) matches = true;
          break;
        }
        case 'number': {
          const numVal = Number(productVal);
          if (!isNaN(numVal)) {
            for (const rangeStr of selectedValues) {
              const [minStr, maxStr] = rangeStr.split('-');
              const min = minStr ? Number(minStr) : -Infinity;
              const max = maxStr ? Number(maxStr) : Infinity;
              if (numVal >= min && numVal <= max) {
                matches = true;
                break;
              }
            }
          }
          break;
        }
        default:
          break;
      }

      if (!matches) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Builds the filter configurations dynamically from a list of products in the category.
 * Only active filterable fields present in the templates of the products are generated.
 * "Hide filters with no available values" - we only include fields that actually have values in the product list.
 */
export function buildFilterConfig(
  allCategoryProducts: any[],
  filterableFields: FilterableField[]
): FilterDef[] {
  const configMap = new Map<string, FilterDef>();

  // Determine active templates present in the category products
  const presentTemplates = new Set<string>();
  allCategoryProducts.forEach((p) => {
    if (p.specs && typeof p.specs === 'object' && p.specs._template) {
      presentTemplates.add(p.specs._template);
    }
  });

  // Filter fields to those whose templates are present
  const activeFields = filterableFields.filter((f) => presentTemplates.has(f.templateCode));

  activeFields.forEach((field) => {
    const valuesSet = new Set<string>();
    let minNum = Infinity;
    let maxNum = -Infinity;
    let hasNumbers = false;

    allCategoryProducts.forEach((p) => {
      const specs = p.specs && typeof p.specs === 'object' ? p.specs : {};
      if (specs._template !== field.templateCode) return;

      const val = specs[field.key];
      if (val === undefined || val === null || String(val).trim() === '') return;

      if (field.type === 'select') {
        valuesSet.add(String(val).trim());
      } else if (field.type === 'multi_select') {
        String(val)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((v) => valuesSet.add(v));
      } else if (field.type === 'boolean') {
        const isTrue = val === true || val === 'true' || val === 1 || val === '1';
        valuesSet.add(isTrue ? 'Có' : 'Không');
      } else if (field.type === 'number') {
        const num = Number(val);
        if (!isNaN(num)) {
          if (num < minNum) minNum = num;
          if (num > maxNum) maxNum = num;
          hasNumbers = true;
        }
      }
    });

    if (field.type === 'number') {
      if (hasNumbers) {
        configMap.set(field.key, {
          key: field.key,
          label: field.label,
          type: 'number',
          unit: field.unit || undefined,
          values: [],
          range: { min: minNum, max: maxNum },
        });
      }
    } else {
      if (valuesSet.size > 0) {
        // Sort values for consistent UX
        const values = Array.from(valuesSet).sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));
        configMap.set(field.key, {
          key: field.key,
          label: field.label,
          type: field.type,
          unit: field.unit || undefined,
          values,
        });
      }
    }
  });

  return Array.from(configMap.values());
}
