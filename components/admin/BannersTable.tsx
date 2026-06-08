'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Megaphone, Search, Shield, CalendarDays } from 'lucide-react';

import { BannerRowActions } from '@/components/admin/BannerRowActions';
import type { AdminBanner } from '@/lib/services/admin/banners';

interface BannersTableProps {
  banners: AdminBanner[];
  page: number;
  pageCount: number;
  total: number;
}

function buildUrl(page: number) {
  if (page <= 1) return '/admin/banners';
  return `/admin/banners?page=${page}`;
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`admin-badge ${active ? 'admin-status-active' : 'admin-status-muted'}`}>
      {active ? 'Đang hoạt động' : 'Đang ẩn'}
    </span>
  );
}

function PositionBadge({ position }: { position: string }) {
  if (position === 'home_after_products') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-[#C9D2E6] bg-[#F0F4FC] px-2 py-0.5 text-[10px] font-bold text-[#1B3A6B]">
        Trang chủ (Slot)
      </span>
    );
  }

  if (position === 'catalog_top') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
        Trang danh mục
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
      Thanh đầu trang
    </span>
  );
}

function ScheduleStatus({ banner }: { banner: AdminBanner }) {
  if (!banner.start_at && !banner.end_at) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
        <CalendarDays className="w-3.5 h-3.5" /> Không giới hạn
      </span>
    );
  }

  const now = new Date();
  const start = banner.start_at ? new Date(banner.start_at) : null;
  const end = banner.end_at ? new Date(banner.end_at) : null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (start && start > now) {
    return (
      <div className="space-y-0.5 text-left">
        <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
          Chưa bắt đầu
        </span>
        <p className="text-[10px] text-slate-400">Từ: {formatDate(start)}</p>
      </div>
    );
  }

  if (end && end < now) {
    return (
      <div className="space-y-0.5 text-left">
        <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-700">
          Hết hạn
        </span>
        <p className="text-[10px] text-slate-400">Đã kết thúc</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5 text-left">
      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
        Đang chạy
      </span>
      {end ? (
        <p className="text-[10px] text-slate-500">Đến: {formatDate(end)}</p>
      ) : (
        <p className="text-[10px] text-slate-400">Không thời hạn</p>
      )}
    </div>
  );
}

export function BannersTable({ banners, page, pageCount, total }: BannersTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const filteredBanners = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();

    if (!normalized) {
      return banners;
    }

    return banners.filter((banner) => {
      return [banner.name, banner.content, banner.link_url, banner.position]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalized));
    });
  }, [banners, deferredQuery]);

  return (
    <div className="admin-card space-y-5 p-4 sm:p-6">
      <div className="flex flex-col justify-between gap-4 border-b border-[#EEF2F6] pb-4 lg:flex-row lg:items-center">
        <div className="min-w-0">
          <h2 className="text-base font-extrabold text-[#202224]">Danh sách banner quảng cáo</h2>
          <p className="mt-1 max-w-3xl text-xs font-medium leading-relaxed text-[#646464]">
            Xem trước, sửa đổi hoặc tắt hiển thị các chương trình ưu đãi, thông tin khẩn cấp trên website.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="search"
            placeholder="Tìm tên, nội dung, vị trí..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="admin-input h-9 pl-9 text-xs"
          />
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {filteredBanners.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D8DEEC] bg-[#F7F9FB] px-6 py-16 text-center">
          <Megaphone className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <p className="text-sm font-extrabold text-[#202224]">Không tìm thấy banner nào</p>
          <p className="mt-1 text-xs font-medium text-[#646464]">Thử đổi từ khóa tìm kiếm hoặc thêm banner mới.</p>
        </div>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
          <table className="min-w-[1000px] w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                <th className="p-4">Tên banner (Quản trị)</th>
                <th className="p-4">Vị trí</th>
                <th className="p-4 max-w-[240px]">Nội dung / ALT</th>
                <th className="p-4">Đường dẫn (Link)</th>
                <th className="p-4">Lịch trình</th>
                <th className="p-4 whitespace-nowrap">STT</th>
                <th className="p-4 whitespace-nowrap">Trạng thái</th>
                <th className="p-4 whitespace-nowrap text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {filteredBanners.map((banner, index) => {
                const isEven = index % 2 === 0;
                const displayIndex = (page - 1) * 20 + index + 1;

                return (
                  <tr
                    key={banner.id}
                    className={`transition-colors hover:bg-slate-50/40 ${isEven ? 'bg-white' : 'bg-[#F7F9FB]/50'}`}
                  >
                    <td className="p-4 font-bold text-slate-800">
                      <div className="space-y-0.5">
                        <p>{banner.name}</p>
                        {banner.image_desktop_url ? (
                          <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1 py-px rounded border border-emerald-100">
                            Có ảnh
                          </span>
                        ) : null}
                      </div>
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <PositionBadge position={banner.position} />
                    </td>

                    <td className="p-4 max-w-[240px] font-medium text-slate-600">
                      <p className="line-clamp-2 leading-relaxed" title={banner.content}>
                        {banner.content}
                      </p>
                    </td>

                    <td className="p-4 font-mono text-slate-500 break-all text-[11px]">
                      {banner.link_url ? (
                        <a
                          href={banner.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline hover:text-[#3749A6] truncate block max-w-[180px]"
                          title={banner.link_url}
                        >
                          {banner.link_url}
                        </a>
                      ) : (
                        <span className="text-slate-300 italic">Không có link</span>
                      )}
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <ScheduleStatus banner={banner} />
                    </td>

                    <td className="p-4 whitespace-nowrap font-bold text-slate-700">
                      #{displayIndex}
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <StatusBadge active={banner.is_active} />
                    </td>

                    <td className="p-4 whitespace-nowrap text-right">
                      <BannerRowActions banner={banner} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-2xl border border-[#E5E7EF] bg-[#F7F9FB] p-3.5 text-[11px] font-medium text-[#646464] sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-emerald-600" />
          Dữ liệu banner quảng cáo được đồng bộ an toàn từ Supabase PostgreSQL.
        </p>
        <span className="font-bold text-[#3749A6]">{total} banner</span>
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
