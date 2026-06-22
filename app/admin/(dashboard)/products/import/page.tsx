import { getActiveSpecTemplates } from '@/lib/services/admin/product-spec-templates';
import { AdminSection } from '@/components/admin/AdminSection';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ImportClient } from './ImportClient';

export const dynamic = 'force-dynamic';

export default async function ImportPage() {
  const specTemplates = await getActiveSpecTemplates();

  return (
    <AdminSection>
      <AdminPageHeader
        title="Nhập sản phẩm từ Excel"
        description="Nhập sỉ danh sách sản phẩm theo mẫu thông số kỹ thuật chuẩn."
      />
      <ImportClient specTemplates={specTemplates} />
    </AdminSection>
  );
}
