import { ScrollText } from 'lucide-react';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminPlaceholderPanel } from '@/components/admin/AdminPlaceholderPanel';
import { AdminSection } from '@/components/admin/AdminSection';

export default function AuditLogsPage() {
  return (
    <AdminSection>
      <AdminPageHeader
        title="Nhật ký hoạt động"
        description="Theo dõi các thao tác quan trọng của admin trên dữ liệu CMS."
      />

      <AdminPlaceholderPanel
        icon={<ScrollText className="h-5 w-5" />}
        title="Audit log đã có nền tảng dữ liệu"
        description="Các mutation hiện tại có ghi audit_logs. Giao diện lọc, phân trang và xem chi tiết log nên được triển khai ở phase riêng."
        items={['Hành động', 'Đối tượng dữ liệu', 'Người thao tác']}
      />
    </AdminSection>
  );
}
