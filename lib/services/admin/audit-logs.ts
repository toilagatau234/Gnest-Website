import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/types/database';

import { requireAdminAuth } from '@/lib/services/admin/auth';

const SHOULD_LOG_TIMINGS =
  process.env.NODE_ENV === 'development' && process.env.ADMIN_TIMING_LOGS === '1';

export type AuditLogEntry = Tables<'audit_logs'> & { actorEmail: string | null };

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
  data: AuditLogEntry[];
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

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' });

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

    const enriched: AuditLogEntry[] = logs.map((log) => ({
      ...log,
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

    // Four lightweight COUNT queries replace a 5,000-row in-memory scan.
    // uniqueActors uses active admin_users count as a proxy for "admins who
    // have taken actions" — avoids a non-trivial COUNT(DISTINCT actor_id).
    const [
      { count: totalCount, error: totalError },
      { count: todayCount, error: todayError },
      { count: highRiskCount, error: highRiskError },
      { count: activeAdminCount, error: activeAdminError },
    ] = await Promise.all([
      supabase.from('audit_logs').select('id', { count: 'exact', head: true }),
      supabase.from('audit_logs').select('id', { count: 'exact', head: true }).gte('created_at', startOfTodayStr),
      supabase.from('audit_logs').select('id', { count: 'exact', head: true }).in('action', HIGH_RISK_ACTIONS),
      supabase.from('admin_users').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ]);

    if (t0) console.info(`[admin:audit-logs] getAuditLogStats ${(performance.now() - t0).toFixed(1)}ms`);

    if (totalError || todayError || highRiskError || activeAdminError) {
      const errorMsg =
        totalError?.message ?? todayError?.message ?? highRiskError?.message ?? activeAdminError?.message ?? 'Lỗi đếm stats';
      return { data: null, error: errorMsg };
    }

    return {
      data: {
        total: totalCount ?? 0,
        today: todayCount ?? 0,
        uniqueActors: activeAdminCount ?? 0,
        highRisk: highRiskCount ?? 0,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Không thể tải thống kê nhật ký' };
  }
}
