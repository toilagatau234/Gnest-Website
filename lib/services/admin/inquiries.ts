import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { InquiryStatus, Json, Tables } from '@/lib/types/database';

import { requireAdminAuth } from '@/lib/services/admin/auth';

const SHOULD_LOG_TIMINGS =
  process.env.NODE_ENV === 'development' && process.env.ADMIN_TIMING_LOGS === '1';

export type Inquiry = Tables<'inquiries'>;

export type AdminInquiry = Tables<'inquiries'> & {
  products?: Pick<Tables<'products'>, 'id' | 'name' | 'slug'> | null;
};

export type InquiryPriority = 'low' | 'normal' | 'high';

const STATUS_VI: Record<string, string> = {
  new: 'Mới',
  contacted: 'Đã liên hệ',
  quoted: 'Đã báo giá',
  closed: 'Đã đóng',
  spam: 'Spam',
};

function getStatusLabel(status: string | null | undefined): string {
  if (!status) return '';
  return STATUS_VI[status] || status;
}

export interface InquiryInternalNote {
  id: string;
  note: string;
  actor_id: string;
  actor_email: string;
  created_at: string;
}

export interface InquiryTimelineItem {
  id: string;
  type: 'status_changed' | 'assigned' | 'note_added' | 'quick_action';
  actor_id: string;
  actor_email: string;
  created_at: string;
  from?: string | null;
  to?: string | null;
  message?: string;
}

export interface InquiryWorkflowMetadata {
  priority?: InquiryPriority;
  internal_notes?: InquiryInternalNote[];
  timeline?: InquiryTimelineItem[];
}

export interface InquiryStats {
  total: number;
  byStatus: Record<InquiryStatus, number>;
  assigned: number;
  unassigned: number;
  highPriority: number;
}

export interface GetInquiriesOptions {
  status?: InquiryStatus;
  limit?: number;
  offset?: number;
}

const INQUIRY_MUTATION_ROLES = ['super_admin', 'admin', 'editor'] as const;
const INQUIRY_STATUSES: readonly InquiryStatus[] = ['new', 'contacted', 'quoted', 'closed', 'spam'];
const INQUIRY_PRIORITIES: readonly InquiryPriority[] = ['low', 'normal', 'high'];

function isRecord(value: Json): value is Record<string, Json | undefined> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeMetadata(metadata: Json): InquiryWorkflowMetadata {
  if (!isRecord(metadata)) {
    return {};
  }

  const priority = INQUIRY_PRIORITIES.includes(metadata.priority as InquiryPriority)
    ? (metadata.priority as InquiryPriority)
    : undefined;
  const internalNotes = Array.isArray(metadata.internal_notes)
    ? (metadata.internal_notes as unknown[]).filter(isWorkflowNote)
    : [];
  const timeline = Array.isArray(metadata.timeline)
    ? (metadata.timeline as unknown[]).filter(isTimelineItem)
    : [];
  const baseMetadata = metadata;

  return {
    ...baseMetadata,
    priority,
    internal_notes: internalNotes,
    timeline,
  };
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

function isWorkflowNote(value: unknown): value is InquiryInternalNote {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const note = value as Partial<InquiryInternalNote>;
  return (
    typeof note.id === 'string' &&
    typeof note.note === 'string' &&
    typeof note.actor_id === 'string' &&
    typeof note.actor_email === 'string' &&
    typeof note.created_at === 'string'
  );
}

function isTimelineItem(value: unknown): value is InquiryTimelineItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Partial<InquiryTimelineItem>;
  return (
    typeof item.id === 'string' &&
    typeof item.type === 'string' &&
    typeof item.actor_id === 'string' &&
    typeof item.actor_email === 'string' &&
    typeof item.created_at === 'string'
  );
}

function validateInquiryStatus(status: string): status is InquiryStatus {
  return INQUIRY_STATUSES.includes(status as InquiryStatus);
}

function validateInquiryPriority(priority: string): priority is InquiryPriority {
  return INQUIRY_PRIORITIES.includes(priority as InquiryPriority);
}

function makeTimelineItem(
  actor: { id: string; email: string },
  item: Omit<InquiryTimelineItem, 'id' | 'actor_id' | 'actor_email' | 'created_at'>,
): InquiryTimelineItem {
  return {
    id: crypto.randomUUID(),
    actor_id: actor.id,
    actor_email: actor.email,
    created_at: new Date().toISOString(),
    ...item,
  };
}

