'use server';

import { revalidatePath } from 'next/cache';

import {
  addInquiryInternalNote,
  assignInquiry,
  updateInquiryMetadata,
  updateInquiryStatus,
  type InquiryPriority,
} from '@/lib/services/admin/inquiries';
import type { InquiryStatus } from '@/lib/types/database';

export type InquiryActionState = { ok: boolean; error?: string };

const VALID_STATUSES: readonly InquiryStatus[] = ['new', 'contacted', 'quoted', 'closed', 'spam'];
const VALID_PRIORITIES: readonly InquiryPriority[] = ['low', 'normal', 'high'];

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function revalidateInquiries() {
  revalidatePath('/admin/inquiries');
  revalidatePath('/admin/dashboard');
}

export async function updateInquiryStatusAction(formData: FormData): Promise<InquiryActionState> {
  const inquiryId = readString(formData, 'inquiry_id');
  const status = readString(formData, 'status') as InquiryStatus;

  if (!inquiryId) {
    return { ok: false, error: 'Thiếu ID yêu cầu báo giá.' };
  }

  if (!VALID_STATUSES.includes(status)) {
    return { ok: false, error: 'Trạng thái yêu cầu không hợp lệ.' };
  }

  const { error } = await updateInquiryStatus(inquiryId, status);

  if (error) {
    return { ok: false, error };
  }

  revalidateInquiries();
  return { ok: true };
}

export async function assignInquiryAction(formData: FormData): Promise<InquiryActionState> {
  const inquiryId = readString(formData, 'inquiry_id');
  const assigneeId = readString(formData, 'assigned_to') || null;

  if (!inquiryId) {
    return { ok: false, error: 'Thiếu ID yêu cầu báo giá.' };
  }

  const { error } = await assignInquiry(inquiryId, assigneeId);

  if (error) {
    return { ok: false, error };
  }

  revalidateInquiries();
  return { ok: true };
}

export async function addInquiryInternalNoteAction(formData: FormData): Promise<InquiryActionState> {
  const inquiryId = readString(formData, 'inquiry_id');
  const note = readString(formData, 'note');

  if (!inquiryId) {
    return { ok: false, error: 'Thiếu ID yêu cầu báo giá.' };
  }

  const { error } = await addInquiryInternalNote(inquiryId, note);

  if (error) {
    return { ok: false, error };
  }

  revalidateInquiries();
  return { ok: true };
}

export async function updateInquiryPriorityAction(formData: FormData): Promise<InquiryActionState> {
  const inquiryId = readString(formData, 'inquiry_id');
  const priority = readString(formData, 'priority') as InquiryPriority;

  if (!inquiryId) {
    return { ok: false, error: 'Thiếu ID yêu cầu báo giá.' };
  }

  if (!VALID_PRIORITIES.includes(priority)) {
    return { ok: false, error: 'Mức ưu tiên không hợp lệ.' };
  }

  const { error } = await updateInquiryMetadata(inquiryId, { priority });

  if (error) {
    return { ok: false, error };
  }

  revalidateInquiries();
  return { ok: true };
}
