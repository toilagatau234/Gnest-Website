import { AdminShell } from '@/components/admin/AdminShell';
import { requireAdminAuth } from '@/lib/services/admin/auth';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check: will redirect if not authenticated/authorized
  await requireAdminAuth();

  return <AdminShell>{children}</AdminShell>;
}
