import { AlertCircle } from 'lucide-react';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSection } from '@/components/admin/AdminSection';
import { requireAdminAuth } from '@/lib/services/admin/auth';
import { ANY_ADMIN_ROLE } from '@/lib/services/admin/permissions';
import { getAdminSpecTemplates } from '@/lib/services/admin/product-spec-templates';
import { TemplatesAdminClient } from '@/components/admin/TemplatesAdminClient';

export const dynamic = 'force-dynamic';

export default async function ProductSpecTemplatesPage() {
  const adminUser = await requireAdminAuth(ANY_ADMIN_ROLE);

  let data: { templates: any[]; fields: any[] } = { templates: [], fields: [] };
  let error: string | null = null;

  try {
    data = await getAdminSpecTemplates();
  } catch (err) {
    error = err instanceof Error ? err.message : 'Không thể tải cấu hình mẫu thông số kỹ thuật.';
  }

  return (
    <AdminSection>
      <AdminPageHeader
        title="Mẫu thông số kỹ thuật"
        description="Quản lý cấu trúc mẫu thông số kỹ thuật sản phẩm và các trường thuộc tính tương ứng."
      />

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-[#F2C5C7] bg-[#FFF5F5] p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#E31E24]" />
          <div>
            <p className="font-medium text-[#7A271A]">Không thể tải mẫu thông số</p>
            <p className="mt-1 text-sm text-[#B42318]">{error}</p>
          </div>
        </div>
      ) : (
        <TemplatesAdminClient
          initialTemplates={data.templates}
          initialFields={data.fields}
          adminUser={adminUser}
        />
      )}
    </AdminSection>
  );
}
