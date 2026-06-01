'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { Search, UserCog, Check, ShieldCheck, ShieldAlert } from 'lucide-react';

import { AdminUserRowActions } from '@/components/admin/AdminUserRowActions';
import type { AdminUserListItem } from '@/lib/services/admin/admin-users';
import { ADMIN_ROLE_LABELS } from '@/lib/types/admin';
import type { AdminRole } from '@/lib/types/database';
import { FormattedDate } from '@/components/admin/FormattedDate';

interface AdminUsersTableProps {
  users: AdminUserListItem[];
  currentAdminId: string;
  currentUserRole: AdminRole;
}

export function AdminUsersTable({ users, currentAdminId, currentUserRole }: AdminUsersTableProps) {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const deferredQuery = useDeferredValue(query);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // 1. Search Query
      const normalizedQuery = deferredQuery.trim().toLowerCase();
      const matchesSearch = !normalizedQuery || user.email.toLowerCase().includes(normalizedQuery);

      // 2. Role Filter
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;

      // 3. Status Filter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && user.is_active) ||
        (statusFilter === 'suspended' && !user.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, deferredQuery, roleFilter, statusFilter]);

  const roleColors: Record<AdminRole, string> = {
    super_admin: 'bg-rose-50 text-[#E31E24] border border-rose-100',
    admin: 'bg-blue-50 text-[#1B3A6B] border border-blue-100',
    editor: 'bg-amber-50 text-amber-700 border border-amber-100',
    viewer: 'bg-slate-50 text-slate-600 border border-slate-200',
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Controls */}
      <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <input
            type="search"
            placeholder="Tìm kiếm tài khoản quản trị theo email..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] rounded-lg pl-9 pr-3 py-2 text-slate-800 text-xs"
          />
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] rounded-lg px-2.5 py-1.5 text-slate-700 text-xs font-semibold"
          >
            <option value="all">Tất cả vai trò</option>
            {Object.entries(ADMIN_ROLE_LABELS).map(([role, label]) => (
              <option key={role} value={role}>
                {label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] rounded-lg px-2.5 py-1.5 text-slate-700 text-xs font-semibold"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="suspended">Đã tạm khóa</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-6 space-y-4">
        <div>
          <h3 className="font-extrabold text-[#1B3A6B] text-sm">Danh Sách Nhân Sự</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Danh sách các tài khoản có quyền truy cập vào khu vực CMS</p>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
          <table className="w-full text-xs text-left min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[9px] border-b border-slate-200">
                <th className="p-3.5">Email quản trị</th>
                <th className="p-3.5">Vai trò hệ thống</th>
                <th className="p-3.5">Cấp độ bảo mật</th>
                <th className="p-3.5">Trạng thái khóa</th>
                <th className="p-3.5">Ngày khởi tạo</th>
                <th className="p-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const isSelf = user.id === currentAdminId;
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3.5 text-[13px]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{user.email}</span>
                          {isSelf ? (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold text-[9px] uppercase font-sans shrink-0 select-none">
                              Bạn
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[9px] ${roleColors[user.role]}`}>
                          {ADMIN_ROLE_LABELS[user.role]}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono text-[10px]">
                        {user.role === 'super_admin' ? (
                          <span className="flex items-center gap-1 text-[#E31E24]">
                            <ShieldAlert className="w-3.5 h-3.5 shrink-0" /> Root Level 0
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[#1B3A6B]">
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> Editor Level 1
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 text-[10px] rounded-md font-bold ${
                            user.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-[#E31E24] border border-rose-200'
                          }`}
                        >
                          {user.is_active ? 'Đang hoạt động' : 'Đã tạm khóa'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400 font-medium">
                        {user.created_at ? <FormattedDate date={user.created_at} /> : '-'}
                      </td>
                      <td className="p-3.5 text-right">
                        <AdminUserRowActions
                          user={user}
                          currentAdminId={currentAdminId}
                          currentUserRole={currentUserRole}
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <UserCog className="w-10 h-10 text-slate-300" />
                      <p className="text-xs font-semibold text-slate-500">Không tìm thấy tài khoản quản trị nào khớp với bộ lọc.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-[#E5E7EF] bg-[#F7F9FB] p-3.5 text-[11px] font-medium text-[#646464] sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />
          Dữ liệu quyền và tài khoản được bảo mật và đồng bộ từ Supabase Auth Admin.
        </p>
        <span className="font-bold text-[#1B3A6B]">{filteredUsers.length} tài khoản</span>
      </div>
    </div>
  );
}
