'use server';

import { revalidatePath } from 'next/cache';

import {
  createAdminSalesContact,
  deleteAdminSalesContact,
  setAdminSalesContactActive,
  updateAdminSalesContact,
  type SalesContactPayload,
} from '@/lib/services/admin/sales-contacts';

export type AdminFormState = { ok: boolean; error?: string };

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function readBoolean(formData: FormData, key: string) {
  return formData.get(key) === 'on' || formData.get(key) === 'true';
}

function readSalesContactPayload(formData: FormData): SalesContactPayload {
  const name = readString(formData, 'name');
  const phone = readString(formData, 'phone');
  const sortOrder = Number(readString(formData, 'sort_order') || 0);

  if (!name) {
    throw new Error('Tên nhân sự tư vấn là bắt buộc.');
  }

  if (!phone) {
    throw new Error('Số điện thoại là bắt buộc.');
  }

  return {
    name,
    role: readString(formData, 'role') || null,
    phone,
    zalo: readString(formData, 'zalo') || null,
    avatar_url: readString(formData, 'avatar_url') || null,
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    is_active: readBoolean(formData, 'is_active'),
  };
}

function revalidateSalesContacts() {
  revalidatePath('/admin/sales-contacts');
  revalidatePath('/admin/dashboard');
  revalidatePath('/');
}

export async function createSalesContactAction(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  try {
    const payload = readSalesContactPayload(formData);
    const { error } = await createAdminSalesContact(payload);

    if (error) {
      return { ok: false, error };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Không thể tạo liên hệ bán hàng.' };
  }

  revalidateSalesContacts();
  return { ok: true };
}

export async function updateSalesContactAction(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  try {
    const contactId = readString(formData, 'id');

    if (!contactId) {
      return { ok: false, error: 'Thiếu ID liên hệ bán hàng.' };
    }

    const payload = readSalesContactPayload(formData);
    const { error } = await updateAdminSalesContact(contactId, payload);

    if (error) {
      return { ok: false, error };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Không thể cập nhật liên hệ bán hàng.' };
  }

  revalidateSalesContacts();
  return { ok: true };
}

export async function deleteSalesContactAction(contactId: string): Promise<AdminFormState> {
  if (!contactId) {
    return { ok: false, error: 'Thiếu ID liên hệ bán hàng.' };
  }

  try {
    const { error } = await deleteAdminSalesContact(contactId);

    if (error) {
      return { ok: false, error };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Không thể xóa liên hệ bán hàng.' };
  }

  revalidateSalesContacts();
  return { ok: true };
}

export async function toggleSalesContactActiveAction(formData: FormData) {
  const contactId = readString(formData, 'id');
  const isActive = readString(formData, 'next_is_active') === 'true';

  if (!contactId) {
    throw new Error('Thiếu ID liên hệ bán hàng.');
  }

  const { error } = await setAdminSalesContactActive(contactId, isActive);

  if (error) {
    throw new Error(error);
  }

  revalidateSalesContacts();
}
