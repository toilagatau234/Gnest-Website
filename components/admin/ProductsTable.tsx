'use client';

import { useMemo, useState } from 'react';
import { 
  ImageIcon, 
  AlertTriangle, 
  ListFilter,
  Check,
  Search
} from 'lucide-react';

import { ProductFormDialog } from '@/components/admin/ProductFormDialog';
import { ProductRowActions } from '@/components/admin/ProductRowActions';
import type { AdminCategory } from '@/lib/services/admin/categories';
import type { AdminProduct } from '@/lib/services/admin/products';
import { FormattedDate } from '@/components/admin/FormattedDate';

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

export function ProductsTable({ products, categories }: ProductsTableProps) {
  // Advanced state filters matching template
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [missingImagesOnly, setMissingImagesOnly] = useState(false);

  // Computations for KPI blocks
  const totalCount = products.length;
  const activeCount = products.filter(p => p.is_active).length;
  const hiddenCount = totalCount - activeCount;
  const lowStockCount = products.filter(p => p.stock <= 5 && p.stock > 0).length;

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products.filter((product) => {
      // 1. Search Query
      if (normalized) {
        const matchesName = product.name.toLowerCase().includes(normalized);
        const matchesSlug = product.slug.toLowerCase().includes(normalized);
        if (!matchesName && !matchesSlug) return false;
      }
      // 2. Category Filter
      if (categoryFilter !== 'all' && product.category_id !== categoryFilter) {
        return false;
      }
      // 3. Status Filter
      if (statusFilter === 'active' && !product.is_active) {
        return false;
      }
      if (statusFilter === 'hidden' && product.is_active) {
        return false;
      }
      // 4. Stock Levels
      if (stockFilter === 'in_stock' && product.stock === 0) {
        return false;
      }
      if (stockFilter === 'out_of_stock' && product.stock > 0) {
        return false;
      }
      if (stockFilter === 'low_stock' && (product.stock > 5 || product.stock === 0)) {
        return false;
      }
      // 5. Price displays
      if (priceFilter === 'fixed' && product.price === null) {
        return false;
      }
      if (priceFilter === 'contact' && product.price !== null) {
        return false;
      }
      // 6. Missing images
      const imgCount = product.product_images?.length ?? 0;
      if (missingImagesOnly && imgCount > 0) {
        return false;
      }

      return true;
    });
  }, [products, query, categoryFilter, statusFilter, stockFilter, priceFilter, missingImagesOnly]);

  const getCategoryName = (catId: string | null) => {
    if (!catId) return 'Chưa phân loại';
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : 'Chưa phân loại';
  };

  return (
    <div className="space-y-6">
      
      {/* KPI mini row inside tab */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200/50 bg-slate-50 p-3.5 shadow-xs">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">TỔNG SẢN PHẨM</p>
          <p className="text-xl font-bold text-[#1B3A6B] mt-1">{totalCount}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5 shadow-xs">
          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider font-mono">ĐANG HIỂN THỊ</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200/50 bg-slate-50 p-3.5 shadow-xs">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">ĐANG ẨN</p>
          <p className="text-xl font-bold text-slate-500 mt-1">{hiddenCount}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3.5 shadow-xs">
          <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider font-mono">CẢNH BÁO HẾT/THẤP KHO</p>
          <p className="text-xl font-bold text-amber-700 mt-1">{lowStockCount}</p>
        </div>
      </div>

      <div className="space-y-6 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-6">
        
        {/* Title & Actions Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#1B3A6B]">Danh Sách Sản Phẩm (Catalog)</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Quản trị giá bán sỉ theo bậc số lượng, thông số kỹ thuật và hình ảnh mô tả
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {/* Real React 19 product creation form trigger styled exactly like template action buttons */}
            <ProductFormDialog categories={categories} />
          </div>
        </div>

        {/* Advanced Filter Strip */}
        <div className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50 p-4 text-xs">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            
            <div className="flex min-w-0 flex-wrap items-center gap-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1">
                <ListFilter className="w-3.5 h-3.5" /> Lọc nâng cao:
              </span>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="min-h-9 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
              >
                <option value="all">Tất cả danh mục</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="min-h-9 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
              >
                <option value="all">Mọi trạng thái</option>
                <option value="active">Đang hiển thị</option>
                <option value="hidden">Đang ẩn</option>
              </select>

              {/* Stock Levels */}
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as StockFilter)}
                className="min-h-9 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
              >
                <option value="all">Sản lượng tồn kho</option>
                <option value="in_stock">Còn hàng (Sỉ)</option>
                <option value="low_stock">Tồn kho thấp (≤ 5)</option>
                <option value="out_of_stock">Hết hàng hiển thị</option>
              </select>

              {/* Price Type */}
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value as PriceFilter)}
                className="min-h-9 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
              >
                <option value="all">Kiểu hiển thị giá</option>
                <option value="fixed">Có giá niêm yết</option>
                <option value="contact">Giá Liên hệ tư vấn</option>
              </select>
            </div>

            {/* Search Input Filter */}
            <div className="relative w-full sm:w-56">
              <input
                type="text"
                placeholder="Tìm sản phẩm nhanh..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
            </div>

            {/* Missing Image checkbox */}
            <label className="flex items-center gap-2 cursor-pointer bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-medium hover:bg-slate-100 transition-colors">
              <input 
                type="checkbox"
                checked={missingImagesOnly}
                onChange={(e) => setMissingImagesOnly(e.target.checked)}
                className="rounded border-slate-300 text-[#1B3A6B] focus:ring-[#1B3A6B]"
              />
              <span className="text-[11px] text-slate-700">Chỉ hàng chưa có ảnh</span>
            </label>

          </div>
        </div>

        {/* Table representation */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-bold text-sm">Không tìm thấy sản phẩm nào khớp bộ lọc</p>
            <p className="text-slate-400 text-xs mt-1">Vui lòng thay đổi từ khóa tìm kiếm hoặc tắt bộ lọc nâng cao.</p>
          </div>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
            <table className="w-full text-xs text-left min-w-[940px]">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[9px] border-b border-slate-200">
                  <th className="p-4 w-16">Ảnh</th>
                  <th className="p-4">Tên sản phẩm</th>
                  <th className="p-4">Danh mục</th>
                  <th className="p-4">Giá bán lẻ tham khảo</th>
                  <th className="p-4">Kho sỉ</th>
                  <th className="p-4">Ảnh sỉ</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4">Cập nhật</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {filtered.map((p, idx) => {
                  const thumbnail = getThumbnail(p);
                  const imgCount = p.product_images?.length ?? 0;
                  const isLowStock = p.stock <= 5;
                  const isEven = idx % 2 === 0;

                  return (
                    <tr 
                      key={p.id}
                      className={`hover:bg-slate-50/40 transition-colors ${isEven ? 'bg-white' : 'bg-[#F7F9FB]/50'}`}
                    >
                      <td className="p-4">
                        {thumbnail ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 relative bg-slate-100">
                            <img src={thumbnail} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg border border-dashed border-rose-300 bg-rose-50 flex items-center justify-center text-rose-500" title="Chưa có hình ảnh">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                      </td>
                      
                      <td className="p-4">
                        <p className="font-bold text-slate-800 text-[13px]">{p.name}</p>
                        <span className="text-[9px] font-mono text-slate-400">/{p.slug}</span>
                      </td>

                      <td className="p-4 text-slate-600 font-medium">
                        {getCategoryName(p.category_id)}
                      </td>

                      <td className="p-4 font-semibold text-slate-800">
                        {p.price !== null ? (
                          <span>{p.price.toLocaleString('vi-VN')} đ</span>
                        ) : (
                          <span className="text-[#1B3A6B] font-bold">Liên hệ</span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-slate-700">{p.stock.toLocaleString('vi-VN')}</span>
                          {isLowStock && (
                            <span className={`block max-w-max rounded border px-1.5 py-px text-[9px] font-bold ${
                              p.stock === 0 ? 'bg-rose-50 text-[#E31E24] border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                              {p.stock === 0 ? 'Hết hàng' : 'Tồn thấp'}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          imgCount === 0 ? 'bg-red-50 text-red-500 border border-red-100 font-bold' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {imgCount} ảnh
                        </span>
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-block rounded-md border px-2.5 py-0.5 text-[10px] font-bold ${
                            p.is_active
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200 bg-slate-100 text-slate-400'
                          }`}
                        >
                          {p.is_active ? 'Hiển thị' : 'Đang ẩn'}
                        </span>
                      </td>

                      <td className="p-4 font-mono text-[10px] text-slate-400">
                        <FormattedDate date={p.updated_at} type="date" />
                      </td>

                      <td className="p-4 text-right">
                        <ProductRowActions categories={categories} product={p} />
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer Helper */}
        <div className="mt-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-slate-400 text-[10px] border-t border-slate-100 pt-3">
          <p>Tìm thấy {filtered.length} sản phẩm tương thích.</p>
          <p className="flex items-center gap-1 font-mono uppercase tracking-wider text-[#1B3A6B] font-bold">
            <Check className="w-3 h-3 text-emerald-500" /> Catalog sync ready
          </p>
        </div>

      </div>
    </div>
  );
}
