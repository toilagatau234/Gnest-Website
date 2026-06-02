'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import type { AdminUserListItem } from '@/lib/services/admin/admin-users';

interface AuditLogsFilterBarProps {
  adminUsers: AdminUserListItem[];
  currentFilters: {
    q?: string;
    action?: string;
    entity?: string;
    actor?: string;
    from?: string;
    to?: string;
  };
}

const ACTION_OPTIONS = [
  { value: '', label: 'Tất cả hành động' },
  { value: 'create', label: 'Tạo mới' },
  { value: 'update', label: 'Cập nhật' },
  { value: 'delete', label: 'Xóa' },
  { value: 'activate', label: 'Hiển thị' },
  { value: 'deactivate', label: 'Mở ẩn' },
  { value: 'status_update', label: 'Cập nhật trạng thái' },
  { value: 'assign', label: 'Phân công' },
  { value: 'note_add', label: 'Thêm ghi chú' },
];

const ENTITY_OPTIONS = [
  { value: '', label: 'Tất cả phân hệ' },
  { value: 'products', label: 'Sản phẩm' },
  { value: 'categories', label: 'Danh mục' },
  { value: 'inquiries', label: 'Yêu cầu báo giá sỉ' },
  { value: 'admin_users', label: 'Quản trị viên' },
];

export function AuditLogsFilterBar({ adminUsers, currentFilters }: AuditLogsFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useState(currentFilters.q ?? '');
  const [action, setAction] = useState(currentFilters.action ?? '');
  const [entity, setEntity] = useState(currentFilters.entity ?? '');
  const [actor, setActor] = useState(currentFilters.actor ?? '');
  const [from, setFrom] = useState(currentFilters.from ?? '');
  const [to, setTo] = useState(currentFilters.to ?? '');

  const updateFilters = (updates: Record<string, string>) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', '1'); // Reset to page 1 on filter update

      const merged = {
        q,
        action,
        entity,
        actor,
        from,
        to,
        ...updates,
      };

      Object.entries(merged).forEach(([key, val]) => {
        if (val) {
          params.set(key, val);
        } else {
          params.delete(key);
        }
      });

      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q });
  };

  const handleReset = () => {
    setQ('');
    setAction('');
    setEntity('');
    setActor('');
    setFrom('');
    setTo('');
    startTransition(() => {
      router.push(pathname);
    });
  };

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm space-y-3">
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="admin-input pl-9 text-xs py-2"
            placeholder="Tìm theo hành động hoặc phân hệ..."
            disabled={isPending}
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="admin-button-primary px-4 py-2 h-9 text-xs flex-shrink-0"
        >
          Tìm kiếm
        </button>
      </form>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6 items-end">
        <div>
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
            Hành động
          </label>
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              updateFilters({ action: e.target.value });
            }}
            disabled={isPending}
            className="admin-select text-xs h-9 py-1"
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
            Phân hệ
          </label>
          <select
            value={entity}
            onChange={(e) => {
              setEntity(e.target.value);
              updateFilters({ entity: e.target.value });
            }}
            disabled={isPending}
            className="admin-select text-xs h-9 py-1"
          >
            {ENTITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
            Quản trị viên
          </label>
          <select
            value={actor}
            onChange={(e) => {
              setActor(e.target.value);
              updateFilters({ actor: e.target.value });
            }}
            disabled={isPending}
            className="admin-select text-xs h-9 py-1"
          >
            <option value="">Tất cả quản trị viên</option>
            {adminUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.email.split('@')[0]} ({user.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
            Từ ngày
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              updateFilters({ from: e.target.value });
            }}
            disabled={isPending}
            className="admin-input text-xs h-9 py-1.5"
          />
        </div>

        <div>
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
            Đến ngày
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              updateFilters({ to: e.target.value });
            }}
            disabled={isPending}
            className="admin-input text-xs h-9 py-1.5"
          />
        </div>

        <div>
          <button
            type="button"
            onClick={handleReset}
            disabled={isPending}
            className="admin-button-secondary w-full h-9 text-xs border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Làm mới
          </button>
        </div>
      </div>
    </div>
  );
}
