'use server';

import { getAuditLogDetail } from '@/lib/services/admin/audit-logs';
import type { AuditLogEntry } from '@/lib/services/admin/audit-logs';
import { requireAdminAuth } from '@/lib/services/admin/auth';
import { SYSTEM_VIEWER_ROLES } from '@/lib/services/admin/permissions';

export async function fetchAuditLogDetailAction(
  logId: string,
): Promise<{ data: AuditLogEntry | null; error: string | null }> {
  await requireAdminAuth(SYSTEM_VIEWER_ROLES);
  return getAuditLogDetail(logId);
}
