import { AdminPageSkeleton } from '@/components/admin/AdminSkeletons';

export default function JobsLoading() {
  return <AdminPageSkeleton statsCount={4} tableRows={5} />;
}
