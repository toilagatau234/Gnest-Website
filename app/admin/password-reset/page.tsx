import { redirect } from 'next/navigation';

import { AdminPasswordResetForm } from '@/components/admin/AdminPasswordResetForm';
import { ADMIN_DISABLED_CLEAR_PATH, getAdminSessionState } from '@/lib/services/admin/auth';
import { requiresAdminPasswordReset } from '@/lib/services/admin/user-password-reset';

export default async function AdminPasswordResetPage() {
  const sessionState = await getAdminSessionState();

  if (sessionState.status === 'unauthenticated') {
    redirect('/admin/login');
  }

  if (sessionState.status === 'disabled') {
    redirect(ADMIN_DISABLED_CLEAR_PATH);
  }

  if (sessionState.status !== 'authorized') {
    redirect('/admin/access-denied');
  }

  if (!requiresAdminPasswordReset(sessionState.user)) {
    redirect('/admin/dashboard');
  }

  return <AdminPasswordResetForm />;
}
