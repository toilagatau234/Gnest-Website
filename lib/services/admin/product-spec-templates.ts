import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  SPEC_TEMPLATES,
  TEMPLATE_KEYS,
  type SpecField,
  type SpecTemplate,
  type TemplateRegistry,
} from '@/lib/product-spec-templates';

function codeFallback(): TemplateRegistry {
  return {
    templates: SPEC_TEMPLATES as Record<string, SpecTemplate>,
    keys: [...TEMPLATE_KEYS],
  };
}

/**
 * Loads active spec templates and their fields from the DB.
 * Falls back to the code-based templates in lib/product-spec-templates.ts
 * if the query fails or returns no rows, so the product form always works.
 *
 * Validation note: server-action validateSpecs() still uses the code-based
 * templates. If a template is deactivated in DB but remains in code, it will
 * still be accepted server-side. This is an acceptable temporary mismatch
 * while the DB template builder (Phase C.4) is not yet implemented.
 */
export async function getActiveSpecTemplates(): Promise<TemplateRegistry> {
  try {
    const supabase = createServiceRoleClient();

    const { data: templateRows, error: tErr } = await supabase
      .from('product_spec_templates')
      .select('id, code, name')
      .eq('is_active', true)
      .order('sort_order');

    if (tErr || !templateRows?.length) return codeFallback();

    const { data: fieldRows, error: fErr } = await supabase
      .from('product_spec_fields')
      .select('template_id, key, label, type, unit, options, is_required, sort_order')
      .in(
        'template_id',
        templateRows.map((t) => t.id),
      )
      .order('sort_order');

    if (fErr) return codeFallback();

    const templates: Record<string, SpecTemplate> = {};
    const keys: string[] = [];

    for (const t of templateRows) {
      keys.push(t.code);
      templates[t.code] = {
        label: t.name,
        fields: (fieldRows ?? [])
          .filter((f) => f.template_id === t.id)
          .map((f) => ({
            key: f.key,
            label: f.label,
            type: f.type as SpecField['type'],
            unit: f.unit ?? undefined,
            options: Array.isArray(f.options) ? (f.options as string[]) : undefined,
            required: f.is_required ?? false,
            sortOrder: f.sort_order,
          })),
      };
    }

    return keys.length > 0 ? { templates, keys } : codeFallback();
  } catch {
    return codeFallback();
  }
}
