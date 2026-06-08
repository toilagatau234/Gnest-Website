import { redirect } from 'next/navigation';

import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { getAdminEntryPath } from '@/lib/services/admin/auth';

interface AdminLoginPageProps {
  searchParams: Promise<{
    reason?: string | string[];
  }>;
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const entryPath = await getAdminEntryPath();
  const params = await searchParams;
  const reason = Array.isArray(params.reason) ? params.reason[0] : params.reason;

  if (entryPath !== '/admin/login') {
    redirect(entryPath);
  }

  return <AdminLoginForm timedOut={reason === 'timeout'} />;
}
