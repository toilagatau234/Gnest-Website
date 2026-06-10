import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  SPEC_TEMPLATES,
  TEMPLATE_KEYS,
  type SpecField,
  type SpecTemplate,
  type TemplateRegistry,
} from '@/lib/product-spec-templates';
import { requireAdminAuth } from '@/lib/services/admin/auth';
import { SYSTEM_CONFIG_ROLES, ANY_ADMIN_ROLE } from '@/lib/services/admin/permissions';
import { buildAuditMetadata, type RequestContext } from '@/lib/services/admin/audit-metadata';

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
 * The returned registry is passed directly to validateSpecs() in server actions,
 * so server-side validation always mirrors what the product form shows.
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
      .eq('is_active', true)
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

/**
 * Loads all spec templates and fields (both active and inactive) for the admin dashboard.
 */
export async function getAdminSpecTemplates() {
  await requireAdminAuth(ANY_ADMIN_ROLE);
  const supabase = createServiceRoleClient();

  const { data: templates, error: tErr } = await supabase
    .from('product_spec_templates')
    .select('*')
    .order('sort_order', { ascending: true });

  if (tErr) throw new Error(tErr.message);

  const { data: fields, error: fErr } = await supabase
    .from('product_spec_fields')
    .select('*')
    .order('sort_order', { ascending: true });

  if (fErr) throw new Error(fErr.message);

  return {
    templates: templates || [],
    fields: fields || [],
  };
}

// ── Template mutations ───────────────────────────────────────────────────────

export async function createAdminSpecTemplate(
  payload: {
    code: string;
    name: string;
    description: string | null;
    is_active: boolean;
    sort_order: number;
  },
  requestContext?: RequestContext,
) {
  const adminUser = await requireAdminAuth(SYSTEM_CONFIG_ROLES);
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('product_spec_templates')
    .insert({
      code: payload.code.trim().toLowerCase(),
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
      is_active: payload.is_active,
      sort_order: payload.sort_order,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { data: null, error: 'Mã mẫu thông số kỹ thuật đã tồn tại.' };
    }
    return { data: null, error: error.message };
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: 'create',
    entity: 'product_spec_templates',
    entity_id: data.id,
    metadata: buildAuditMetadata({
      label: data.name,
      after: data,
      requestContext,
    }),
  });

  return { data, error: null };
}

export async function updateAdminSpecTemplate(
  id: string,
  payload: {
    code: string;
    name: string;
    description: string | null;
    is_active: boolean;
    sort_order: number;
  },
  requestContext?: RequestContext,
) {
  const adminUser = await requireAdminAuth(SYSTEM_CONFIG_ROLES);
  const supabase = createServiceRoleClient();

  const { data: before } = await supabase
    .from('product_spec_templates')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  const { data, error } = await supabase
    .from('product_spec_templates')
    .update({
      code: payload.code.trim().toLowerCase(),
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
      is_active: payload.is_active,
      sort_order: payload.sort_order,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { data: null, error: 'Mã mẫu thông số kỹ thuật đã tồn tại.' };
    }
    return { data: null, error: error.message };
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: 'update',
    entity: 'product_spec_templates',
    entity_id: data.id,
    metadata: buildAuditMetadata({
      label: data.name,
      before: before || null,
      after: data,
      requestContext,
    }),
  });

  return { data, error: null };
}

export async function setAdminSpecTemplateActive(
  id: string,
  isActive: boolean,
  requestContext?: RequestContext,
) {
  const adminUser = await requireAdminAuth(SYSTEM_CONFIG_ROLES);
  const supabase = createServiceRoleClient();

  const { data: before } = await supabase
    .from('product_spec_templates')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  const { data, error } = await supabase
    .from('product_spec_templates')
    .update({ is_active: isActive })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: isActive ? 'activate' : 'deactivate',
    entity: 'product_spec_templates',
    entity_id: data.id,
    metadata: buildAuditMetadata({
      label: data.name,
      before: before || null,
      after: data,
      requestContext,
    }),
  });

  return { data, error: null };
}

// ── Field mutations ──────────────────────────────────────────────────────────

export async function isFieldInUse(templateCode: string, fieldKey: string): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { count, error } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('specs->>_template', templateCode)
    .not(`specs->>${fieldKey}`, 'is', null);

  if (error) {
    console.error('Lỗi khi kiểm tra trường thông số đang sử dụng:', error);
    return false;
  }
  return (count ?? 0) > 0;
}

