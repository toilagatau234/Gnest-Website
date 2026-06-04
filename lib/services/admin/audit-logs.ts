import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/types/database';

import { requireAdminAuth } from '@/lib/services/admin/auth';

const SHOULD_LOG_TIMINGS =
  process.env.NODE_ENV === 'development' && process.env.ADMIN_TIMING_LOGS === '1';

// Full entry — includes metadata. Used by the detail modal and getAuditLogDetail().
export type AuditLogEntry = Tables<'audit_logs'> & { actorEmail: string | null };

// Slim entry — no metadata. Returned by the list query to avoid sending large
// JSONB payloads for every row. The detail modal lazy-fetches a full entry.
export type AuditLogListItem = {
  id: string;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  created_at: string;
  actorEmail: string | null;
};

export interface GetAuditLogsOptions {
  limit?: number;
  offset?: number;
  page?: number;
  action?: string;
  entity?: string;
  actorId?: string;
  dateFrom?: string; // ISO string
  dateTo?: string; // ISO string
  search?: string;
}

export interface GetAuditLogsResult {
  data: AuditLogListItem[];
  total: number;
  page: number;
  pageSize: number;
  error: string | null;
}

export async function getAuditLogs(options?: GetAuditLogsOptions): Promise<GetAuditLogsResult> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? (page - 1) * limit;

  try {
    await requireAdminAuth();
    const supabase = createServiceRoleClient();
    const t0 = SHOULD_LOG_TIMINGS ? performance.now() : 0;

    // metadata is intentionally excluded from the list query.
    // The detail modal calls getAuditLogDetail(id) to fetch it on demand.
    let query = supabase
      .from('audit_logs')
      .select('id, actor_id, action, entity, entity_id, created_at', { count: 'exact' });

    // Apply exact filters
    if (options?.action) {
      query = query.eq('action', options.action);
    }
    if (options?.entity) {
      query = query.eq('entity', options.entity);
    }
    if (options?.actorId) {
      query = query.eq('actor_id', options.actorId);
    }

    // Apply timestamp range filters
    if (options?.dateFrom) {
      query = query.gte('created_at', options.dateFrom);
    }
    if (options?.dateTo) {
      query = query.lte('created_at', options.dateTo);
    }

    // Apply search query
    if (options?.search) {
      const searchPattern = `%${options.search}%`;
      let orFilter = `action.ilike.${searchPattern},entity.ilike.${searchPattern}`;

      // Check if search matches any admin user's email
      const { data: matchingUsers } = await supabase
        .from('admin_users')
        .select('id')
        .ilike('email', searchPattern);

      if (matchingUsers && matchingUsers.length > 0) {
        const userIds = matchingUsers.map((u) => u.id);
        orFilter += `,actor_id.in.(${userIds.join(',')})`;
      }

      query = query.or(orFilter);
    }

    // Apply sorting and pagination range
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (t0) console.info(`[admin:audit-logs] getAuditLogs page=${page} ${(performance.now() - t0).toFixed(1)}ms`);

    if (error) {
      return {
        data: [],
        total: 0,
        page,
        pageSize: limit,
        error: error.message,
      };
    }

    const logs = data ?? [];
    const actorIds = Array.from(
      new Set(logs.map((log) => log.actor_id).filter((id): id is string => Boolean(id))),
    );

    const emailById = new Map<string, string>();
    if (actorIds.length > 0) {
      const { data: actors } = await supabase
        .from('admin_users')
        .select('id, email')
        .in('id', actorIds);

      for (const actor of actors ?? []) {
        emailById.set(actor.id, actor.email);
      }
    }

    const enriched: AuditLogListItem[] = logs.map((log) => ({
      id: log.id,
      actor_id: log.actor_id,
      action: log.action,
      entity: log.entity,
      entity_id: log.entity_id,
      created_at: log.created_at,
      actorEmail: log.actor_id ? emailById.get(log.actor_id) ?? null : null,
    }));

    return {
      data: enriched,
      total: count ?? 0,
      page,
      pageSize: limit,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể tải nhật ký hoạt động';
    return {
      data: [],
      total: 0,
      page,
      pageSize: limit,
      error: message,
    };
  }
}

export interface AuditLogStats {
  total: number;
  today: number;
  uniqueActors: number;
  highRisk: number;
}

// Actions considered high-risk for the stats card.
const HIGH_RISK_ACTIONS = ['delete', 'deactivate', 'remove_admin_user_access', 'update_admin_user_role'];

export async function getAuditLogStats(): Promise<{ data: AuditLogStats | null; error: string | null }> {
  try {
    await requireAdminAuth();
    const supabase = createServiceRoleClient();
    const t0 = SHOULD_LOG_TIMINGS ? performance.now() : 0;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayStr = startOfToday.toISOString();

    // COUNT(DISTINCT actor_id) is unavailable via PostgREST without an RPC.
    // Instead, fetch actor_ids from the last 30 days (bounded to 500 rows) and
    // count distinct in JS. Correct for any system with ≤500 actions per month.
    const thirtyDaysAgo = new Date(startOfToday);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

    const [
      { count: totalCount, error: totalError },
      { count: todayCount, error: todayError },
      { count: highRiskCount, error: highRiskError },
      { data: recentActorRows, error: actorError },
    ] = await Promise.all([
      supabase.from('audit_logs').select('id', { count: 'exact', head: true }),
      supabase.from('audit_logs').select('id', { count: 'exact', head: true }).gte('created_at', startOfTodayStr),
      supabase.from('audit_logs').select('id', { count: 'exact', head: true }).in('action', HIGH_RISK_ACTIONS),
      supabase
        .from('audit_logs')
        .select('actor_id')
        .gte('created_at', thirtyDaysAgoStr)
        .not('actor_id', 'is', null)
        .limit(500),
    ]);

    if (t0) console.info(`[admin:audit-logs] getAuditLogStats ${(performance.now() - t0).toFixed(1)}ms`);

    if (totalError || todayError || highRiskError || actorError) {
      const errorMsg =
        totalError?.message ?? todayError?.message ?? highRiskError?.message ?? actorError?.message ?? 'Lỗi đếm stats';
      return { data: null, error: errorMsg };
    }

    const uniqueActors = new Set((recentActorRows ?? []).map((r) => r.actor_id)).size;

    return {
      data: {
        total: totalCount ?? 0,
        today: todayCount ?? 0,
        uniqueActors,
        highRisk: highRiskCount ?? 0,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Không thể tải thống kê nhật ký' };
  }
}

// Fetches a single log entry with full metadata — use this in the detail modal
// so future callers can strip metadata from the list query without losing detail.
export async function getAuditLogDetail(
  logId: string,
): Promise<{ data: AuditLogEntry | null; error: string | null }> {
  try {
    await requireAdminAuth();
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, actor_id, action, entity, entity_id, created_at, metadata')
      .eq('id', logId)
      .maybeSingle();

    if (error) return { data: null, error: error.message };
    if (!data) return { data: null, error: 'Không tìm thấy nhật ký.' };

    let actorEmail: string | null = null;
    if (data.actor_id) {
      const { data: actor } = await supabase
        .from('admin_users')
        .select('email')
        .eq('id', data.actor_id)
        .maybeSingle();
      actorEmail = actor?.email ?? null;
    }

    return { data: { ...data, actorEmail }, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Không thể tải chi tiết nhật ký',
    };
  }
}
