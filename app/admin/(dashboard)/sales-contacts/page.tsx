import { AlertCircle, Phone, PhoneCall, UserRound, Eye, EyeOff } from 'lucide-react';

import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSection } from '@/components/admin/AdminSection';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { SalesContactFormDialog } from '@/components/admin/SalesContactFormDialog';
import { SalesContactsTable } from '@/components/admin/SalesContactsTable';
import { getAdminSalesContacts } from '@/lib/services/admin/sales-contacts';

export const dynamic = 'force-dynamic';

export default async function SalesContactsPage() {
  const { data: contacts, error } = await getAdminSalesContacts();
  const safeContacts = contacts || [];
  const activeCount = safeContacts.filter((contact) => contact.is_active).length;
  const hiddenCount = safeContacts.length - activeCount;
  const zaloReadyCount = safeContacts.filter((contact) => Boolean(contact.zalo)).length;

  return (
    <AdminSection>
      <AdminPageHeader
        title="Liên hệ bán hàng"
        description="Quản lý hotline, Zalo và nhân sự tư vấn hiển thị trên website."
        action={<SalesContactFormDialog />}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Tổng liên hệ"
          value={safeContacts.length}
          icon={<PhoneCall className="h-4 w-4" />}
          hint="Toàn bộ nhân sự tư vấn"
        />
        <AdminStatCard
          label="Đang hiển thị"
          value={activeCount}
          icon={<Eye className="h-4 w-4" />}
          hint="Xuất hiện trên website"
        />
        <AdminStatCard
          label="Đang ẩn"
          value={hiddenCount}
          icon={<EyeOff className="h-4 w-4" />}
          hint="Tạm ngưng công khai"
          tone="accent"
        />
        <AdminStatCard
          label="Có Zalo"
          value={zaloReadyCount}
          icon={<UserRound className="h-4 w-4" />}
          hint="Sẵn sàng tư vấn nhanh"
        />
      </div>

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-[#F2C5C7] bg-[#FFF5F5] p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#E31E24]" />
          <div>
            <p className="font-medium text-[#7A271A]">Không thể tải liên hệ bán hàng</p>
            <p className="mt-1 text-sm text-[#B42318]">{error}</p>
          </div>
        </div>
      ) : null}

      {!error && safeContacts.length === 0 ? (
        <AdminEmptyState
          icon={<Phone className="h-6 w-6" />}
          title="Chưa có liên hệ bán hàng nào"
          description="Thêm nhân sự tư vấn đầu tiên để hiển thị hotline và Zalo trên website."
        />
      ) : null}

      {safeContacts.length > 0 ? <SalesContactsTable contacts={safeContacts} /> : null}
    </AdminSection>
  );
}