async function readInquiryById(supabase: ReturnType<typeof createServiceRoleClient>, inquiryId: string) {
  const { data, error } = await supabase
    .from('inquiries')
    .select('*, products(id, name, slug)')
    .eq('id', inquiryId)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data) {
    return { data: null, error: 'Không tìm thấy yêu cầu báo giá.' };
  }

  return { data: data as AdminInquiry, error: null };
}

async function writeAuditLog(
  supabase: ReturnType<typeof createServiceRoleClient>,
  actorId: string,
  action: string,
  inquiryId: string,
  metadata: Json,
) {
  try {
    await supabase.from('audit_logs').insert({
      actor_id: actorId,
      action,
      entity: 'inquiries',
      entity_id: inquiryId,
      metadata,
    });
  } catch (err) {
    console.error('Lỗi khi ghi audit log:', err);
  }
}

export function getInquiryMetadata(inquiry: Inquiry): InquiryWorkflowMetadata {
  return normalizeMetadata(inquiry.metadata);
}

export async function getInquiries(options?: GetInquiriesOptions): Promise<{ data: AdminInquiry[] | null; error: string | null }> {
  try {
    await requireAdminAuth();
    const supabase = createServiceRoleClient();

    let query = supabase.from('inquiries').select('*, products(id, name, slug)').order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.offset !== undefined) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    } else if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data || []) as AdminInquiry[], error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi không xác định';
    return { data: null, error: message };
  }
}

export async function getInquiryById(inquiryId: string) {
  try {
    await requireAdminAuth();
    const supabase = createServiceRoleClient();
    return readInquiryById(supabase, inquiryId);
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Không thể tải yêu cầu báo giá.',
    };
  }
}

export async function updateInquiryStatus(inquiryId: string, nextStatus: InquiryStatus): Promise<{ data: AdminInquiry | null; error: string | null }> {
  try {
    const actor = await requireAdminAuth(INQUIRY_MUTATION_ROLES);

    if (!validateInquiryStatus(nextStatus)) {
      return { data: null, error: 'Trạng thái yêu cầu không hợp lệ.' };
    }

    const supabase = createServiceRoleClient();
    const current = await readInquiryById(supabase, inquiryId);

    if (current.error || !current.data) {
      return { data: null, error: current.error };
    }

    const previousStatus = current.data.status;
    if (previousStatus === nextStatus) {
      return { data: current.data, error: null };
    }

    const metadata = normalizeMetadata(current.data.metadata);
    const timeline = metadata.timeline ?? [];
    const nextMetadata: InquiryWorkflowMetadata = {
      ...metadata,
      timeline: [
        makeTimelineItem(actor, {
          type: 'status_changed',
          from: previousStatus,
          to: nextStatus,
          message: `Chuyển trạng thái từ ${getStatusLabel(previousStatus)} sang ${getStatusLabel(nextStatus)}.`,
        }),
        ...timeline,
      ],
    };

    const { data, error } = await supabase
      .from('inquiries')
      .update({ status: nextStatus, metadata: toJson(nextMetadata) })
      .eq('id', inquiryId)
      .select('*, products(id, name, slug)')
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    const auditAction =
      nextStatus === 'spam'
        ? 'mark_spam'
        : nextStatus === 'closed'
          ? 'close'
          : previousStatus === 'closed'
            ? 'reopen'
            : 'status_update';

    await writeAuditLog(supabase, actor.id, auditAction, inquiryId, {
      from: previousStatus,
      to: nextStatus,
      customer_name: (data as any).customer_name,
    });

    return { data: data as any as AdminInquiry, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Không thể cập nhật trạng thái yêu cầu.',
    };
  }
}

