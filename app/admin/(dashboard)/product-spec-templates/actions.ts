'use server';

import { revalidatePath } from 'next/cache';
import { getRequestContext } from '@/lib/services/admin/audit-metadata';
import { requireAdminAuth } from '@/lib/services/admin/auth';
import { SYSTEM_CONFIG_ROLES } from '@/lib/services/admin/permissions';
import {
  createAdminSpecTemplate,
  updateAdminSpecTemplate,
  setAdminSpecTemplateActive,
  createAdminSpecField,
  updateAdminSpecField,
  setAdminSpecFieldActive,
  deleteAdminSpecField,
} from '@/lib/services/admin/product-spec-templates';

export type AdminFormState = { ok: boolean; error?: string; softDisabled?: boolean; deleted?: boolean };

const CODE_REGEX = /^[a-z][a-z0-9_]*$/;
const ALLOWED_FIELD_TYPES = ['text', 'number', 'select', 'multi_select', 'boolean', 'textarea'];

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function readBoolean(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === 'on' || value === 'true';
}

function readInt(formData: FormData, key: string, defaultValue = 0): number {
  const value = formData.get(key);
  if (value === null || value === undefined || String(value).trim() === '') {
    return defaultValue;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : defaultValue;
}

function revalidateSpecTemplates() {
  revalidatePath('/admin/product-spec-templates');
  revalidatePath('/admin/products');
  revalidatePath('/admin/dashboard');
  revalidatePath('/');
  revalidatePath('/danh-muc');
}

// ── Template Actions ─────────────────────────────────────────────────────────

export async function createTemplateAction(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdminAuth(SYSTEM_CONFIG_ROLES);

  try {
    const code = readString(formData, 'code');
    const name = readString(formData, 'name');
    const description = readString(formData, 'description') || null;
    const is_active = readBoolean(formData, 'is_active');
    const sort_order = readInt(formData, 'sort_order', 0);

    if (!code) return { ok: false, error: 'Mã mẫu thông số là bắt buộc.' };
    if (!CODE_REGEX.test(code)) {
      return { ok: false, error: 'Mã mẫu không hợp lệ. Chỉ chấp nhận chữ thường không dấu, số và dấu gạch dưới (bắt đầu bằng chữ).' };
    }
    if (!name) return { ok: false, error: 'Tên mẫu thông số là bắt buộc.' };
    if (sort_order < 0) return { ok: false, error: 'Thứ tự ưu tiên không được âm.' };

    const requestContext = await getRequestContext();
    const { error } = await createAdminSpecTemplate(
      { code, name, description, is_active, sort_order },
      requestContext,
    );

    if (error) {
      return { ok: false, error };
    }

    revalidateSpecTemplates();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Lỗi hệ thống khi tạo mẫu thông số.' };
  }
}

export async function updateTemplateAction(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdminAuth(SYSTEM_CONFIG_ROLES);

  try {
    const id = readString(formData, 'id');
    const code = readString(formData, 'code');
    const name = readString(formData, 'name');
    const description = readString(formData, 'description') || null;
    const is_active = readBoolean(formData, 'is_active');
    const sort_order = readInt(formData, 'sort_order', 0);

    if (!id) return { ok: false, error: 'Thiếu ID mẫu thông số.' };
    if (!code) return { ok: false, error: 'Mã mẫu thông số là bắt buộc.' };
    if (!CODE_REGEX.test(code)) {
      return { ok: false, error: 'Mã mẫu không hợp lệ. Chỉ chấp nhận chữ thường không dấu, số và dấu gạch dưới (bắt đầu bằng chữ).' };
    }
    if (!name) return { ok: false, error: 'Tên mẫu thông số là bắt buộc.' };
    if (sort_order < 0) return { ok: false, error: 'Thứ tự ưu tiên không được âm.' };

    const requestContext = await getRequestContext();
    const { error } = await updateAdminSpecTemplate(
      id,
      { code, name, description, is_active, sort_order },
      requestContext,
    );

    if (error) {
      return { ok: false, error };
    }

    revalidateSpecTemplates();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Lỗi hệ thống khi cập nhật mẫu thông số.' };
  }
}

export async function toggleTemplateActiveAction(formData: FormData): Promise<void> {
  await requireAdminAuth(SYSTEM_CONFIG_ROLES);

  const id = readString(formData, 'id');
  const isActive = readString(formData, 'next_is_active') === 'true';

  if (!id) {
    throw new Error('Thiếu ID mẫu thông số.');
  }

  const requestContext = await getRequestContext();
  const { error } = await setAdminSpecTemplateActive(id, isActive, requestContext);

  if (error) {
    throw new Error(error);
  }

  revalidateSpecTemplates();
}

// ── Field Actions ────────────────────────────────────────────────────────────

export async function createFieldAction(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdminAuth(SYSTEM_CONFIG_ROLES);

  try {
    const template_id = readString(formData, 'template_id');
    const key = readString(formData, 'key');
    const label = readString(formData, 'label');
    const type = readString(formData, 'type');
    const unit = readString(formData, 'unit') || null;
    const is_required = readBoolean(formData, 'is_required');
    const is_filterable = readBoolean(formData, 'is_filterable');
    const is_active = readBoolean(formData, 'is_active');
    const sort_order = readInt(formData, 'sort_order', 0);
    const optionsRaw = readString(formData, 'options_text');

    if (!template_id) return { ok: false, error: 'Thiếu ID mẫu thông số liên kết.' };
    if (!key) return { ok: false, error: 'Mã thuộc tính là bắt buộc.' };
    if (!CODE_REGEX.test(key)) {
      return { ok: false, error: 'Mã thuộc tính không hợp lệ. Chỉ chấp nhận chữ thường không dấu, số và dấu gạch dưới (bắt đầu bằng chữ).' };
    }
    if (!label) return { ok: false, error: 'Tên thuộc tính là bắt buộc.' };
    if (!ALLOWED_FIELD_TYPES.includes(type)) {
      return { ok: false, error: 'Kiểu dữ liệu thuộc tính không hợp lệ.' };
    }
    if (sort_order < 0) return { ok: false, error: 'Thứ tự ưu tiên không được âm.' };

    // Process and validate options for select/multi_select
    let options: string[] | null = null;
    if (type === 'select' || type === 'multi_select') {
      if (!optionsRaw) {
        return { ok: false, error: 'Danh sách lựa chọn là bắt buộc đối với kiểu dữ liệu select/multi_select.' };
      }
      options = optionsRaw
        .split('\n')
        .map((o) => o.trim())
        .filter((o) => o.length > 0);

      if (options.length === 0) {
        return { ok: false, error: 'Danh sách lựa chọn phải có ít nhất một giá trị.' };
      }
    }

    const requestContext = await getRequestContext();
    const { error } = await createAdminSpecField(
      {
        template_id,
        key,
        label,
        type,
        unit,
        options,
        is_required,
        is_filterable,
        is_active,
        sort_order,
      },
      requestContext,
    );

    if (error) {
      return { ok: false, error };
    }

    revalidateSpecTemplates();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Lỗi hệ thống khi tạo thuộc tính.' };
  }
}

export async function updateFieldAction(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdminAuth(SYSTEM_CONFIG_ROLES);

  try {
    const id = readString(formData, 'id');
    const key = readString(formData, 'key');
    const label = readString(formData, 'label');
    const type = readString(formData, 'type');
    const unit = readString(formData, 'unit') || null;
    const is_required = readBoolean(formData, 'is_required');
    const is_filterable = readBoolean(formData, 'is_filterable');
    const is_active = readBoolean(formData, 'is_active');
    const sort_order = readInt(formData, 'sort_order', 0);
    const optionsRaw = readString(formData, 'options_text');

    if (!id) return { ok: false, error: 'Thiếu ID thuộc tính.' };
    if (!key) return { ok: false, error: 'Mã thuộc tính là bắt buộc.' };
    if (!CODE_REGEX.test(key)) {
      return { ok: false, error: 'Mã thuộc tính không hợp lệ. Chỉ chấp nhận chữ thường không dấu, số và dấu gạch dưới (bắt đầu bằng chữ).' };
    }
    if (!label) return { ok: false, error: 'Tên thuộc tính là bắt buộc.' };
    if (!ALLOWED_FIELD_TYPES.includes(type)) {
      return { ok: false, error: 'Kiểu dữ liệu thuộc tính không hợp lệ.' };
    }
    if (sort_order < 0) return { ok: false, error: 'Thứ tự ưu tiên không được âm.' };

    // Process and validate options for select/multi_select
    let options: string[] | null = null;
    if (type === 'select' || type === 'multi_select') {
      if (!optionsRaw) {
        return { ok: false, error: 'Danh sách lựa chọn là bắt buộc đối với kiểu dữ liệu select/multi_select.' };
      }
      options = optionsRaw
        .split('\n')
        .map((o) => o.trim())
        .filter((o) => o.length > 0);

      if (options.length === 0) {
        return { ok: false, error: 'Danh sách lựa chọn phải có ít nhất một giá trị.' };
      }
    }

    const requestContext = await getRequestContext();
    const { error } = await updateAdminSpecField(
      id,
      {
        key,
        label,
        type,
        unit,
        options,
        is_required,
        is_filterable,
        is_active,
        sort_order,
      },
      requestContext,
    );

    if (error) {
      return { ok: false, error };
    }

    revalidateSpecTemplates();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Lỗi hệ thống khi cập nhật thuộc tính.' };
  }
}

export async function toggleFieldActiveAction(formData: FormData): Promise<void> {
  await requireAdminAuth(SYSTEM_CONFIG_ROLES);

  const id = readString(formData, 'id');
  const isActive = readString(formData, 'next_is_active') === 'true';

  if (!id) {
    throw new Error('Thiếu ID thuộc tính.');
  }

  const requestContext = await getRequestContext();
  const { error } = await setAdminSpecFieldActive(id, isActive, requestContext);

  if (error) {
    throw new Error(error);
  }

  revalidateSpecTemplates();
}

export async function deleteFieldAction(id: string): Promise<AdminFormState> {
  await requireAdminAuth(SYSTEM_CONFIG_ROLES);

  if (!id) {
    return { ok: false, error: 'Thiếu ID thuộc tính cần xóa.' };
  }

  try {
    const requestContext = await getRequestContext();
    const { error, softDisabled, deleted } = await deleteAdminSpecField(id, requestContext);

    if (error) {
      return { ok: false, error };
    }

    revalidateSpecTemplates();
    return { ok: true, softDisabled, deleted };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Lỗi hệ thống khi xóa thuộc tính.' };
  }
}
