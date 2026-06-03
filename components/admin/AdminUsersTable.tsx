'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { AlertTriangle, Check, KeyRound, Search, ShieldAlert, ShieldCheck, UserCog } from 'lucide-react';

import { AdminUserRowActions } from '@/components/admin/AdminUserRowActions';
import { FormattedDate } from '@/components/admin/FormattedDate';
import type { AdminUserListItem } from '@/lib/services/admin/admin-users';
import { ADMIN_ROLE_LABELS } from '@/lib/types/admin';
import type { AdminRole } from '@/lib/types/database';

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
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return users.filter((user) => {
      const haystack = [
        user.email,
        user.display_name ?? '',
        user.username ?? '',
        user.contact_email ?? '',
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = !normalizedQuery || haystack.includes(normalizedQuery);
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && user.is_active) ||
        (statusFilter === 'suspended' && !user.is_active) ||
        (statusFilter === 'reset' && user.force_password_change);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, deferredQuery, roleFilter, statusFilter]);

  const roleColors: Record<AdminRole, string> = {
    super_admin: 'border border-rose-100 bg-rose-50 text-[#E31E24]',
    admin: 'border border-blue-100 bg-blue-50 text-[#1B3A6B]',
    editor: 'border border-amber-100 bg-amber-50 text-amber-700',
    viewer: 'border border-slate-200 bg-slate-50 text-slate-600',
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3.5 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <input
            type="search"
            placeholder="Tim theo ten, username, email dang nhap..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
          />
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
          >
            <option value="all">Tat ca vai tro</option>
            {Object.entries(ADMIN_ROLE_LABELS).map(([role, label]) => (
              <option key={role} value={role}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
          >
            <option value="all">Tat ca trang thai</option>
            <option value="active">Dang hoat dong</option>
            <option value="suspended">Da tam khoa</option>
            <option value="reset">Cho doi mat khau</option>
          </select>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-6">
        <div>
          <h3 className="text-sm font-extrabold text-[#1B3A6B]">Danh sach nhan su quan tri</h3>
          <p className="mt-0.5 text-[10px] text-slate-400">
            Gom email dang nhap noi bo, vai tro, trang thai kich hoat va co doi mat khau lan dau.
          </p>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
          <table className="min-w-[980px] w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                <th className="p-3.5">Tai khoan</th>
                <th className="p-3.5">Vai tro</th>
                <th className="p-3.5">Bao mat</th>
                <th className="p-3.5">Trang thai</th>
                <th className="p-3.5">Ngay tao</th>
                <th className="p-3.5 text-right">Thao tac</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const isSelf = user.id === currentAdminId;

                  return (
                    <tr key={user.id} className="transition-colors hover:bg-slate-50/50">
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">
                              {user.display_name || user.username || user.email}
                            </span>
                            {isSelf ? (
                              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-blue-800">
                                Ban
                              </span>
                            ) : null}
                            {user.force_password_change ? (
                              <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-700">
                                <KeyRound className="h-2.5 w-2.5" />
                                Doi mat khau
                              </span>
                            ) : null}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {user.username ? <span>@{user.username}</span> : null}
                            {user.username && user.email ? <span className="mx-1.5 text-slate-300">/</span> : null}
                            <span className="font-medium">{user.email}</span>
                          </div>
                          {user.contact_email ? (
                            <p className="text-[10px] text-slate-400">Lien he: {user.contact_email}</p>
                          ) : null}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase ${roleColors[user.role]}`}>
                          {ADMIN_ROLE_LABELS[user.role]}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {user.role === 'super_admin' ? (
                          <span className="flex items-center gap-1 font-mono text-[10px] text-[#E31E24]">
                            <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                            Root level 0
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 font-mono text-[10px] text-[#1B3A6B]">
                            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                            Scoped role
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1.5">
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                              user.is_active
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-rose-200 bg-rose-50 text-[#E31E24]'
                            }`}
                          >
                            {user.is_active ? 'Dang hoat dong' : 'Da tam khoa'}
                          </span>
                          {user.force_password_change ? (
                            <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                              Chua doi mat khau
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-400">
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
                      <UserCog className="h-10 w-10 text-slate-300" />
                      <p className="text-xs font-semibold text-slate-500">
                        Khong tim thay tai khoan quan tri nao khop voi bo loc.
                      </p>
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
          <Check className="h-3.5 w-3.5 text-emerald-600" />
          Tai khoan noi bo duoc dong bo voi Supabase Auth va buoc doi mat khau o lan dang nhap dau.
        </p>
        <span className="font-bold text-[#1B3A6B]">{filteredUsers.length} tai khoan</span>
      </div>

      {users.some((user) => user.force_password_change) ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="leading-relaxed">
            Tai khoan co nhan `Doi mat khau` moi chi nhan mat khau tam. Cho den khi nguoi dung tu cap nhat
            mat khau, dashboard se chuyen ho sang man hinh doi mat khau bat buoc.
          </p>
        </div>
      ) : null}
    </div>
  );
}