export async function createAdminSpecField(
  payload: {
    template_id: string;
    key: string;
    label: string;
    type: string;
    unit: string | null;
    options: string[] | null;
    is_required: boolean;
    is_filterable: boolean;
    is_active: boolean;
    sort_order: number;
  },
  requestContext?: RequestContext,
) {
  const adminUser = await requireAdminAuth(SYSTEM_CONFIG_ROLES);
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('product_spec_fields')
    .insert({
      template_id: payload.template_id,
      key: payload.key.trim().toLowerCase(),
      label: payload.label.trim(),
      type: payload.type,
      unit: payload.unit?.trim() || null,
      options: payload.options || null,
      is_required: payload.is_required,
      is_filterable: payload.is_filterable,
      is_active: payload.is_active,
      sort_order: payload.sort_order,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { data: null, error: 'Mã thuộc tính đã tồn tại trong mẫu này.' };
    }
    return { data: null, error: error.message };
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: 'create',
    entity: 'product_spec_fields',
    entity_id: data.id,
    metadata: buildAuditMetadata({
      label: `${data.label} (${data.key})`,
      after: data,
      requestContext,
    }),
  });

  return { data, error: null };
}

export async function updateAdminSpecField(
  id: string,
  payload: {
    key: string;
    label: string;
    type: string;
    unit: string | null;
    options: string[] | null;
    is_required: boolean;
    is_filterable: boolean;
    is_active: boolean;
    sort_order: number;
  },
  requestContext?: RequestContext,
) {
  const adminUser = await requireAdminAuth(SYSTEM_CONFIG_ROLES);
  const supabase = createServiceRoleClient();

  const { data: before } = await supabase
    .from('product_spec_fields')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  const { data, error } = await supabase
    .from('product_spec_fields')
    .update({
      key: payload.key.trim().toLowerCase(),
      label: payload.label.trim(),
      type: payload.type,
      unit: payload.unit?.trim() || null,
      options: payload.options || null,
      is_required: payload.is_required,
      is_filterable: payload.is_filterable,
      is_active: payload.is_active,
      sort_order: payload.sort_order,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { data: null, error: 'Mã thuộc tính đã tồn tại trong mẫu này.' };
    }
    return { data: null, error: error.message };
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: 'update',
    entity: 'product_spec_fields',
    entity_id: data.id,
    metadata: buildAuditMetadata({
      label: `${data.label} (${data.key})`,
      before: before || null,
      after: data,
      requestContext,
    }),
  });

  return { data, error: null };
}

export async function setAdminSpecFieldActive(
  id: string,
  isActive: boolean,
  requestContext?: RequestContext,
) {
  const adminUser = await requireAdminAuth(SYSTEM_CONFIG_ROLES);
  const supabase = createServiceRoleClient();

  const { data: before } = await supabase
    .from('product_spec_fields')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  const { data, error } = await supabase
    .from('product_spec_fields')
    .update({ is_active: isActive })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: isActive ? 'activate' : 'deactivate',
    entity: 'product_spec_fields',
    entity_id: data.id,
    metadata: buildAuditMetadata({
      label: `${data.label} (${data.key})`,
      before: before || null,
      after: data,
      requestContext,
    }),
  });

  return { data, error: null };
}

export async function deleteAdminSpecField(
  id: string,
  requestContext?: RequestContext,
) {
  const adminUser = await requireAdminAuth(SYSTEM_CONFIG_ROLES);
  const supabase = createServiceRoleClient();

  const { data: field, error: fErr } = await supabase
    .from('product_spec_fields')
    .select('*, product_spec_templates(code)')
    .eq('id', id)
    .maybeSingle();

  if (fErr || !field) {
    return { data: null, error: 'Không tìm thấy trường thông số cần xóa.' };
  }

  const f = field as any;
  const templateCode = f.product_spec_templates?.code;
  const fieldKey = f.key;

  // Check if field is in use
  const inUse = templateCode ? await isFieldInUse(templateCode, fieldKey) : false;

  if (inUse) {
    // Soft-disable instead
    const { data: softData, error: uErr } = await supabase
      .from('product_spec_fields')
      .update({ is_active: false })
      .eq('id', id)
      .select('*')
      .single();

    if (uErr) {
      return { data: null, error: uErr.message };
    }

    await supabase.from('audit_logs').insert({
      actor_id: adminUser.id,
      action: 'deactivate',
      entity: 'product_spec_fields',
      entity_id: id,
      metadata: buildAuditMetadata({
        label: `${f.label} (${f.key}) - Soft Disabled (In Use)`,
        before: f,
        after: softData,
        requestContext,
      }),
    });

    return { data: softData, error: null, softDisabled: true };
  }

  const { error: dErr } = await supabase
    .from('product_spec_fields')
    .delete()
    .eq('id', id);

  if (dErr) {
    return { data: null, error: dErr.message };
  }

  await supabase.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: 'delete',
    entity: 'product_spec_fields',
    entity_id: id,
    metadata: buildAuditMetadata({
      label: `${f.label} (${f.key})`,
      before: f,
      requestContext,
    }),
  });

  return { data: f, error: null, deleted: true };
}