export async function assignInquiry(inquiryId: string, adminUserId: string | null): Promise<{ data: AdminInquiry | null; error: string | null }> {
  try {
    const actor = await requireAdminAuth(INQUIRY_MUTATION_ROLES);
    const supabase = createServiceRoleClient();
    const current = await readInquiryById(supabase, inquiryId);

    if (current.error || !current.data) {
      return { data: null, error: current.error };
    }

    let assigneeEmail: string | null = null;
    if (adminUserId) {
      const { data: assignee, error: assigneeError } = await supabase
        .from('admin_users')
        .select('id, email, role, is_active')
        .eq('id', adminUserId)
        .maybeSingle();

      if (assigneeError) {
        return { data: null, error: assigneeError.message };
      }

      if (!assignee || !assignee.is_active || !['super_admin', 'admin', 'editor'].includes(assignee.role)) {
        return { data: null, error: 'Người phụ trách phải là tài khoản quản trị đang hoạt động với quyền xử lý phù hợp.' };
      }

      assigneeEmail = assignee.email;
    }

    const metadata = normalizeMetadata(current.data.metadata);
    const timeline = metadata.timeline ?? [];
    const nextMetadata: InquiryWorkflowMetadata = {
      ...metadata,
      timeline: [
        makeTimelineItem(actor, {
          type: 'assigned',
          from: current.data.assigned_to,
          to: adminUserId,
          message: assigneeEmail ? `Gán cho ${assigneeEmail}.` : 'Bỏ phân công người phụ trách.',
        }),
        ...timeline,
      ],
    };

    const { data, error } = await supabase
      .from('inquiries')
      .update({ assigned_to: adminUserId, metadata: toJson(nextMetadata) })
      .eq('id', inquiryId)
      .select('*, products(id, name, slug)')
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    await writeAuditLog(supabase, actor.id, 'assign', inquiryId, {
      from: current.data.assigned_to,
      to: adminUserId,
      assignee_email: assigneeEmail,
      customer_name: (data as any).customer_name,
    });

    return { data: data as any as AdminInquiry, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Không thể phân công yêu cầu.',
    };
  }
}

export async function addInquiryInternalNote(inquiryId: string, note: string): Promise<{ data: AdminInquiry | null; error: string | null }> {
  try {
    const actor = await requireAdminAuth(INQUIRY_MUTATION_ROLES);
    const trimmedNote = note.trim();

    if (!trimmedNote) {
      return { data: null, error: 'Nội dung ghi chú là bắt buộc.' };
    }

    if (trimmedNote.length > 1000) {
      return { data: null, error: 'Ghi chú không được vượt quá 1000 ký tự.' };
    }

    const supabase = createServiceRoleClient();
    const current = await readInquiryById(supabase, inquiryId);

    if (current.error || !current.data) {
      return { data: null, error: current.error };
    }

    const metadata = normalizeMetadata(current.data.metadata);
    const internalNotes = metadata.internal_notes ?? [];
    const timeline = metadata.timeline ?? [];
    const createdAt = new Date().toISOString();
    const newNote: InquiryInternalNote = {
      id: crypto.randomUUID(),
      note: trimmedNote,
      actor_id: actor.id,
      actor_email: actor.email,
      created_at: createdAt,
    };

    const nextMetadata: InquiryWorkflowMetadata = {
      ...metadata,
      internal_notes: [newNote, ...internalNotes],
      timeline: [
        {
          id: crypto.randomUUID(),
          type: 'note_added',
          actor_id: actor.id,
          actor_email: actor.email,
          created_at: createdAt,
          message: trimmedNote,
        },
        ...timeline,
      ],
    };

    const { data, error } = await supabase
      .from('inquiries')
      .update({ metadata: toJson(nextMetadata) })
      .eq('id', inquiryId)
      .select('*, products(id, name, slug)')
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    await writeAuditLog(supabase, actor.id, 'note_add', inquiryId, {
      note_id: newNote.id,
      customer_name: (data as any).customer_name,
    });

    return { data: data as any as AdminInquiry, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Không thể thêm ghi chú nội bộ.',
    };
  }
}

