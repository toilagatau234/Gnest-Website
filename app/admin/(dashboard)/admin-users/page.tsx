import { AlertCircle, BadgeCheck, ShieldCheck, UserCog } from 'lucide-react';

import { AdminCard } from '@/components/admin/AdminCard';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSection } from '@/components/admin/AdminSection';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { AdminStatusChip } from '@/components/admin/AdminStatusChip';
import { AdminTableShell, AdminTh } from '@/components/admin/AdminTableShell';
import { getAdminUsers } from '@/lib/services/admin/admin-users';
import { ADMIN_ROLE_LABELS } from '@/lib/types/admin';

export default async function AdminUsersPage() {
  const { data: adminUsers, error } = await getAdminUsers();
  const activeCount = adminUsers.filter((adminUser) => adminUser.is_active).length;

  return (
    <AdminSection>
      <AdminPageHeader
        title="Người dùng quản trị"
        description="Nền tảng quản trị nhân sự đã được chuẩn bị, chưa mở CRUD thực tế ở phase này."
      />

      {error ? (
        <div className="rounded-xl border border-[#F2C5C7] bg-[#FFF5F5] p-4 text-sm text-[#B42318]">
          Không thể tải danh sách quản trị viên: {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <AdminStatCard
          title="Tài khoản hiện có"
          value={adminUsers.length}
          icon={<UserCog className="h-5 w-5" />}
          description={`${activeCount} tài khoản đang hoạt động.`}
        />
        <AdminStatCard
          title="Role hỗ trợ"
          value="4"
          icon={<ShieldCheck className="h-5 w-5" />}
          description="Super Admin, Admin, Editor và Viewer."
        />
        <AdminStatCard
          title="Trạng thái phase"
          value="Sẵn sàng"
          icon={<BadgeCheck className="h-5 w-5" />}
          description="Foundation dữ liệu và phân quyền đã có."
        />
      </div>

      <AdminCard title="Ghi chú triển khai" subtitle="CRUD nhân sự cần luồng server-side riêng để không lộ service role.">
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm leading-6 text-amber-800">
            Tạo staff thật cần server action hoặc route handler dùng Supabase service role để tạo auth.users,
            gửi luồng đặt mật khẩu, rồi mới ghi record vào admin_users.
          </p>
        </div>
      </AdminCard>

      <AdminTableShell
        minWidth={720}
        head={
          <>
            <AdminTh>Email</AdminTh>
            <AdminTh>Role</AdminTh>
            <AdminTh>Trạng thái</AdminTh>
          </>
        }
      >
        {adminUsers.length > 0 ? (
          adminUsers.map((adminUser) => (
            <tr key={adminUser.id} className="transition-colors hover:bg-[#F8FAFC]">
              <td className="px-5 py-4 text-sm font-medium text-slate-900">{adminUser.email}</td>
              <td className="px-5 py-4 text-sm text-slate-600">{ADMIN_ROLE_LABELS[adminUser.role]}</td>
              <td className="px-5 py-4 text-sm">
                <AdminStatusChip tone={adminUser.is_active ? 'success' : 'neutral'}>
                  {adminUser.is_active ? 'Đang hoạt động' : 'Đã khóa'}
                </AdminStatusChip>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={3} className="px-5 py-10 text-center text-sm text-slate-500">
              Chưa có dữ liệu hiển thị hoặc chưa bootstrap tài khoản quản trị đầu tiên.
            </td>
          </tr>
        )}
      </AdminTableShell>
    </AdminSection>
  );
}
