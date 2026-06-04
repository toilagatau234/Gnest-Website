import { AdminPageSkeleton } from '@/components/admin/AdminSkeletons';

export default function AdminUsersLoading() {
  return <AdminPageSkeleton statsCount={4} tableRows={5} />;
}
