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

export async function updateInquiryWorkflowAction(formData: FormData): Promise<InquiryActionState> {
  try {
    // 1. Authenticate & Role check
    const actor = await requireAdminAuth(['super_admin', 'admin', 'editor']);
    
    const inquiryId = readString(formData, 'inquiry_id');
    if (!inquiryId) {
      return { ok: false, error: 'Thiếu ID yêu cầu báo giá.' };
    }

    const nextStatus = readString(formData, 'status') as InquiryStatus;
    const nextPriority = readString(formData, 'priority') as InquiryPriority;
    const nextAssigneeId = readString(formData, 'assigned_to') || null;

    // Validate inputs
    if (nextStatus && !VALID_STATUSES.includes(nextStatus)) {
      return { ok: false, error: 'Trạng thái yêu cầu không hợp lệ.' };
    }
    if (nextPriority && !VALID_PRIORITIES.includes(nextPriority)) {
      return { ok: false, error: 'Mức ưu tiên không hợp lệ.' };
    }

    // Connect to Supabase
    const { createServiceRoleClient } = await import('@/lib/supabase/server');
    const supabase = createServiceRoleClient();

    // Fetch existing inquiry
    const { data: current, error: getErr } = await supabase
      .from('inquiries')
      .select('*')
      .eq('id', inquiryId)
      .maybeSingle();

    if (getErr || !current) {
      return { ok: false, error: 'Không tìm thấy yêu cầu báo giá hoặc lỗi hệ thống.' };
    }

    const prevMetadata = current.metadata && typeof current.metadata === 'object' && !Array.isArray(current.metadata)
      ? (current.metadata as Record<string, any>)
      : {};

    const prevPriority = prevMetadata.priority || 'normal';

    // Calculate changes
    const changes: Record<string, { old: any; new: any }> = {};
    const updatePayload: Record<string, any> = {};

    if (nextStatus && nextStatus !== current.status) {
      changes.status = { old: current.status, new: nextStatus };
      updatePayload.status = nextStatus;
    }

    if (nextPriority && nextPriority !== prevPriority) {
      changes.priority = { old: prevPriority, new: nextPriority };
    }

    if (nextAssigneeId !== current.assigned_to) {
      changes.assigned_to = { old: current.assigned_to, new: nextAssigneeId };
      updatePayload.assigned_to = nextAssigneeId;
    }

    // If nothing changed, return ok
    if (Object.keys(changes).length === 0) {
      return { ok: true };
    }

    // Prepare updated timeline
    const timeline = Array.isArray(prevMetadata.timeline) ? prevMetadata.timeline : [];
    const newTimelineItems: any[] = [];

    // Map VI status labels
    const STATUS_VI: Record<string, string> = {
      new: 'Mới',
      contacted: 'Đã liên hệ',
      quoted: 'Đã báo giá',
      closed: 'Đã đóng',
      spam: 'Spam',
    };
    const PRIORITY_VI: Record<string, string> = {
      low: 'Thấp',
      normal: 'Bình thường',
      high: 'Cao',
    };

    if (changes.status) {
      newTimelineItems.push({
        id: crypto.randomUUID(),
        type: 'status_changed',
        actor_id: actor.id,
        actor_email: actor.email,
        created_at: new Date().toISOString(),
        from: changes.status.old,
        to: changes.status.new,
        message: `Chuyển trạng thái từ ${STATUS_VI[changes.status.old] || changes.status.old} sang ${STATUS_VI[changes.status.new] || changes.status.new}.`,
      });
    }

    if (changes.assigned_to) {
      let assigneeEmail: string | null = null;
      if (nextAssigneeId) {
        const { data: assignee } = await supabase
          .from('admin_users')
          .select('email')
          .eq('id', nextAssigneeId)
          .maybeSingle();
        assigneeEmail = assignee?.email || 'Quản trị viên';
      }

      newTimelineItems.push({
        id: crypto.randomUUID(),
        type: 'assigned',
        actor_id: actor.id,
        actor_email: actor.email,
        created_at: new Date().toISOString(),
        from: changes.assigned_to.old,
        to: nextAssigneeId,
        message: assigneeEmail ? `Gán cho ${assigneeEmail}.` : 'Bỏ phân công người phụ trách.',
      });
    }

    if (changes.priority) {
      newTimelineItems.push({
        id: crypto.randomUUID(),
        type: 'quick_action',
        actor_id: actor.id,
        actor_email: actor.email,
        created_at: new Date().toISOString(),
        from: changes.priority.old,
        to: changes.priority.new,
        message: `Đổi mức ưu tiên từ ${PRIORITY_VI[changes.priority.old] || changes.priority.old} sang ${PRIORITY_VI[changes.priority.new] || changes.priority.new}.`,
      });
    }

    const nextMetadata = {
      ...prevMetadata,
      priority: nextPriority,
      timeline: [...newTimelineItems, ...timeline],
    };
    updatePayload.metadata = nextMetadata;

    // Persist updates
    const { error: updateErr } = await supabase
      .from('inquiries')
      .update(updatePayload)
      .eq('id', inquiryId);

    if (updateErr) {
      return { ok: false, error: updateErr.message };
    }

    // Write audit log
    await supabase.from('audit_logs').insert({
      actor_id: actor.id,
      action: 'update_workflow',
      entity: 'inquiries',
      entity_id: inquiryId,
      metadata: {
        changes,
        customer_name: current.customer_name,
      },
    });

    revalidateInquiries();
    return { ok: true };
  } catch (err) {
    console.error('[updateInquiryWorkflowAction] error', err);
    return { ok: false, error: err instanceof Error ? err.message : 'Lỗi không xác định' };
  }
}

