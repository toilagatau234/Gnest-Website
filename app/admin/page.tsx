import { redirect } from 'next/navigation';

import { getAdminEntryPath } from '@/lib/services/admin/auth';

export default async function AdminPage() {
  const entryPath = await getAdminEntryPath();

  redirect(entryPath);
}
