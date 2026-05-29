import { AdminShell } from '@/components/admin/AdminShell';
import { requireAdminAuth } from '@/lib/services/admin/auth';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminUser = await requireAdminAuth();

  return <AdminShell adminUser={adminUser}>{children}</AdminShell>;
}
