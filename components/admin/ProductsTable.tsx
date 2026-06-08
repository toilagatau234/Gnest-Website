'use client';

import { useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ChevronLeft, ChevronRight, ImageIcon, ListFilter, Package, Search } from 'lucide-react';
import Image from 'next/image';

import { FormattedDate } from '@/components/admin/FormattedDate';
import { ProductRowActions } from '@/components/admin/ProductRowActions';
import type { AdminCategory } from '@/lib/services/admin/categories';
import type { ImageFilter, PriceFilter, ProductListItem, ProductListResult, ProductStats, StatusFilter, StockFilter } from '@/lib/services/admin/products';

interface ProductsTableProps {
  items: ProductListItem[];
  categories: AdminCategory[];
  pagination: Pick<ProductListResult, 'page' | 'pageSize' | 'total' | 'pageCount'>;
  filters: {
    q: string;
    categoryId: string;
    status: StatusFilter;
    stock: StockFilter;
    price: PriceFilter;
    images: ImageFilter;
  };
  stats: ProductStats;
}

function getCategoryName(categoryMap: Map<string, string>, categoryId: string | null) {
  if (!categoryId) return 'Chưa phân loại';
  return categoryMap.get(categoryId) ?? 'Chưa phân loại';
}

export function ProductsTable({ items, categories, pagination, filters, stats }: ProductsTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Uncontrolled search input — key resets it when the URL query changes
  const searchRef = useRef<HTMLInputElement>(null);



  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  function buildUrl(updates: {
    q?: string;
    categoryId?: string;
    status?: StatusFilter;
    stock?: StockFilter;
    price?: PriceFilter;
    images?: ImageFilter;
    page?: number;
    pageSize?: number;
  }) {
    const params = new URLSearchParams();
    const merged = { ...filters, page: pagination.page, pageSize: pagination.pageSize, ...updates };
    // Reset to page 1 on any filter change (unless page was explicitly passed)
    const newPage = 'page' in updates ? (updates.page ?? 1) : 1;

    if (merged.q) params.set('q', merged.q);
    if (merged.categoryId && merged.categoryId !== 'all') params.set('categoryId', merged.categoryId);
    if (merged.status && merged.status !== 'all') params.set('status', merged.status);
    if (merged.stock && merged.stock !== 'all') params.set('stock', merged.stock);
    if (merged.price && merged.price !== 'all') params.set('price', merged.price);
    if (merged.images && merged.images !== 'all') params.set('images', merged.images);
    if (newPage > 1) params.set('page', String(newPage));
    if (merged.pageSize !== 30) params.set('pageSize', String(merged.pageSize));
    const qs = params.toString();
    return qs ? `/admin/products?${qs}` : '/admin/products';
  }

  function navigate(url: string) {
    startTransition(() => { router.push(url); });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate(buildUrl({ q: searchRef.current?.value ?? '' }));
  }

  const { page, pageSize, total, pageCount } = pagination;

  return (
    <div className={`space-y-6 transition-opacity ${isPending ? 'opacity-60 pointer-events-none' : ''}`}>
      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200/60 bg-white p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tổng sản phẩm</p>
          <p className="mt-1 text-2xl font-bold text-[#1B3A6B]">{stats.total}</p>
          <div className="mt-2 h-1 w-full rounded-full bg-slate-100">
            <div className="h-1 rounded-full bg-[#1B3A6B]/40" style={{ width: '100%' }} />
          </div>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Đang hiển thị</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{stats.active}</p>
          <div className="mt-2 h-1 w-full rounded-full bg-emerald-100">
            <div
              className="h-1 rounded-full bg-emerald-500"
              style={{ width: stats.total > 0 ? `${(stats.active / stats.total) * 100}%` : '0%' }}
            />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Đang ẩn</p>
          <p className="mt-1 text-2xl font-bold text-slate-600">{stats.hidden}</p>
          <div className="mt-2 h-1 w-full rounded-full bg-slate-200">
            <div
              className="h-1 rounded-full bg-slate-400"
              style={{ width: stats.total > 0 ? `${(stats.hidden / stats.total) * 100}%` : '0%' }}
            />
          </div>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Tồn kho cần xem</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{stats.lowStock + stats.outOfStock}</p>
          <p className="mt-1 text-[10px] font-medium text-amber-700">
            {stats.outOfStock} hết hàng / {stats.lowStock} tồn thấp
          </p>
          <div className="mt-1 h-1 w-full rounded-full bg-amber-100">
            <div
              className="h-1 rounded-full bg-amber-500"
              style={{ width: stats.total > 0 ? `${((stats.lowStock + stats.outOfStock) / stats.total) * 100}%` : '0%' }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-6 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#1B3A6B]">Danh sách sản phẩm catalog</h2>
            <p className="mt-0.5 text-[10px] text-slate-400">
              Theo dõi tồn kho, giá niêm yết, trạng thái hiển thị và độ đầy đủ media trên mỗi SKU.
            </p>
          </div>

          <form key={filters.q} onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
            <input
              ref={searchRef}
              type="search"
              placeholder="Tìm theo tên, slug… (Enter)"
              defaultValue={filters.q}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
            />
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </form>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50 p-4 text-xs">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2.5">
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <ListFilter className="h-3.5 w-3.5" />
                Lọc nâng cao
              </span>

              <select
                value={filters.categoryId}
                onChange={(e) => navigate(buildUrl({ categoryId: e.target.value }))}
                className="min-h-9 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
              >
                <option value="all">Tất cả danh mục</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                value={filters.status}
                onChange={(e) => navigate(buildUrl({ status: e.target.value as StatusFilter }))}
                className="min-h-9 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
              >
                <option value="all">Mọi trạng thái</option>
                <option value="active">Đang hiển thị</option>
                <option value="hidden">Đang ẩn</option>
              </select>

              <select
                value={filters.stock}
                onChange={(e) => navigate(buildUrl({ stock: e.target.value as StockFilter }))}
                className="min-h-9 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
              >
                <option value="all">Mọi mức tồn kho</option>
                <option value="in_stock">Còn hàng</option>
                <option value="low_stock">Tồn thấp (1–5)</option>
                <option value="out_of_stock">Hết hàng</option>
              </select>

              <select
                value={filters.price}
                onChange={(e) => navigate(buildUrl({ price: e.target.value as PriceFilter }))}
                className="min-h-9 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
              >
                <option value="all">Mọi kiểu giá</option>
                <option value="fixed">Có giá niêm yết</option>
                <option value="contact">Giá liên hệ</option>
              </select>
            </div>

              <select
                value={filters.images}
                onChange={(e) => navigate(buildUrl({ images: e.target.value as ImageFilter }))}
                className="min-h-9 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
              >
                <option value="all">Mọi trạng thái ảnh</option>
                <option value="missing">Thiếu ảnh</option>
                <option value="has_image">Đã có ảnh</option>
              </select>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3 text-[10px] font-medium leading-relaxed text-slate-500">
            Mỗi dòng có badge cảnh báo cho tồn kho, media và giá liên hệ để admin ưu tiên xử lý nhanh ngay trong bảng.
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-20 text-center">
            <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="text-sm font-bold text-slate-600">Không tìm thấy sản phẩm nào khớp bộ lọc</p>
            <p className="mt-1 text-xs text-slate-400">Hãy thử đổi từ khóa tìm kiếm hoặc bỏ bớt điều kiện lọc.</p>
          </div>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
            <table className="min-w-[1100px] w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="p-4 w-16 shrink-0">Ảnh</th>
                  <th className="p-4 min-w-[180px]">Sản phẩm</th>
                  <th className="p-4 whitespace-nowrap">Danh mục</th>
                  <th className="p-4 whitespace-nowrap">Giá niêm yết</th>
                  <th className="p-4 whitespace-nowrap">Tồn kho</th>
                  <th className="p-4 whitespace-nowrap">Media</th>
                  <th className="p-4 whitespace-nowrap">Trạng thái</th>
                  <th className="p-4 whitespace-nowrap">Cập nhật</th>
                  <th className="p-4 whitespace-nowrap text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {items.map((item, index) => {
                  const thumbnail = item.thumbnailUrl;
                  const imageCount = item.imageCount;
                  const isOutOfStock = item.stock === 0;
                  const isLowStock = item.stock > 0 && item.stock <= 5;
                  const hasContactPrice = item.price === null;
                  const hasActiveTiers = item.hasActiveBulkDiscount;
                  const isEven = index % 2 === 0;

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors hover:bg-slate-50/40 ${isEven ? 'bg-white' : 'bg-[#F7F9FB]/50'}`}
                    >
                      <td className="p-4">
                        {thumbnail ? (
                          <div className="relative h-11 w-11 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                            <Image src={thumbnail} alt={item.name} fill sizes="44px" className="object-cover" unoptimized />
                          </div>
                        ) : (
                          <div
                            className="flex h-11 w-11 items-center justify-center rounded-xl border border-dashed border-rose-300 bg-rose-50 text-rose-500"
                            title="Sản phẩm chưa có hình ảnh"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </div>
                        )}
                      </td>

                      <td className="p-4 max-w-[240px]">
                        <div className="space-y-1">
                          <p className="line-clamp-2 text-[13px] font-bold text-slate-800" title={item.name}>{item.name}</p>
                          <p className="max-w-[210px] truncate font-mono text-[10px] text-slate-400" title={`/${item.slug}`}>/{item.slug}</p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {item.is_featured ? (
                              <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                                Nổi bật
                              </span>
                            ) : null}
                            {imageCount === 0 ? (
                              <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[9px] font-bold text-rose-700">
                                Thiếu ảnh
                              </span>
                            ) : null}
                            {hasContactPrice ? (
                              <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-[#1B3A6B]">
                                Giá liên hệ
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      <td 
                        className="p-4 max-w-[150px] truncate font-medium text-slate-600"
                        title={item.categories?.name ?? getCategoryName(categoryNameById, item.category_id)}
                      >
                        {item.categories?.name ?? getCategoryName(categoryNameById, item.category_id)}
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        {item.price !== null ? (
                          <span className="font-semibold text-slate-800">
                            {item.price.toLocaleString('vi-VN')} đ
                          </span>
                        ) : (
                          <span className="font-bold text-[#1B3A6B]">Liên hệ tư vấn</span>
                        )}
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <p className="font-mono font-bold text-slate-700">
                            {item.stock.toLocaleString('vi-VN')}
                          </p>
                          {isOutOfStock ? (
                            <span className="inline-block rounded-md border border-rose-100 bg-rose-50 px-1.5 py-px text-[9px] font-bold text-rose-700">
                              Hết hàng
                            </span>
                          ) : null}
                          {isLowStock ? (
                            <span className="inline-block rounded-md border border-amber-100 bg-amber-50 px-1.5 py-px text-[9px] font-bold text-amber-700">
                              Tồn thấp
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              imageCount === 0
                                ? 'border border-rose-100 bg-rose-50 font-bold text-rose-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Package className="h-3 w-3" />
                            {imageCount} ảnh
                          </span>
                          {hasActiveTiers ? (
                            <p className="text-[9px] font-medium text-emerald-700">Đã có bậc giá sỉ</p>
                          ) : (
                            <p className="text-[9px] font-medium text-slate-400">Chưa có bậc giá sỉ</p>
                          )}
                        </div>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`inline-block rounded-md border px-2.5 py-0.5 text-[10px] font-bold ${
                            item.is_active
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200 bg-slate-100 text-slate-400'
                          }`}
                        >
                          {item.is_active ? 'Hiển thị' : 'Đang ẩn'}
                        </span>
                      </td>

                      <td className="p-4 whitespace-nowrap font-mono text-[10px] text-slate-400">
                        <FormattedDate date={item.updated_at} type="date" />
                      </td>

                      <td className="p-4 whitespace-nowrap text-right">
                        <ProductRowActions categories={categories} product={item} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        <div className="mt-4 flex flex-col justify-between gap-3 border-t border-slate-100 pt-3 text-[10px] sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 text-slate-400">
            <span>
              Trang {page}/{pageCount} · {total} sản phẩm
              {filters.images === 'missing' ? ' (đang lọc thiếu ảnh)' : ''}
            </span>
            <select
              value={pageSize}
              onChange={(e) => navigate(buildUrl({ pageSize: Number(e.target.value), page: 1 }))}
              className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-600 focus:outline-none"
            >
              {[10, 20, 30, 50, 100].map((n) => (
                <option key={n} value={n}>{n} / trang</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1 || isPending}
              onClick={() => navigate(buildUrl({ page: page - 1 }))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 font-bold text-[#1B3A6B]">{page} / {pageCount}</span>
            <button
              type="button"
              disabled={page >= pageCount || isPending}
              onClick={() => navigate(buildUrl({ page: page + 1 }))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
