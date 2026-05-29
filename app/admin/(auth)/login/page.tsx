import { redirect } from 'next/navigation';

import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { getAdminEntryPath } from '@/lib/services/admin/auth';

export default async function AdminLoginPage() {
  const entryPath = await getAdminEntryPath();

  if (entryPath !== '/admin/login') {
    redirect(entryPath);
  }

  return <AdminLoginForm />;
}
