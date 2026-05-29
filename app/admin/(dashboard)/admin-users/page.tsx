import { AlertCircle, BadgeCheck, ShieldCheck, UserCog } from 'lucide-react';

import { getAdminUsers } from '@/lib/services/admin/admin-users';
import { ADMIN_ROLE_LABELS } from '@/lib/types/admin';

export default async function AdminUsersPage() {
  const { data: adminUsers, error } = await getAdminUsers();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1B3A6B]">Người dùng quản trị</h1>
        <p className="mt-2 text-slate-600">
          Nền tảng quản trị nhân sự đã được chuẩn bị, chưa mở CRUD thực tế ở phase này.
        </p>
      </div>

      {error ? (
        <div className="mb-6 rounded-2xl border border-[#F2C5C7] bg-[#FFF5F5] p-4 text-sm text-[#B42318]">
          Không thể tải danh sách quản trị viên: {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-[#D7E0EC] bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#FFF5F5] p-3 text-[#E31E24]">
              <UserCog className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Tài khoản hiện có</p>
              <p className="text-2xl font-bold text-[#1B3A6B]">{adminUsers.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#D7E0EC] bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#F4F7FB] p-3 text-[#1B3A6B]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Role hỗ trợ</p>
              <p className="text-lg font-bold text-[#1B3A6B]">Super Admin / Admin / Editor / Viewer</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#D7E0EC] bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#FFF5F5] p-3 text-[#E31E24]">
              <BadgeCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Trạng thái phase</p>
              <p className="text-lg font-bold text-[#1B3A6B]">Foundation đã sẵn sàng</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[#D7E0EC] bg-white p-6">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-xl bg-[#FFF8E8] p-2.5 text-[#B54708]">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1B3A6B]">TODO triển khai nhân sự thật</h2>
            <p className="mt-1 text-sm text-slate-600">
              Tạo staff thật cần server action hoặc route handler dùng Supabase service role để tạo
              `auth.users`, gửi luồng đặt mật khẩu, rồi mới ghi record vào `admin_users`.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#EEF2F6]">
          <table className="w-full">
            <thead className="bg-[#F4F7FB]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#1B3A6B]">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#1B3A6B]">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#1B3A6B]">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2F6]">
              {adminUsers.length > 0 ? (
                adminUsers.map((adminUser) => (
                  <tr key={adminUser.id}>
                    <td className="px-4 py-3 text-sm text-slate-700">{adminUser.email}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {ADMIN_ROLE_LABELS[adminUser.role]}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          adminUser.is_active
                            ? 'bg-[#ECFDF3] text-[#027A48]'
                            : 'bg-[#FFF5F5] text-[#B42318]'
                        }`}
                      >
                        {adminUser.is_active ? 'Đang hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">
                    Chưa có dữ liệu hiển thị hoặc chưa bootstrap tài khoản quản trị đầu tiên.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
