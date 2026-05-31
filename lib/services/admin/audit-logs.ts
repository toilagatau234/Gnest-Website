import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/types/database';

import { requireAdminAuth } from '@/lib/services/admin/auth';

export type AuditLogEntry = Tables<'audit_logs'> & { actorEmail: string | null };

export interface GetAuditLogsOptions {
  limit?: number;
}

export async function getAuditLogs(options?: GetAuditLogsOptions) {
  try {
    await requireAdminAuth();
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(options?.limit ?? 50);

    if (error) {
      return { data: null, error: error.message };
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

    return { data: enriched, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể tải nhật ký hoạt động';
    return { data: null, error: message };
  }
}