export async function updateInquiryMetadata(
  inquiryId: string,
  metadataPatch: Pick<InquiryWorkflowMetadata, 'priority'>,
): Promise<{ data: AdminInquiry | null; error: string | null }> {
  try {
    const actor = await requireAdminAuth(INQUIRY_MUTATION_ROLES);

    if (metadataPatch.priority && !validateInquiryPriority(metadataPatch.priority)) {
      return { data: null, error: 'Mức ưu tiên không hợp lệ.' };
    }

    const supabase = createServiceRoleClient();
    const current = await readInquiryById(supabase, inquiryId);

    if (current.error || !current.data) {
      return { data: null, error: current.error };
    }

    const metadata = normalizeMetadata(current.data.metadata);
    const timeline = metadata.timeline ?? [];
    const nextMetadata: InquiryWorkflowMetadata = {
      ...metadata,
      ...metadataPatch,
      timeline: [
        makeTimelineItem(actor, {
          type: 'quick_action',
          from: metadata.priority ?? null,
          to: metadataPatch.priority ?? null,
          message: 'Cập nhật metadata workflow.',
        }),
        ...timeline,
      ],
    };

    const { data, error } = await supabase
      .from('inquiries')
      .update({ metadata: toJson(nextMetadata) })
      .eq('id', inquiryId)
      .select('*, products(id, name, slug)')
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    await writeAuditLog(supabase, actor.id, 'metadata_update', inquiryId, {
      patch: toJson(metadataPatch),
      customer_name: (data as any).customer_name,
    });

    return { data: data as any as AdminInquiry, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Không thể cập nhật workflow metadata.',
    };
  }
}

const EMPTY_INQUIRY_STATS: InquiryStats = {
  total: 0,
  byStatus: { new: 0, contacted: 0, quoted: 0, closed: 0, spam: 0 },
  assigned: 0,
  unassigned: 0,
  highPriority: 0,
};

export async function getInquiryStats(): Promise<{ data: InquiryStats; error: string | null }> {
  try {
    await requireAdminAuth();
    const supabase = createServiceRoleClient();
    const t0 = SHOULD_LOG_TIMINGS ? performance.now() : 0;

    // Eight parallel COUNT queries replace a full unbounded table scan.
    // metadata->>priority filter pushes the JSONB predicate to Postgres.
    const [
      totalRes,
      newRes,
      contactedRes,
      quotedRes,
      closedRes,
      spamRes,
      assignedRes,
      highPriorityRes,
    ] = await Promise.all([
      supabase.from('inquiries').select('id', { count: 'exact', head: true }),
      supabase.from('inquiries').select('id', { count: 'exact', head: true }).eq('status', 'new'),
      supabase.from('inquiries').select('id', { count: 'exact', head: true }).eq('status', 'contacted'),
      supabase.from('inquiries').select('id', { count: 'exact', head: true }).eq('status', 'quoted'),
      supabase.from('inquiries').select('id', { count: 'exact', head: true }).eq('status', 'closed'),
      supabase.from('inquiries').select('id', { count: 'exact', head: true }).eq('status', 'spam'),
      supabase.from('inquiries').select('id', { count: 'exact', head: true }).not('assigned_to', 'is', null),
      supabase.from('inquiries').select('id', { count: 'exact', head: true }).filter('metadata->>priority', 'eq', 'high'),
    ]);

    if (t0) console.info(`[admin:inquiries] getInquiryStats ${(performance.now() - t0).toFixed(1)}ms`);

    const firstError =
      totalRes.error ??
      newRes.error ??
      contactedRes.error ??
      quotedRes.error ??
      closedRes.error ??
      spamRes.error ??
      assignedRes.error ??
      highPriorityRes.error;

    if (firstError) {
      return { data: EMPTY_INQUIRY_STATS, error: firstError.message };
    }

    const total = totalRes.count ?? 0;
    const assigned = assignedRes.count ?? 0;

    return {
      data: {
        total,
        byStatus: {
          new: newRes.count ?? 0,
          contacted: contactedRes.count ?? 0,
          quoted: quotedRes.count ?? 0,
          closed: closedRes.count ?? 0,
          spam: spamRes.count ?? 0,
        },
        assigned,
        unassigned: total - assigned,
        highPriority: highPriorityRes.count ?? 0,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: EMPTY_INQUIRY_STATS,
      error: err instanceof Error ? err.message : 'Không thể tải thống kê yêu cầu.',
    };
  }
}

export async function getInquiryCount() {
  try {
    await requireAdminAuth();
    const supabase = createServiceRoleClient();

    const { count, error } = await supabase.from('inquiries').select('*', { count: 'exact', head: true });

    if (error) {
      return { count: 0, error: error.message };
    }

    return { count: count || 0, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi không xác định';
    return { count: 0, error: message };
  }
}

export async function getNewInquiriesCount() {
  try {
    await requireAdminAuth();
    const supabase = createServiceRoleClient();

    const { count, error } = await supabase
      .from('inquiries')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new');

    if (error) {
      return { count: 0, error: error.message };
    }

    return { count: count || 0, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi không xác định';
    return { count: 0, error: message };
  }
}
