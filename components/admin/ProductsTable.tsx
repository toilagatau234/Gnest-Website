'use client';

import { useMemo, useState } from 'react';
import { ImageIcon, Package } from 'lucide-react';

import { AdminFilterBar, AdminSelect } from '@/components/admin/AdminFilterBar';
import { AdminSearchInput } from '@/components/admin/AdminSearchInput';
import { AdminStatusChip } from '@/components/admin/AdminStatusChip';
import { AdminTableShell, AdminTh } from '@/components/admin/AdminTableShell';
import { ProductFormDialog } from '@/components/admin/ProductFormDialog';
import type { AdminCategory } from '@/lib/services/admin/categories';
import type { AdminProduct } from '@/lib/services/admin/products';

import { toggleProductActiveAction } from '@/app/admin/(dashboard)/products/actions';

interface ProductsTableProps {
  products: AdminProduct[];
  categories: AdminCategory[];
}

type StatusFilter = 'all' | 'active' | 'hidden';

function formatPrice(price: number | null) {
  if (price === null) {
    return 'Liên hệ';
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price);
}

function getThumbnail(product: AdminProduct): string | null {
  const images = product.product_images ?? [];
  const primary = images.find((image) => image.is_primary && image.public_url);
  const fallback = images.find((image) => image.public_url);
  return primary?.public_url ?? fallback?.public_url ?? null;
}

function StockCell({ stock }: { stock: number }) {
  if (stock <= 0) {
    return <AdminStatusChip tone="alert">Hết hàng</AdminStatusChip>;
  }
  const tone = stock <= 5 ? 'text-amber-600' : 'text-slate-600';
  return <span className={`text-sm font-medium tabular-nums ${tone}`}>{stock}</span>;
}

export function ProductsTable({ products, categories }: ProductsTableProps) {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products.filter((product) => {
      if (categoryFilter !== 'all' && product.category_id !== categoryFilter) {
        return false;
      }
      if (statusFilter === 'active' && !product.is_active) {
        return false;
      }
      if (statusFilter === 'hidden' && product.is_active) {
        return false;
      }
      if (normalized) {
        return (
          product.name.toLowerCase().includes(normalized) ||
          product.slug.toLowerCase().includes(normalized)
        );
      }
      return true;
    });
  }, [products, query, categoryFilter, statusFilter]);

  return (
    <div className="space-y-4">
      <AdminFilterBar
        trailing={
          <>
            <AdminSelect label="Lọc theo danh mục" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">Tất cả danh mục</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </AdminSelect>
            <AdminSelect label="Lọc theo trạng thái" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
              <option value="all">Mọi trạng thái</option>
              <option value="active">Đang hiển thị</option>
              <option value="hidden">Đang ẩn</option>
            </AdminSelect>
          </>
        }
      >
        <AdminSearchInput value={query} onChange={setQuery} placeholder="Tìm theo tên hoặc slug…" />
        <span className="text-sm text-slate-400">{filtered.length} sản phẩm</span>
      </AdminFilterBar>

      <AdminTableShell
        minWidth={940}
        head={
          <>
            <AdminTh>Sản phẩm</AdminTh>
            <AdminTh>Danh mục</AdminTh>
            <AdminTh align="right">Giá</AdminTh>
            <AdminTh>Tồn kho</AdminTh>
            <AdminTh>Ảnh</AdminTh>
            <AdminTh>Trạng thái</AdminTh>
            <AdminTh align="right">Thao tác</AdminTh>
          </>
        }
      >
        {filtered.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-500">
              Không tìm thấy sản phẩm phù hợp.
            </td>
          </tr>
        ) : (
          filtered.map((product) => {
            const thumbnail = getThumbnail(product);
            const imageCount = product.product_images?.length ?? 0;
            return (
              <tr key={product.id} className="transition-colors hover:bg-[#F8FAFC]">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E2E8F0] bg-slate-50">
                      {thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumbnail} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-5 w-5 text-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                      <p className="truncate font-mono text-xs text-slate-400">{product.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-slate-600">{product.categories?.name ?? '—'}</td>
                <td className="px-5 py-3 text-right text-sm font-medium tabular-nums text-slate-700">
                  {formatPrice(product.price)}
                </td>
                <td className="px-5 py-3">
                  <StockCell stock={product.stock} />
                </td>
                <td className="px-5 py-3 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <ImageIcon className={`h-3.5 w-3.5 ${imageCount === 0 ? 'text-amber-400' : 'text-slate-300'}`} />
                    {imageCount}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm">
                  <AdminStatusChip tone={product.is_active ? 'success' : 'neutral'} dot>
                    {product.is_active ? 'Hiển thị' : 'Ẩn'}
                  </AdminStatusChip>
                </td>
                <td className="px-5 py-3 text-right text-sm">
                  <div className="flex justify-end gap-2">
                    <ProductFormDialog categories={categories} product={product} />
                    <form action={toggleProductActiveAction}>
                      <input type="hidden" name="id" value={product.id} />
                      <input type="hidden" name="next_is_active" value={String(!product.is_active)} />
                      <button
                        type="submit"
                        className="admin-focus h-8 rounded-lg border border-[#E2E8F0] px-3 text-xs font-semibold text-slate-600 transition hover:border-[#E31E24] hover:text-[#E31E24]"
                      >
                        {product.is_active ? 'Ẩn' : 'Hiện'}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </AdminTableShell>
    </div>
  );
}
