'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  FolderTree, 
  Table, 
  Eye, 
  EyeOff, 
  ChevronRight, 
  ChevronDown, 
  Edit2, 
  Trash2,
  ListFilter,
  Check,
  FolderOpen
} from 'lucide-react';
import { Category, Product } from '@/lib/mock-data';

interface CategoriesTabProps {
  categories: Category[];
  products: Product[];
  onOpenDrawer: (type: string, data?: any) => void;
  onDeleteCategory: (id: string) => void;
  searchText: string;
}

export default function CategoriesTab({
  categories,
  products,
  onOpenDrawer,
  onDeleteCategory,
  searchText
}: CategoriesTabProps) {
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');
  const [filterType, setFilterType] = useState<string>('all'); // all | products | services
  const [filterStatus, setFilterStatus] = useState<string>('all'); // all | active | hidden
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({
    'cat-1': true,
    'cat-2': true,
    'cat-3': true,
    'cat-4': true
  });

  const toggleExpand = (id: string) => {
    setExpandedParents(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Helper count of products in category
  const getProductCount = (catId: string) => {
    // Count directly in this category OR child subcategories
    const childIds = categories.filter(c => c.parent_id === catId).map(c => c.id);
    return products.filter(p => p.category_id === catId || childIds.includes(p.category_id)).length;
  };

  // Filter logic
  const filteredCategories = categories.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchText.toLowerCase()) || 
                          c.slug.toLowerCase().includes(searchText.toLowerCase());
    
    const isService = c.type === 'Dịch vụ';
    const matchesType = filterType === 'all' || 
                        (filterType === 'products' && !isService) || 
                        (filterType === 'services' && isService);
                        
    const matchesStatus = filterStatus === 'all' ||
                          (filterStatus === 'active' && c.is_active) ||
                          (filterStatus === 'hidden' && !c.is_active);

    return matchesSearch && matchesType && matchesStatus;
  });

  // Get parent name
  const getParentName = (parentId: string | null) => {
    if (!parentId) return '—';
    const parent = categories.find(c => c.id === parentId);
    return parent ? parent.name : '—';
  };

  // Group categories by parents
  const parentCategories = filteredCategories.filter(c => c.parent_id === null);
  const getChildrenOf = (parentId: string) => {
    return filteredCategories.filter(c => c.parent_id === parentId);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-100 mb-6">
        <div>
          <h2 className="text-base font-bold text-[#1B3A6B]">Danh Mục Website Gnest</h2>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Quản lý cấu trúc cây danh mục Sản phẩm / Dịch vụ hiển thị ngoài catalog menu
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* View toggle group */}
          <div className="flex bg-slate-50 border border-slate-200 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                viewMode === 'tree' 
                  ? 'bg-white shadow-xs text-[#1B3A6B] font-bold' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" /> Dạng Cây (Tree)
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                viewMode === 'table' 
                  ? 'bg-white shadow-xs text-[#1B3A6B] font-bold' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Table className="w-3.5 h-3.5" /> Dạng Bảng (Table)
            </button>
          </div>

          <button
            onClick={() => onOpenDrawer('category_add')}
            className="bg-[#1B3A6B] text-white hover:bg-[#112546] hover:shadow-md transition-all text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Thêm danh mục
          </button>
        </div>
      </div>

      {/* Filters Area */}
      <div className="flex flex-wrap gap-2.5 mb-6 bg-slate-50 border border-slate-200/60 p-3 rounded-xl text-xs">
        <div className="flex items-center gap-2 text-slate-400 font-medium font-mono text-[10px] uppercase">
          <ListFilter className="w-3.5 h-3.5 text-slate-400" /> Bộ lọc:
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
        >
          <option value="all">Tất cả loại</option>
          <option value="products">Sản phẩm</option>
          <option value="services">Dịch vụ</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
        >
          <option value="all">Mọi trạng thái</option>
          <option value="active">Đang hiển thị</option>
          <option value="hidden">Đang ẩn</option>
        </select>
      </div>

      {/* Categories Content Views */}
      {filteredCategories.length === 0 ? (
        // Empty State
        <div className="py-16 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
          <FolderTree className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-bold text-sm">Không tìm thấy danh mục nào</p>
          <p className="text-slate-400 text-xs mt-1">Vui lòng thay đổi từ khóa hoặc bộ lọc của bạn.</p>
        </div>
      ) : viewMode === 'tree' ? (
        
        /* TREE VIEW */
        <div className="space-y-3">
          {parentCategories.map((parent) => {
            const children = getChildrenOf(parent.id);
            const isExpanded = !!expandedParents[parent.id];
            const parentProductCount = getProductCount(parent.id);
            
            return (
              <div key={parent.id} className="border border-slate-100 bg-white rounded-2xl overflow-hidden shadow-xs hover:border-slate-200/80 transition-colors">
                
                {/* Node Row Header (Parent) */}
                <div className="p-3.5 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => toggleExpand(parent.id)}
                      className="p-1 hover:bg-slate-200 rounded-md text-slate-500"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    
                    <FolderOpen className="w-4.5 h-4.5 text-[#1B3A6B]" />
                    
                    <div>
                      <span className="font-bold text-slate-800 text-xs">{parent.name}</span>
                      <span className="ml-2 font-mono text-[9px] text-slate-400 bg-slate-200/50 border border-slate-300/10 px-1.5 py-0.5 rounded-sm">
                        /{parent.slug}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <span className="font-semibold text-[10px] text-slate-400 font-mono">
                      {parent.type.toUpperCase()}
                    </span>

                    <span className="px-2 py-0.5 bg-[#1B3A6B]/5 text-[#1B3A6B] text-[10px] font-bold rounded-full font-mono border border-[#1B3A6B]/10">
                      {parentProductCount} SP
                    </span>

                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                      parent.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {parent.is_active ? 'Hiển thị' : 'Mở ẩn'}
                    </span>

                    <div className="flex gap-1">
                      <button 
                        onClick={() => onOpenDrawer('category_edit', parent)}
                        className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition-colors border border-slate-200"
                        title="Sửa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => onDeleteCategory(parent.id)}
                        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-[#E31E24] rounded-lg transition-colors border border-slate-200"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Indented Node Row Body (Children) */}
                {isExpanded && (
                  <div className="divide-y divide-slate-50 bg-white">
                    {children.length === 0 ? (
                      <div className="pl-14 pr-6 py-4 text-center text-[10px] text-slate-400 italic">
                        Không có danh mục con trực thuộc
                      </div>
                    ) : (
                      children.map((child) => {
                        const childProductCount = products.filter(p => p.category_id === child.id).length;
                        return (
                          <div key={child.id} className="pl-12 pr-4 py-2.5 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="h-px w-4 bg-slate-300"></span>
                              <FolderOpen className="w-4 h-4 text-slate-400" />
                              <div>
                                <span className="font-semibold text-slate-700 text-xs">{child.name}</span>
                                <span className="ml-2 font-mono text-[9px] text-slate-400">/{child.slug}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs">
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded-md font-mono font-medium">
                                {childProductCount} SP
                              </span>

                              <span className={`px-1.5 py-0.2 rounded-sm text-[10px] font-medium ${
                                child.is_active ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'
                              }`}>
                                {child.is_active ? 'Hiển thị' : 'Mở ẩn'}
                              </span>

                              <div className="flex gap-1">
                                <button 
                                  onClick={() => onOpenDrawer('category_edit', child)}
                                  className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-md border border-slate-200"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => onDeleteCategory(child.id)}
                                  className="p-1 hover:bg-red-50 text-slate-400 hover:text-[#E31E24] rounded-md border border-slate-200"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      ) : (
        
        /* TABLE VIEW */
        <div className="overflow-x-auto -mx-6 px-6 lg:mx-0 lg:px-0">
          <table className="w-full text-xs text-left min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <th className="p-3">Tên danh mục</th>
                <th className="p-3">Slug / Đường dẫn</th>
                <th className="p-3">Loại</th>
                <th className="p-3">Danh mục cha</th>
                <th className="p-3">Số sản phẩm</th>
                <th className="p-3">Thứ tự</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCategories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 font-semibold text-slate-800">{cat.name}</td>
                  <td className="p-3 font-mono text-slate-400">/{cat.slug}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded-md font-mono">
                      {cat.type}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">{getParentName(cat.parent_id)}</td>
                  <td className="p-3 font-mono font-medium">{getProductCount(cat.id)}</td>
                  <td className="p-3 font-mono">{cat.sort_order}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                      cat.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {cat.is_active ? 'Hiển thị' : 'Đang ẩn'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button 
                        onClick={() => onOpenDrawer('category_edit', cat)}
                        className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-md border border-slate-200"
                        title="Sửa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => onDeleteCategory(cat.id)}
                        className="p-1 hover:bg-red-50 text-slate-400 hover:text-[#E31E24] rounded-md border border-slate-200"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer Help Indicator */}
      <div className="mt-6 flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/50 text-[11px] text-slate-500">
        <p className="flex items-center gap-1.5">
          <ChevronRight className="w-3.5 h-3.5 text-[#E31E24]" /> Nhấp vào <span className="font-bold text-[#1B3A6B]">Xem trước URL sỉ</span> để mô phỏng hiển thị trên trang phía người dùng đại lý.
        </p>
        <span className="font-mono text-[10px] text-slate-400 font-semibold uppercase">PREVIEW: /danh-muc/[slug]</span>
      </div>

    </div>
  );
}
