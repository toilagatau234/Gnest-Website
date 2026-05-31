import { Info, ShieldCheck, UserCog, UserCheck, Key } from 'lucide-react';

import { getAdminUsers } from '@/lib/services/admin/admin-users';
import { ADMIN_ROLE_LABELS } from '@/lib/types/admin';
import { FormattedDate } from '@/components/admin/FormattedDate';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const { data: adminUsers, error } = await getAdminUsers();
  const safeUsers = adminUsers ?? [];
  const activeCount = safeUsers.filter((user) => user.is_active).length;

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

        <button 
          onClick={undefined}
          disabled
          className="flex cursor-not-allowed select-none items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-bold text-slate-400"
        >
          <Key className="w-4 h-4" /> Cấp quyền mới
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-[#FFF5F5] p-4 text-xs text-[#B42318] font-medium">
          Không thể tải danh sách quản trị viên: {error}
        </div>
      ) : null}

      {/* KPI Stats widgets grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex min-w-0 items-center gap-4 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <div className="p-3 bg-[#1B3A6B]/5 text-[#1B3A6B] rounded-xl shrink-0">
            <UserCog className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">Tài khoản hiện có</p>
            <h3 className="text-2xl font-bold text-[#1B3A6B] mt-0.5">{safeUsers.length}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">{activeCount} tài khoản hoạt động</p>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-4 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">Vai trò phân nhiệm</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">4 Phân hệ</h3>
            <p className="text-[10px] text-emerald-600 mt-0.5 font-medium">Super Admin · Admin · Editor · Viewer</p>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-4 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono">Trạng thái bảo mật</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">Sẵn Sàng</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Quyền truy cập mã hóa TLS 1.3</p>
          </div>
        </div>
      </div>

      {/* Main Table card */}
      <div className="space-y-4 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-6">
        <div>
          <h3 className="font-bold text-[#1B3A6B] text-sm">Danh Sách Quản Trị Viên</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Danh sách tài khoản có quyền đăng nhập vào CMS</p>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
          <table className="w-full text-xs text-left min-w-[620px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[9px] border-b border-slate-200">
                <th className="p-3.5">Email quản trị</th>
                <th className="p-3.5">Vai trò hệ thống</th>
                <th className="p-3.5">Độ ưu tiên bảo mật</th>
                <th className="p-3.5">Trạng thái khóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {safeUsers.length > 0 ? (
                safeUsers.map((user, idx) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3.5 font-bold text-slate-800 text-[13px]">{user.email}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-blue-50 text-[#1B3A6B] border border-blue-100 rounded-md font-bold uppercase text-[9px]">
                        {ADMIN_ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500 font-mono text-[10px]">
                      {user.role === 'super_admin' ? 'Root Level 0' : 'Editor Level 1'}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 text-[10px] rounded-md font-bold ${
                        user.is_active 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-rose-50 text-[#E31E24] border border-rose-200'
                      }`}>
                        {user.is_active ? 'Đang hoạt động' : 'Đã tạm khóa'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-slate-400">
                    Chưa có quản trị viên nào được thiết lập.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Triển khai note block */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-5 leading-relaxed">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 animate-pulse" />
        <div className="text-xs">
          <h2 className="font-bold text-amber-800 uppercase tracking-wider font-mono text-[10px]">Lưu ý kỹ thuật phân bổ nhân sự</h2>
          <p className="mt-1 text-amber-700 font-normal">
            Hệ thống CRUD tài khoản quản trị yêu cầu quyền truy xuất đặc quyền cao <code className="font-mono bg-white px-1 py-0.5 border border-amber-200/50 rounded text-[10px]">auth.users</code> của Supabase Service Role để khởi tạo danh sách và gửi mail kích hoạt bảo mật. Tính năng này được hạn chế trong môi trường local để bảo mật tuyệt đối Token API.
          </p>
        </div>
      </div>

    </div>
  );
}
