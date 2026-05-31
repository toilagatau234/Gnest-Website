import { Phone } from 'lucide-react';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminPlaceholderPanel } from '@/components/admin/AdminPlaceholderPanel';
import { AdminSection } from '@/components/admin/AdminSection';

export default function SalesContactsPage() {
  return (
    <AdminSection>
      <AdminPageHeader
        title="Liên hệ bán hàng"
        description="Quản lý hotline, Zalo và nhân sự tư vấn hiển thị trên website."
      />

      <AdminPlaceholderPanel
        icon={<Phone className="h-5 w-5" />}
        title="Phân hệ liên hệ bán hàng đang được chuẩn bị"
        description="Giao diện đã được giữ đúng hệ thống admin mới. CRUD chi tiết nên triển khai bằng server action có guard admin và ghi audit log."
        items={['Hotline và Zalo', 'Avatar tư vấn viên', 'Thứ tự hiển thị']}
      />
    </AdminSection>
  );
}
