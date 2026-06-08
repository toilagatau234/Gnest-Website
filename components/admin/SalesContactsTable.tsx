'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, MessageCircle, Phone, Search, Shield, UserRound } from 'lucide-react';

import { SalesContactRowActions } from '@/components/admin/SalesContactRowActions';
import { AdminSortableListDialog } from '@/components/admin/AdminSortableListDialog';
import { moveSalesContactAction } from '@/app/admin/(dashboard)/sales-contacts/actions';
import type { AdminSalesContact } from '@/lib/services/admin/sales-contacts';

interface SalesContactsTableProps {
  contacts: AdminSalesContact[];
  allContacts: AdminSalesContact[];
  page: number;
  pageCount: number;
  total: number;
}

function buildUrl(page: number) {
  if (page <= 1) return '/admin/sales-contacts';
  return `/admin/sales-contacts?page=${page}`;
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`admin-badge ${active ? 'admin-status-active' : 'admin-status-muted'}`}>
      {active ? 'Đang hiển thị' : 'Đang ẩn'}
    </span>
  );
}

function getZaloLink(contact: AdminSalesContact) {
  if (contact.zalo) {
    return contact.zalo;
  }

  const digits = contact.phone.replace(/\D/g, '');
  return digits ? `https://zalo.me/${digits}` : '#';
}

export function SalesContactsTable({ contacts, allContacts, page, pageCount, total }: SalesContactsTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const filteredContacts = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();

    if (!normalized) {
      return contacts;
    }

    return contacts.filter((contact) => {
      return [contact.name, contact.role, contact.phone, contact.zalo]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalized));
    });
  }, [contacts, deferredQuery]);

  const reorderScopes = useMemo(
    () => [
      {
        id: 'sales-contacts:global',
        label: 'Toàn bộ liên hệ bán hàng',
        description: 'Kéo thả để thay đổi thứ tự hiển thị các đầu mối liên hệ trên website.',
        items: allContacts.map((contact) => ({
          id: contact.id,
          label: contact.name,
          subtitle: contact.role ?? undefined,
          meta: `${contact.phone}${contact.zalo ? ` • ${contact.zalo}` : ''}`,
          is_active: contact.is_active,
        })),
      },
    ],
    [allContacts],
  );

  return (
    <div className="admin-card space-y-5 p-4 sm:p-6">
      <div className="flex flex-col justify-between gap-4 border-b border-[#EEF2F6] pb-4 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <h2 className="text-base font-extrabold text-[#202224]">Danh sách nhân sự tư vấn</h2>
          <p className="mt-1 max-w-3xl text-xs font-medium leading-relaxed text-[#646464]">
            Quản lý hotline, Zalo và thứ tự hiển thị cho các điểm chạm tư vấn trên website.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <AdminSortableListDialog
            buttonLabel="Tùy chỉnh sắp xếp"
            title="Tùy chỉnh thứ tự liên hệ"
            description="Kéo thả các liên hệ bán hàng để thay đổi thứ tự hiển thị trên website."
            successMessage="Đã cập nhật thứ tự hiển thị."
            errorMessage="Không thể cập nhật thứ tự hiển thị."
            scopes={reorderScopes}
            onSave={async (_scopeId, moves) => {
              for (const move of moves) {
                const res = await moveSalesContactAction({
                  itemId: move.itemId,
                  beforeId: move.beforeId,
                  afterId: move.afterId,
                });
                if (!res.ok) {
                  return res;
                }
              }
              return { ok: true };
            }}
          />

          <div className="relative w-full sm:w-72">
            <input
              type="search"
              placeholder="Tìm tên, vai trò, số điện thoại..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="admin-input h-9 pl-9 text-xs"
            />
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {filteredContacts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D8DEEC] bg-[#F7F9FB] px-6 py-16 text-center">
          <Phone className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <p className="text-sm font-extrabold text-[#202224]">Không tìm thấy liên hệ nào</p>
          <p className="mt-1 text-xs font-medium text-[#646464]">Thử đổi từ khóa tìm kiếm hoặc thêm nhân sự mới.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filteredContacts.map((contact) => (
            <article key={contact.id} className="rounded-2xl border border-[#E5E7EF] bg-white p-4 shadow-sm transition hover:border-[#D8DEEC] hover:shadow-admin">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#E5E7EF] bg-[#F7F9FB] text-[#4880FF]">
                    {contact.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={contact.avatar_url}
                        alt={contact.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <UserRound className="h-6 w-6" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-extrabold text-[#202224]">{contact.name}</h3>
                    <p className="mt-0.5 line-clamp-2 text-xs font-medium leading-relaxed text-[#646464]">
                      {contact.role || 'Chưa cập nhật vai trò'}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[#646464]">
                      <span className="inline-flex items-center gap-1 rounded-lg border border-[#E5E7EF] bg-[#F7F9FB] px-2 py-1">
                        <Phone className="h-3.5 w-3.5 text-slate-400" /> {contact.phone}
                      </span>
                      <a
                        href={getZaloLink(contact)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1 text-emerald-700 transition hover:border-emerald-200 hover:bg-emerald-100"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> Zalo
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 justify-end">
                  <SalesContactRowActions contact={contact} />
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 border-t border-[#EEF2F6] pt-3 text-[11px] font-medium text-[#646464] sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge active={contact.is_active} />
                  <span className="admin-badge border-[#E5E7EF] bg-[#F7F9FB] text-[#646464]">
                    Thứ tự #{contact.sort_order}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-[0.12em] text-[#3749A6]">
                  <Shield className="h-3.5 w-3.5" /> Client contact
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-2xl border border-[#E5E7EF] bg-[#F7F9FB] p-3.5 text-[11px] font-medium text-[#646464] sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-emerald-600" />
          Dữ liệu liên hệ bán hàng được đồng bộ từ Supabase.
        </p>
        <span className="font-bold text-[#3749A6]">{total} liên hệ</span>
      </div>

      {pageCount > 1 ? (
        <div className="flex items-center justify-between border-t border-[#EEF2F6] pt-4">
          <span className="text-sm text-slate-500">
            Trang {page} / {pageCount}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => router.push(buildUrl(page - 1))}
              className="admin-focus inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E5E7EF] px-3 text-sm font-medium text-slate-700 transition-colors hover:border-[#4880FF] hover:text-[#3749A6] disabled:pointer-events-none disabled:opacity-40"
            >
              ← Trước
            </button>
            <button
              type="button"
              disabled={page >= pageCount}
              onClick={() => router.push(buildUrl(page + 1))}
              className="admin-focus inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E5E7EF] px-3 text-sm font-medium text-slate-700 transition-colors hover:border-[#4880FF] hover:text-[#3749A6] disabled:pointer-events-none disabled:opacity-40"
            >
              Tiếp →
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
