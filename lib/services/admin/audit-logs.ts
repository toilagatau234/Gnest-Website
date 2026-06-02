import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/types/database';

import { requireAdminAuth } from '@/lib/services/admin/auth';

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

export async function getAuditLogStats(): Promise<{ data: AuditLogStats | null; error: string | null }> {
  try {
    await requireAdminAuth();
    const supabase = createServiceRoleClient();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayStr = startOfToday.toISOString();

    const [
      { count: totalCount, error: totalError },
      { count: todayCount, error: todayError },
      { data: recentLogs, error: recentError }
    ] = await Promise.all([
      supabase.from('audit_logs').select('*', { count: 'exact', head: true }),
      supabase.from('audit_logs').select('*', { count: 'exact', head: true }).gte('created_at', startOfTodayStr),
      supabase.from('audit_logs').select('actor_id, action').limit(5000)
    ]);

    if (totalError || todayError || recentError) {
      const errorMsg = totalError?.message || todayError?.message || recentError?.message || 'Lỗi đếm stats';
      return { data: null, error: errorMsg };
    }

    const uniqueActors = new Set(recentLogs?.map(log => log.actor_id).filter(Boolean)).size;
    const highRiskActions = ['delete', 'deactivate', 'remove_admin_user_access', 'update_admin_user_role'];
    const highRisk = recentLogs?.filter(log => highRiskActions.includes(log.action)).length ?? 0;

    return {
      data: {
        total: totalCount ?? 0,
        today: todayCount ?? 0,
        uniqueActors,
        highRisk
      },
      error: null
    };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Không thể tải thống kê nhật ký' };
  }
}
