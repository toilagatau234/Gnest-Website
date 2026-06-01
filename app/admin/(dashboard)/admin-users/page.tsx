import { Info, ShieldCheck, UserCog, UserCheck, ShieldAlert } from 'lucide-react';

import { getAdminUsers } from '@/lib/services/admin/admin-users';
import { getAdminSessionState } from '@/lib/services/admin/auth';
import { AdminUsersTable } from '@/components/admin/AdminUsersTable';
import { AdminUserInviteDialog } from '@/components/admin/AdminUserInviteDialog';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const { data: adminUsers, error } = await getAdminUsers();
  const session = await getAdminSessionState();

  const safeUsers = adminUsers ?? [];
  const totalCount = safeUsers.length;
  const activeCount = safeUsers.filter((user) => user.is_active).length;
  const superAdminCount = safeUsers.filter((user) => user.role === 'super_admin' && user.is_active).length;
  const suspendedCount = safeUsers.filter((user) => !user.is_active).length;

  const currentAdminId = session.adminUser?.id ?? '';
  const currentUserRole = session.adminUser?.role ?? 'viewer';

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm lg:flex-row lg:items-center">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-[#1B3A6B]">Tài Khoản Quản Trị Hệ Thống</h2>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý đội ngũ nhân sự, biên tập viên và phân quyền bảo mật truy cập bảng điều khiển CMS
          </p>
        </div>

        {currentUserRole === 'super_admin' ? (
          <AdminUserInviteDialog />
        ) : (
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-400 select-none">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Chỉ dành cho Super Admin
          </div>
        )}
      </div>

      {error ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-[#FFF5F5] p-4 text-xs text-[#B42318] font-medium leading-relaxed">
          Không thể tải danh sách quản trị viên: {error}
        </div>
      ) : null}

      {/* KPI Stats widgets grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {/* Widget 1: Total accounts */}
        <div className="flex min-w-0 items-center gap-4 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <div className="p-3 bg-[#1B3A6B]/5 text-[#1B3A6B] rounded-xl shrink-0">
            <UserCog className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">Tài khoản quản trị</p>
            <h3 className="text-2xl font-bold text-[#1B3A6B] mt-0.5">{totalCount}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Mọi cấp độ phân vai</p>
          </div>
        </div>

        {/* Widget 2: Active accounts */}
        <div className="flex min-w-0 items-center gap-4 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">Đang hoạt động</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{activeCount}</h3>
            <p className="text-[10px] text-emerald-600 mt-0.5 font-medium">Sẵn sàng truy cập</p>
          </div>
        </div>

        {/* Widget 3: Super admins */}
        <div className="flex min-w-0 items-center gap-4 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">Super Admin</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{superAdminCount}</h3>
            <p className="text-[10px] text-rose-600 mt-0.5 font-medium">Đặc quyền cấp 0</p>
          </div>
        </div>

        {/* Widget 4: Locked accounts */}
        <div className="flex min-w-0 items-center gap-4 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <div className="p-3 bg-slate-50 text-slate-500 rounded-xl shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">Đã tạm khóa</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{suspendedCount}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Đình chỉ quyền truy cập</p>
          </div>
        </div>
      </div>

      {/* Main Datatable View */}
      <AdminUsersTable
        users={safeUsers}
        currentAdminId={currentAdminId}
        currentUserRole={currentUserRole}
      />

      {/* Security note block */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/20 p-5 leading-relaxed">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#1B3A6B] animate-pulse" />
        <div className="text-xs">
          <h2 className="font-bold text-[#1B3A6B] uppercase tracking-wider font-mono text-[10px]">Hướng dẫn an toàn thông tin quản trị</h2>
          <p className="mt-1 text-slate-600 font-normal leading-relaxed">
            Hệ thống phân quyền quản trị sử dụng giao thức bảo mật lớp cao nhất kết nối trực tiếp với dịch vụ xác thực Supabase Auth Admin. Để đảm bảo vận hành liên tục và tránh lockout ngoài ý muốn, tài khoản Super Admin hoạt động duy nhất của hệ thống sẽ bị khóa cứng quyền sửa đổi trạng thái, vai trò cũng như không thể tự khóa/xóa chính mình.
          </p>
        </div>
      </div>

    </div>
  );
}
