import { Info, ShieldCheck, UserCog } from 'lucide-react';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSection } from '@/components/admin/AdminSection';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { AdminStatusChip } from '@/components/admin/AdminStatusChip';
import { AdminTableShell, AdminTh } from '@/components/admin/AdminTableShell';
import { getAdminUsers } from '@/lib/services/admin/admin-users';
import { ADMIN_ROLE_LABELS } from '@/lib/types/admin';

export default async function AdminUsersPage() {
  const { data: adminUsers, error } = await getAdminUsers();
  const activeCount = adminUsers.filter((user) => user.is_active).length;

  return (
    <AdminSection>
      <AdminPageHeader
        title="Người dùng quản trị"
        description="Nền tảng quản trị nhân sự đã sẵn sàng; CRUD tài khoản sẽ được mở ở phase riêng."
      />

      {error ? (
        <div className="rounded-2xl border border-[#F2C5C7] bg-[#FFF5F5] p-4 text-sm text-[#B42318]">
          Không thể tải danh sách quản trị viên: {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminStatCard label="Tài khoản hiện có" value={adminUsers.length} icon={<UserCog className="h-[18px] w-[18px]" />} hint={`${activeCount} đang hoạt động`} />
        <AdminStatCard label="Phân quyền" value={4} icon={<ShieldCheck className="h-[18px] w-[18px]" />} hint="Super Admin · Admin · Editor · Viewer" />
        <AdminStatCard label="Trạng thái phase" value="Sẵn sàng" icon={<Info className="h-[18px] w-[18px]" />} hint="Foundation đã hoàn thiện" />
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-[15px] font-semibold text-[#1B3A6B]">Danh sách tài khoản</h2>
          <p className="text-xs text-slate-500">Tài khoản quản trị đang có trong hệ thống</p>
        </div>
        <AdminTableShell
          minWidth={620}
          head={
            <>
              <AdminTh>Email</AdminTh>
              <AdminTh>Vai trò</AdminTh>
              <AdminTh>Trạng thái</AdminTh>
            </>
          }
        >
          {adminUsers.length > 0 ? (
            adminUsers.map((adminUser) => (
              <tr key={adminUser.id} className="transition-colors hover:bg-[#F8FAFC]">
                <td className="px-5 py-3 text-sm font-medium text-slate-900">{adminUser.email}</td>
                <td className="px-5 py-3 text-sm text-slate-600">{ADMIN_ROLE_LABELS[adminUser.role]}</td>
                <td className="px-5 py-3 text-sm">
                  <AdminStatusChip tone={adminUser.is_active ? 'success' : 'alert'} dot>
                    {adminUser.is_active ? 'Đang hoạt động' : 'Đã khóa'}
                  </AdminStatusChip>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="px-5 py-10 text-center text-sm text-slate-500">
                Chưa có dữ liệu hoặc chưa bootstrap tài khoản quản trị đầu tiên.
              </td>
            </tr>
          )}
        </AdminTableShell>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <h2 className="text-sm font-semibold text-amber-800">Ghi chú triển khai nhân sự</h2>
          <p className="mt-1 text-sm leading-relaxed text-amber-700">
            Tạo tài khoản thật cần server action hoặc route handler chạy với Supabase service role để
            tạo <code className="font-mono text-xs">auth.users</code>, gửi luồng đặt mật khẩu, rồi mới
            ghi record vào <code className="font-mono text-xs">admin_users</code>.
          </p>
        </div>
      </div>
    </AdminSection>
  );
}
