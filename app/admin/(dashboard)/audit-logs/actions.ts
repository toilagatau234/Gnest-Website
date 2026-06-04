'use server';

import { getAuditLogDetail } from '@/lib/services/admin/audit-logs';
import type { AuditLogEntry } from '@/lib/services/admin/audit-logs';

export async function fetchAuditLogDetailAction(
  logId: string,
): Promise<{ data: AuditLogEntry | null; error: string | null }> {
  return getAuditLogDetail(logId);
}
