import { Phone, MessageCircle, ImageIcon, ListOrdered } from 'lucide-react';

import { AdminModulePreview } from '@/components/admin/AdminModulePreview';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSection } from '@/components/admin/AdminSection';

export default function SalesContactsPage() {
  return (
    <AdminSection>
      <AdminPageHeader
        title="Liên hệ bán hàng"
        description="Quản lý hotline, Zalo và nhân sự tư vấn hiển thị trên website."
      />

      <AdminModulePreview
        intro="Module quản lý đầu mối bán hàng giúp cập nhật thông tin liên hệ mà khách nhìn thấy trên trang catalog."
        features={[
          { icon: <Phone className="h-5 w-5" />, title: 'Hotline & số điện thoại', description: 'Thêm, sửa và sắp xếp các số hotline tư vấn theo từng khu vực.' },
          { icon: <MessageCircle className="h-5 w-5" />, title: 'Tài khoản Zalo', description: 'Gắn link Zalo cho từng nhân viên kinh doanh để khách liên hệ nhanh.' },
          { icon: <ImageIcon className="h-5 w-5" />, title: 'Ảnh đại diện nhân sự', description: 'Tải ảnh đại diện và vai trò để tăng độ tin cậy với khách hàng.' },
          { icon: <ListOrdered className="h-5 w-5" />, title: 'Thứ tự & trạng thái', description: 'Bật/tắt và sắp xếp thứ tự ưu tiên hiển thị từng đầu mối liên hệ.' },
        ]}
        note="Bảng sales_contacts đã sẵn sàng; phần CRUD và upload ảnh sẽ được bổ sung ở phase Storage."
      />
    </AdminSection>
  );
}
