<<<<<<< HEAD
import { FileText } from 'lucide-react';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminPlaceholderPanel } from '@/components/admin/AdminPlaceholderPanel';
=======
import { Home, PhoneCall, Megaphone, PanelBottom } from 'lucide-react';

import { AdminModulePreview } from '@/components/admin/AdminModulePreview';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
>>>>>>> 3b38c8f142158fddd39741ee7b80a71a7f60a0d6
import { AdminSection } from '@/components/admin/AdminSection';

export default function SiteContentPage() {
  return (
    <AdminSection>
      <AdminPageHeader
        title="Nội dung website"
<<<<<<< HEAD
        description="Quản lý nội dung hiển thị trên trang chủ, footer, CTA và các khu vực tĩnh."
      />

      <AdminPlaceholderPanel
        icon={<FileText className="h-5 w-5" />}
        title="Phân hệ nội dung website đang được chuẩn bị"
        description="Khi triển khai CRUD, dữ liệu nên lưu theo key/value có validate schema để tránh làm vỡ giao diện public."
        items={['Trang chủ', 'Footer và CTA', 'Khối nội dung tĩnh']}
=======
        description="Quản lý nội dung động hiển thị trên trang công khai."
      />

      <AdminModulePreview
        intro="Module nội dung website cho phép chỉnh sửa các khối nội dung mà không cần can thiệp mã nguồn."
        features={[
          { icon: <Home className="h-5 w-5" />, title: 'Khối trang chủ', description: 'Cập nhật banner, tiêu đề và các section nổi bật trên trang chủ.' },
          { icon: <PhoneCall className="h-5 w-5" />, title: 'Khối liên hệ & CTA', description: 'Chỉnh sửa lời kêu gọi liên hệ Zalo/hotline trên toàn website.' },
          { icon: <Megaphone className="h-5 w-5" />, title: 'Thông báo', description: 'Đăng thông báo hoặc khuyến mãi ngắn hạn cho khách hàng.' },
          { icon: <PanelBottom className="h-5 w-5" />, title: 'Footer', description: 'Cập nhật thông tin doanh nghiệp và liên kết ở chân trang.' },
        ]}
        note="Bảng site_contents lưu nội dung dạng key/value JSON; trình soạn thảo sẽ được bổ sung ở phase riêng."
>>>>>>> 3b38c8f142158fddd39741ee7b80a71a7f60a0d6
      />
    </AdminSection>
  );
}
