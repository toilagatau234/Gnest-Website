'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Eye, 
  Trash2, 
  Edit2, 
  Copy, 
  Image as ImageIcon, 
  AlertTriangle, 
  ListFilter,
  FileSpreadsheet,
  Download,
  Check,
  EyeOff,
  ChevronRight
} from 'lucide-react';
import { Product, Category } from '@/lib/mock-data';
import FormattedDate from './FormattedDate';

interface ProductsTabProps {
  products: Product[];
  categories: Category[];
  onOpenDrawer: (type: string, data?: any) => void;
  onDeleteProduct: (id: string) => void;
  onCloneProduct: (p: Product) => void;
  onToggleProductStatus: (p: Product) => void;
  searchText: string;
  triggerToast: (msg: string, type: 'success' | 'error') => void;
}

export default function ProductsTab({
  products,
  categories,
  onOpenDrawer,
  onDeleteProduct,
  onCloneProduct,
  onToggleProductStatus,
  searchText,
  triggerToast
}: ProductsTabProps) {

  // Product Specific filters state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all'); // all | active | hidden
  const [selectedStock, setSelectedStock] = useState<string>('all'); // all | in_stock | out_of_stock | low_stock
  const [selectedPriceType, setSelectedPriceType] = useState<string>('all'); // all | fixed | contact
  const [missingImagesOnly, setMissingImagesOnly] = useState<boolean>(false);

  // Stats computations
  const totalCount = products.length;
  const activeCount = products.filter(p => p.is_active).length;
  const hiddenCount = totalCount - activeCount;
  const lowStockCount = products.filter(p => p.stock <= p.low_stock_threshold).length;

  const getCategoryName = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : 'Chưa phân loại';
  };

  // Main list filtering
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchText.toLowerCase()) || 
                          p.slug.toLowerCase().includes(searchText.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;

    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'active' && p.is_active) || 
                         (selectedStatus === 'hidden' && !p.is_active);

    const matchesStock = selectedStock === 'all' ||
                        (selectedStock === 'in_stock' && p.stock > 0) ||
                        (selectedStock === 'out_of_stock' && p.stock === 0) ||
                        (selectedStock === 'low_stock' && p.stock <= p.low_stock_threshold);

    const matchesPriceType = selectedPriceType === 'all' ||
                            (selectedPriceType === 'fixed' && typeof p.price === 'number') ||
                            (selectedPriceType === 'contact' && p.price === 'Liên hệ');

    const matchesMissingImages = !missingImagesOnly || p.images.length === 0;

    return matchesSearch && matchesCategory && matchesStatus && matchesStock && matchesPriceType && matchesMissingImages;
  });

  const handleExportCSV = () => {
    triggerToast("Đã mô phỏng kết xuất 100% dữ liệu sản phẩm thành file gnest_products_export.csv", "success");
  };

  const handleImportCSV = () => {
    triggerToast("Tính năng nhập sỉ dữ liệu qua file CSV sẫn sàng. Chọn file Excel/CSV mẫu để cập nhật hàng loạt.", "success");
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
      
      {/* KPI mini row inside tab */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-3 bg-slate-50 border border-slate-200/50 rounded-xl">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">TỔNG SẢN PHẨM</p>
          <p className="text-lg font-bold text-[#1B3A6B] mt-1">{totalCount}</p>
        </div>
        <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider font-mono">ĐANG HIỂN THỊ</p>
          <p className="text-lg font-bold text-emerald-700 mt-1">{activeCount}</p>
        </div>
        <div className="p-3 bg-slate-50 border border-slate-200/50 rounded-xl">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">ĐANG ẨN</p>
          <p className="text-lg font-bold text-slate-500 mt-1">{hiddenCount}</p>
        </div>
        <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
          <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider font-mono">CẢNH BÁO HẾT/THẤP KHO</p>
          <p className="text-lg font-bold text-amber-700 mt-1">{lowStockCount}</p>
        </div>
      </div>

      {/* Title & Batch Options Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-100 mb-6">
        <div>
          <h2 className="text-base font-bold text-[#1B3A6B]">Danh Sách Sản Phẩm (Catalog)</h2>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Quản trị giá bán sỉ theo bậc số lượng, thông số kỹ thuật và hình ảnh mô tả
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleImportCSV} 
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-slate-500" /> Nhập CSV
          </button>
          
          <button
            onClick={handleExportCSV} 
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Xuất dữ liệu
          </button>

          <button
            onClick={() => onOpenDrawer('product_add')}
            className="bg-[#1B3A6B] text-white hover:bg-[#112546] hover:shadow-md transition-all text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Đăng sản phẩm
          </button>
        </div>
      </div>

      {/* Advanced Filter Strip */}
      <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl text-xs space-y-3 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          
          <div className="flex flex-wrap gap-2.5 items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1">
              <ListFilter className="w-3.5 h-3.5" /> Lọc nâng cao:
            </span>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hiển thị</option>
              <option value="hidden">Đang ẩn</option>
            </select>

            {/* Stock Levels */}
            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
            >
              <option value="all">Sản lượng tồn kho</option>
              <option value="in_stock">Còn hàng (Sỉ)</option>
              <option value="low_stock">Tồn kho thấp</option>
              <option value="out_of_stock">Hết hàng hiển thị</option>
            </select>

            {/* Price Type */}
            <select
              value={selectedPriceType}
              onChange={(e) => setSelectedPriceType(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
            >
              <option value="all">Kiểu hiển thị giá</option>
              <option value="fixed">Có giá niêm yết</option>
              <option value="contact">Giá Liên hệ tư vấn</option>
            </select>
          </div>

          {/* Missing Image checkbox */}
          <label className="flex items-center gap-2 cursor-pointer bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-medium hover:bg-slate-100 transition-colors">
            <input 
              type="checkbox"
              checked={missingImagesOnly}
              onChange={(e) => setMissingImagesOnly(e.target.checked)}
              className="rounded-md border-slate-300 text-[#1B3A6B] focus:ring-[#1B3A6B]"
            />
            <span className="text-[11px] text-slate-700">Chỉ hàng chưa có ảnh</span>
          </label>

        </div>
      </div>

      {/* Products Row Table */}
      {filteredProducts.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
          <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-bold text-sm">Không tìm thấy sản phẩm nào khớp bộ lọc</p>
          <p className="text-slate-400 text-xs mt-1">Vui lòng thay đổi từ khóa tìm kiếm hoặc tắt bộ lọc hàng chưa có ảnh.</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-6 px-6 lg:mx-0 lg:px-0">
          <table className="w-full text-xs text-left min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <th className="p-4 w-16">Ảnh</th>
                <th className="p-4">Tên sản phẩm</th>
                <th className="p-4">Danh mục</th>
                <th className="p-4">Giá bán lẻ tham khảo</th>
                <th className="p-4">Kho sỉ</th>
                <th className="p-4">Ảnh sỉ</th>
                <th className="p-4 text-center">Bậc giá sỉ</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4">Cập nhật</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {filteredProducts.map((p, index) => {
                const primaryImg = p.images.find(im => im.is_primary) || p.images[0];
                const isLowStock = p.stock <= p.low_stock_threshold;
                const isEven = index % 2 === 0;
                
                return (
                  <tr 
                    key={p.id} 
                    className={`hover:bg-slate-50/60 transition-colors ${
                      isEven ? 'bg-white' : 'bg-[#F7F9FB]/80'
                    }`}
                  >
                    <td className="p-4">
                      {primaryImg ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 relative bg-slate-100">
                          <img 
                            src={primaryImg.url} 
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg border border-dashed border-rose-300 bg-rose-50 flex items-center justify-center text-rose-500" title="Chưa có hình ảnh">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800 hover:text-[#1B3A6B] transition-colors cursor-pointer text-[13px]"
                          onClick={() => onOpenDrawer('preview_product', p)}>
                        {p.name}
                      </p>
                      <span className="text-[9px] font-mono text-slate-400">/{p.slug}</span>
                    </td>
                    <td className="p-4 text-slate-600 font-medium">{getCategoryName(p.category_id)}</td>
                    <td className="p-4 font-semibold text-slate-800">
                      {typeof p.price === 'number' ? (
                        <span>{p.price.toLocaleString('vi-VN')} đ <span className="text-[10px] text-slate-400">/{p.unit}</span></span>
                      ) : (
                        <span className="text-[#1B3A6B] font-bold">Liên hệ</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-slate-700">{p.stock.toLocaleString('vi-VN')}</span>
                        {isLowStock && (
                          <span className="block text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-100 max-w-max">
                            Tồn thấp
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        p.images.length === 0 ? 'bg-red-50 text-red-500 border border-red-100 font-bold' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {p.images.length} ảnh
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {p.bulk_discounts.length > 0 ? (
                        <span className="px-2 py-0.5 bg-[#1B3A6B]/5 text-[#1B3A6B] text-[10px] rounded-md font-bold border border-[#1B3A6B]/15">
                          {p.bulk_discounts.length} bậc sỉ
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => onToggleProductStatus(p)}
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                          p.is_active 
                             ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                             : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200/50'
                        }`}
                      >
                        {p.is_active ? 'Ẩn phẩm' : 'Đang hiện'}
                      </button>
                    </td>
                    <td className="p-4 font-mono text-[10px] text-slate-400">
                      <FormattedDate date={p.updated_at} type="date" />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button 
                          onClick={() => onOpenDrawer('preview_product', p)}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg border border-slate-200"
                          title="Xem trước mẫu"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        
                        <button 
                          onClick={() => onOpenDrawer('product_edit', p)}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg border border-slate-200"
                          title="Chỉnh sửa chi tiết"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
 
                        <button 
                          onClick={() => onCloneProduct(p)}
                          className="p-1.5 hover:bg-[#1B3A6B]/5 text-slate-500 hover:text-[#1B3A6B] rounded-lg border border-slate-200"
                          title="Nhân bản sỉ"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
 
                        <button 
                          onClick={() => onDeleteProduct(p.id)}
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-[#E31E24] rounded-lg border border-slate-200"
                          title="Xóa mềm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
        <p>Tìm thấy {filteredProducts.length} sản phẩm tương thích.</p>
        <p className="flex items-center gap-1 font-mono uppercase tracking-wider text-[#1B3A6B] font-bold">
          <Check className="w-3 h-3 text-emerald-500" /> Catalog sync ready
        </p>
      </div>

    </div>
  );
}
