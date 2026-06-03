'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { AlertTriangle, Check, ImageIcon, ListFilter, Package, Search } from 'lucide-react';
import Image from 'next/image';

import { FormattedDate } from '@/components/admin/FormattedDate';
import { ProductRowActions } from '@/components/admin/ProductRowActions';
import type { AdminCategory } from '@/lib/services/admin/categories';
import type { AdminProduct } from '@/lib/services/admin/products';

interface ProductsTableProps {
  products: AdminProduct[];
  categories: AdminCategory[];
}

type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
type StatusFilter = 'all' | 'active' | 'hidden';
type PriceFilter = 'all' | 'fixed' | 'contact';

function getThumbnail(product: AdminProduct): string | null {
  const images = product.product_images ?? [];
  const primary = images.find((image) => image.is_primary && image.public_url);
  const fallback = images.find((image) => image.public_url);
  return primary?.public_url ?? fallback?.public_url ?? null;
}

function getCategoryName(categoryMap: Map<string, string>, categoryId: string | null) {
  if (!categoryId) {
    return 'Chua phan loai';
  }

  return categoryMap.get(categoryId) ?? 'Chua phan loai';
}

export function ProductsTable({ products, categories }: ProductsTableProps) {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [missingImagesOnly, setMissingImagesOnly] = useState(false);

  const deferredQuery = useDeferredValue(query);
  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const totalCount = products.length;
  const activeCount = products.filter((product) => product.is_active).length;
  const hiddenCount = totalCount - activeCount;
  const outOfStockCount = products.filter((product) => product.stock === 0).length;
  const lowStockCount = products.filter((product) => product.stock > 0 && product.stock <= 5).length;
  const missingImageCount = products.filter((product) => (product.product_images?.length ?? 0) === 0).length;

  const filteredProducts = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();

    return products.filter((product) => {
      if (normalized) {
        const categoryName = getCategoryName(categoryNameById, product.category_id);
        const haystack = [product.name, product.slug, categoryName].join(' ').toLowerCase();
        if (!haystack.includes(normalized)) {
          return false;
        }
      }

      if (categoryFilter !== 'all' && product.category_id !== categoryFilter) {
        return false;
      }

      if (statusFilter === 'active' && !product.is_active) {
        return false;
      }

      if (statusFilter === 'hidden' && product.is_active) {
        return false;
      }

      if (stockFilter === 'in_stock' && product.stock === 0) {
        return false;
      }

      if (stockFilter === 'out_of_stock' && product.stock > 0) {
        return false;
      }

      if (stockFilter === 'low_stock' && (product.stock === 0 || product.stock > 5)) {
        return false;
      }

      if (priceFilter === 'fixed' && product.price === null) {
        return false;
      }

      if (priceFilter === 'contact' && product.price !== null) {
        return false;
      }

      if (missingImagesOnly && (product.product_images?.length ?? 0) > 0) {
        return false;
      }

      return true;
    });
  }, [
    products,
    deferredQuery,
    categoryFilter,
    statusFilter,
    stockFilter,
    priceFilter,
    missingImagesOnly,
    categoryNameById,
  ]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-slate-200/60 bg-white p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tong san pham</p>
          <p className="mt-1 text-2xl font-bold text-[#1B3A6B]">{totalCount}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Dang hien thi</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200/60 bg-slate-50 p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Dang an</p>
          <p className="mt-1 text-2xl font-bold text-slate-600">{hiddenCount}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Ton kho can xem</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{lowStockCount + outOfStockCount}</p>
          <p className="mt-1 text-[10px] font-medium text-amber-700">
            {outOfStockCount} het hang / {lowStockCount} ton thap
          </p>
        </div>
        <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Thieu media</p>
          <p className="mt-1 text-2xl font-bold text-rose-700">{missingImageCount}</p>
          <p className="mt-1 text-[10px] font-medium text-rose-700">Nen bo sung anh cho catalog</p>
        </div>
      </div>

      <div className="space-y-6 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#1B3A6B]">Danh sach san pham catalog</h2>
            <p className="mt-0.5 text-[10px] text-slate-400">
              Theo doi ton kho, gia niem yet, trang thai hien thi va do day du media tren moi SKU.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="search"
              placeholder="Tim theo ten, slug, danh muc..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
            />
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50 p-4 text-xs">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2.5">
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <ListFilter className="h-3.5 w-3.5" />
                Loc nang cao
              </span>

              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="min-h-9 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
              >
                <option value="all">Tat ca danh muc</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="min-h-9 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
              >
                <option value="all">Moi trang thai</option>
                <option value="active">Dang hien thi</option>
                <option value="hidden">Dang an</option>
              </select>

              <select
                value={stockFilter}
                onChange={(event) => setStockFilter(event.target.value as StockFilter)}
                className="min-h-9 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
              >
                <option value="all">Moi muc ton kho</option>
                <option value="in_stock">Con hang</option>
                <option value="low_stock">Ton thap (1-5)</option>
                <option value="out_of_stock">Het hang</option>
              </select>

              <select
                value={priceFilter}
                onChange={(event) => setPriceFilter(event.target.value as PriceFilter)}
                className="min-h-9 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
              >
                <option value="all">Moi kieu gia</option>
                <option value="fixed">Co gia niem yet</option>
                <option value="contact">Gia lien he</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setMissingImagesOnly((current) => !current)}
              className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 py-1.5 font-medium transition-colors ${
                missingImagesOnly
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              {missingImagesOnly ? 'Dang loc san pham thieu anh' : 'Chi xem san pham thieu anh'}
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3 text-[10px] font-medium leading-relaxed text-slate-500">
            Product row co badge canh bao cho ton kho, media va gia lien he de admin uu tien xu ly nhanh ngay trong bang.
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-20 text-center">
            <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="text-sm font-bold text-slate-600">Khong tim thay san pham nao khop bo loc</p>
            <p className="mt-1 text-xs text-slate-400">Hay thu doi tu khoa tim kiem hoac bo bot dieu kien loc.</p>
          </div>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
            <table className="min-w-[1100px] w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="p-4 w-16">Anh</th>
                  <th className="p-4">San pham</th>
                  <th className="p-4">Danh muc</th>
                  <th className="p-4">Gia niem yet</th>
                  <th className="p-4">Ton kho</th>
                  <th className="p-4">Media</th>
                  <th className="p-4">Trang thai</th>
                  <th className="p-4">Cap nhat</th>
                  <th className="p-4 text-right">Thao tac</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {filteredProducts.map((product, index) => {
                  const thumbnail = getThumbnail(product);
                  const imageCount = product.product_images?.length ?? 0;
                  const isOutOfStock = product.stock === 0;
                  const isLowStock = product.stock > 0 && product.stock <= 5;
                  const hasContactPrice = product.price === null;
                  const isEven = index % 2 === 0;

                  return (
                    <tr
                      key={product.id}
                      className={`transition-colors hover:bg-slate-50/40 ${isEven ? 'bg-white' : 'bg-[#F7F9FB]/50'}`}
                    >
                      <td className="p-4">
                        {thumbnail ? (
                          <div className="relative h-11 w-11 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                            <Image src={thumbnail} alt={product.name} fill sizes="44px" className="object-cover" unoptimized />
                          </div>
                        ) : (
                          <div
                            className="flex h-11 w-11 items-center justify-center rounded-xl border border-dashed border-rose-300 bg-rose-50 text-rose-500"
                            title="San pham chua co hinh anh"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="space-y-1">
                          <p className="text-[13px] font-bold text-slate-800">{product.name}</p>
                          <p className="font-mono text-[10px] text-slate-400">/{product.slug}</p>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {imageCount === 0 ? (
                              <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[9px] font-bold text-rose-700">
                                Thieu anh
                              </span>
                            ) : null}
                            {hasContactPrice ? (
                              <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-[#1B3A6B]">
                                Gia lien he
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-medium text-slate-600">
                        {getCategoryName(categoryNameById, product.category_id)}
                      </td>

                      <td className="p-4">
                        {product.price !== null ? (
                          <span className="font-semibold text-slate-800">
                            {product.price.toLocaleString('vi-VN')} d
                          </span>
                        ) : (
                          <span className="font-bold text-[#1B3A6B]">Lien he tu van</span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="space-y-1">
                          <p className="font-mono font-bold text-slate-700">
                            {product.stock.toLocaleString('vi-VN')}
                          </p>
                          {isOutOfStock ? (
                            <span className="inline-block rounded-md border border-rose-100 bg-rose-50 px-1.5 py-px text-[9px] font-bold text-rose-700">
                              Het hang
                            </span>
                          ) : null}
                          {isLowStock ? (
                            <span className="inline-block rounded-md border border-amber-100 bg-amber-50 px-1.5 py-px text-[9px] font-bold text-amber-700">
                              Ton thap
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              imageCount === 0
                                ? 'border border-rose-100 bg-rose-50 font-bold text-rose-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Package className="h-3 w-3" />
                            {imageCount} anh
                          </span>
                          {product.product_bulk_discounts?.some((discount) => discount.is_active) ? (
                            <p className="text-[9px] font-medium text-emerald-700">Da co bac gia si</p>
                          ) : (
                            <p className="text-[9px] font-medium text-slate-400">Chua co bac gia si</p>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-block rounded-md border px-2.5 py-0.5 text-[10px] font-bold ${
                            product.is_active
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200 bg-slate-100 text-slate-400'
                          }`}
                        >
                          {product.is_active ? 'Hien thi' : 'Dang an'}
                        </span>
                      </td>

                      <td className="p-4 font-mono text-[10px] text-slate-400">
                        <FormattedDate date={product.updated_at} type="date" />
                      </td>

                      <td className="p-4 text-right">
                        <ProductRowActions categories={categories} product={product} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex flex-col justify-between gap-3 border-t border-slate-100 pt-3 text-[10px] text-slate-400 sm:flex-row sm:items-center">
          <p>Tim thay {filteredProducts.length} san pham tuong thich.</p>
          <p className="flex items-center gap-1 font-bold uppercase tracking-wider text-[#1B3A6B]">
            <Check className="h-3 w-3 text-emerald-500" />
            Catalog sync ready
          </p>
        </div>
      </div>
    </div>
  );
}
