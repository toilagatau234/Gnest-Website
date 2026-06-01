'use client';

import { useMemo, useState } from 'react';
import { 
  FolderTree, 
  Table, 
  ChevronRight, 
  ChevronDown, 
  ListFilter,
  Check,
  FolderOpen,
  FolderClosed,
} from 'lucide-react';

import { CategoryFormDialog } from '@/components/admin/CategoryFormDialog';
import { CategoryRowActions } from '@/components/admin/CategoryRowActions';
import type { AdminCategory } from '@/lib/services/admin/categories';

interface CategoriesTableProps {
  categories: AdminCategory[];
}

type ViewMode = 'tree' | 'table';
type TypeFilter = 'all' | 'product' | 'service';
type StatusFilter = 'all' | 'active' | 'hidden';

export function CategoriesTable({ categories }: CategoriesTableProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Collapsible parents state
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedParents(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter logic
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return categories.filter((category) => {
      // 1. Search Query
      if (normalized) {
        const matchesName = category.name.toLowerCase().includes(normalized);
        const matchesSlug = category.slug.toLowerCase().includes(normalized);
        if (!matchesName && !matchesSlug) return false;
      }
      // 2. Type Filter
      if (typeFilter !== 'all' && category.type !== typeFilter) {
        return false;
      }
      // 3. Status Filter
      if (statusFilter === 'active' && !category.is_active) {
        return false;
      }
      if (statusFilter === 'hidden' && category.is_active) {
        return false;
      }
      return true;
    });
  }, [categories, query, typeFilter, statusFilter]);

  // Group parents and children
  const parentCategories = useMemo(() => {
    return filtered.filter(c => c.parent_id === null || !categories.some(parent => parent.id === c.parent_id));
  }, [filtered, categories]);

  const getChildrenOf = (parentId: string) => {
    return filtered.filter(c => c.parent_id === parentId);
  };

  const getParentName = (parentId: string | null) => {
    if (!parentId) return '—';
    const parent = categories.find(c => c.id === parentId);
    return parent ? parent.name : '—';
  };

  return (
    <div className="space-y-6">
      
      {/* Visual top bar of categories card */}
      <div className="space-y-6 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-6">
        
        {/* Top Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#1B3A6B]">Danh Mục Website Gnest</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Quản lý cấu trúc cây danh mục Sản phẩm / Dịch vụ hiển thị ngoài catalog menu
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {/* View toggle group */}
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('tree')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'tree' 
                    ? 'bg-white shadow-xs text-[#1B3A6B] font-bold' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <FolderTree className="w-3.5 h-3.5" /> Dạng Cây (Tree)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'table' 
                    ? 'bg-white shadow-xs text-[#1B3A6B] font-bold' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Table className="w-3.5 h-3.5" /> Dạng Bảng (Table)
              </button>
            </div>

            {/* Real React 19 category create form dialog styled exactly as template trigger */}
            <CategoryFormDialog categories={categories} />
          </div>
        </div>

        {/* Filters Area */}
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200/60 bg-slate-50 p-4 text-xs xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1">
              <ListFilter className="w-3.5 h-3.5" /> Bộ lọc danh mục:
            </span>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] text-slate-700"
            >
              <option value="all">Tất cả loại</option>
              <option value="product">Sản phẩm</option>
              <option value="service">Dịch vụ</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] text-slate-700"
            >
              <option value="all">Mọi trạng thái</option>
              <option value="active">Đang hiển thị</option>
              <option value="hidden">Đang ẩn</option>
            </select>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-56">
            <input
              type="text"
              placeholder="Tìm danh mục..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
            />
            <FolderClosed className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
          </div>
        </div>

        {/* Categories Content Views */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <FolderTree className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-bold text-sm">Không tìm thấy danh mục nào khớp bộ lọc</p>
            <p className="text-slate-400 text-xs mt-1">Vui lòng thay đổi từ khóa hoặc bộ lọc của bạn.</p>
          </div>
        ) : viewMode === 'tree' ? (
          
          /* COLLAPSIBLE TREE VIEW */
          <div className="space-y-3">
            {parentCategories.map((parent) => {
              const children = getChildrenOf(parent.id);
              const isExpanded = !!expandedParents[parent.id];

              return (
                <div 
                  key={parent.id} 
                  className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xs transition-colors hover:border-slate-200/80"
                >
                  {/* Node Row Header (Parent) */}
                  <div className="flex flex-col gap-3 bg-slate-50/50 p-3.5 hover:bg-slate-50 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <button 
                        type="button"
                        onClick={() => toggleExpand(parent.id)}
                        className="p-1 hover:bg-slate-200 rounded-md text-slate-500 cursor-pointer"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      
                      <FolderOpen className="w-4.5 h-4.5 text-[#1B3A6B]" />
                      
                      <div className="min-w-0">
                        <span className="block truncate text-xs font-bold text-slate-800">{parent.name}</span>
                        <span className="ml-2 font-mono text-[9px] text-slate-400 bg-slate-200/50 border border-slate-300/10 px-1.5 py-0.5 rounded-sm">
                          /{parent.slug}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs lg:justify-end">
                      <span className="font-semibold text-[10px] text-slate-400 font-mono">
                        {parent.type === 'service' ? 'DỊCH VỤ' : 'SẢN PHẨM'}
                      </span>

                      <span className="px-2 py-0.5 bg-[#1B3A6B]/5 text-[#1B3A6B] text-[10px] font-mono border border-[#1B3A6B]/10 rounded-md">
                        Mục #{parent.sort_order}
                      </span>

                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                        parent.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {parent.is_active ? 'Hiển thị' : 'Đang ẩn'}
                      </span>

                      <CategoryRowActions categories={categories} category={parent} />
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
                        children.map((child) => (
                          <div 
                            key={child.id} 
                            className="flex flex-col gap-3 py-2.5 pl-12 pr-4 transition-colors hover:bg-slate-50/50 lg:flex-row lg:items-center lg:justify-between"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="h-px w-4 bg-slate-300"></span>
                              <FolderOpen className="w-4 h-4 text-slate-400" />
                              <div className="min-w-0">
                                <span className="block truncate text-xs font-semibold text-slate-700">{child.name}</span>
                                <span className="ml-2 font-mono text-[9px] text-slate-400">/{child.slug}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs lg:justify-end">
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded-md font-mono font-medium">
                                Thứ tự #{child.sort_order}
                              </span>

                              <span className={`rounded-sm px-1.5 py-px text-[10px] font-medium ${
                                child.is_active ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'
                              }`}>
                                {child.is_active ? 'Hiển thị' : 'Đang ẩn'}
                              </span>

                              <CategoryRowActions categories={categories} category={child} compact />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          
          /* STANDARD TABLE VIEW */
          <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
            <table className="w-full text-xs text-left min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="p-3">Tên danh mục</th>
                  <th className="p-3">Slug / Đường dẫn</th>
                  <th className="p-3">Loại</th>
                  <th className="p-3">Danh mục cha</th>
                  <th className="p-3">Thứ tự</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 font-semibold text-slate-800">{cat.name}</td>
                    <td className="p-3 font-mono text-slate-400">/{cat.slug}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded-md font-mono uppercase font-bold tracking-wider">
                        {cat.type === 'service' ? 'Dịch vụ' : 'Sản phẩm'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{getParentName(cat.parent_id)}</td>
                    <td className="p-3 font-mono">{cat.sort_order}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                        cat.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {cat.is_active ? 'Hiển thị' : 'Đang ẩn'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end">
                        <CategoryRowActions categories={categories} category={cat} />
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
            <Check className="w-3.5 h-3.5 text-emerald-600" /> Đồng bộ sơ đồ cây danh mục sỉ an toàn với Supabase PostgreSQL.
          </p>
          <span className="font-mono text-[9px] text-slate-400 font-semibold uppercase">Menu Tree Mapping Connected</span>
        </div>

      </div>
    </div>
  );
}
