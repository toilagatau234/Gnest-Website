import { Briefcase } from 'lucide-react';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminPlaceholderPanel } from '@/components/admin/AdminPlaceholderPanel';
import { AdminSection } from '@/components/admin/AdminSection';

export default function JobsPage() {
  return (
    <AdminSection>
      <AdminPageHeader title="Tuyển dụng" description="Quản lý bài tuyển dụng hiển thị trên website." />

      <AdminPlaceholderPanel
        icon={<Briefcase className="h-5 w-5" />}
        title="Phân hệ tuyển dụng đang được chuẩn bị"
        description="Nội dung tuyển dụng sẽ dùng bảng job_vacancies, giữ route public hiện có và chỉ mở mutation qua server-side guard."
        items={['Vị trí tuyển dụng', 'Địa điểm và lương', 'Trạng thái hiển thị']}
      />
    </AdminSection>
  );
}
