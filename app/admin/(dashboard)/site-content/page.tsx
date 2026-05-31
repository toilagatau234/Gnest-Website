import { FileText } from 'lucide-react';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminPlaceholderPanel } from '@/components/admin/AdminPlaceholderPanel';
import { AdminSection } from '@/components/admin/AdminSection';

export default function SiteContentPage() {
  return (
    <AdminSection>
      <AdminPageHeader
        title="Nội dung website"
        description="Quản lý nội dung hiển thị trên trang chủ, footer, CTA và các khu vực tĩnh."
      />

      <AdminPlaceholderPanel
        icon={<FileText className="h-5 w-5" />}
        title="Phân hệ nội dung website đang được chuẩn bị"
        description="Khi triển khai CRUD, dữ liệu nên lưu theo key/value có validate schema để tránh làm vỡ giao diện public."
        items={['Trang chủ', 'Footer và CTA', 'Khối nội dung tĩnh']}
      />
    </AdminSection>
  );
}
