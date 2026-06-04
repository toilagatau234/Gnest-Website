import { redirect } from 'next/navigation';

import { AdminShell } from '@/components/admin/AdminShell';
import { getAdminSessionState } from '@/lib/services/admin/auth';
import { requiresAdminPasswordReset } from '@/lib/services/admin/user-password-reset';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // eslint-disable-next-line react-hooks/purity
  const _t0 = Date.now();
  const sessionState = await getAdminSessionState();
  if (process.env.NODE_ENV === 'development' && process.env.ADMIN_TIMING_LOGS === '1') {
    // eslint-disable-next-line react-hooks/purity
    console.log(`[admin-timing] layout session check: ${Date.now() - _t0}ms`);
  }

  if (sessionState.status === 'unauthenticated') {
    redirect('/admin/login');
  }

  if (sessionState.status !== 'authorized') {
    redirect('/admin/access-denied');
  }

  if (requiresAdminPasswordReset(sessionState.user)) {
    redirect('/admin/password-reset');
  }

  return <AdminShell adminUser={sessionState.adminUser}>{children}</AdminShell>;
}
