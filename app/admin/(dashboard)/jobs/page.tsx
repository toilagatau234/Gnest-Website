import { Briefcase, MapPin, Banknote, ToggleRight } from 'lucide-react';

import { AdminModulePreview } from '@/components/admin/AdminModulePreview';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSection } from '@/components/admin/AdminSection';

export default function JobsPage() {
  return (
    <AdminSection>
      <AdminPageHeader
        title="Tuyển dụng"
        description="Quản lý các tin tuyển dụng hiển thị trên trang /tuyen-dung."
      />

      <AdminModulePreview
        intro="Module tuyển dụng cho phép đăng và cập nhật các vị trí làm việc tại xưởng và văn phòng."
        features={[
          { icon: <Briefcase className="h-5 w-5" />, title: 'Tin tuyển dụng', description: 'Tạo tiêu đề, mô tả công việc và yêu cầu cho từng vị trí.' },
          { icon: <MapPin className="h-5 w-5" />, title: 'Địa điểm làm việc', description: 'Gắn nơi làm việc cụ thể cho mỗi tin tuyển dụng.' },
          { icon: <Banknote className="h-5 w-5" />, title: 'Mức lương', description: 'Hiển thị khoảng lương tham khảo để ứng viên dễ cân nhắc.' },
          { icon: <ToggleRight className="h-5 w-5" />, title: 'Thứ tự & trạng thái', description: 'Bật/tắt và sắp xếp các tin đang tuyển trên website.' },
        ]}
        note="Bảng job_vacancies đã sẵn sàng; phần CRUD sẽ được bổ sung ở phase riêng."
      />
    </AdminSection>
  );
}
