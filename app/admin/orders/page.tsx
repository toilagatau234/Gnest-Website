import { LegacyOrdersClient } from '@/components/admin/LegacyOrdersClient';
import { requireAdminAuth } from '@/lib/services/admin/auth';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const adminUser = await requireAdminAuth();

  return <LegacyOrdersClient adminUser={adminUser} />;
}
