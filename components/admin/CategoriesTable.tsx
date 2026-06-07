'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import {
  ChevronRight,
  Check,
  Eye,
  EyeOff,
  FolderClosed,
  FolderOpen,
  FolderTree,
  Layers3,
  ListFilter,
  Search,
  Table,
} from 'lucide-react';

import { CategoryRowActions } from '@/components/admin/CategoryRowActions';
import type { AdminCategory } from '@/lib/services/admin/categories';

import type { CategoryType } from '@/lib/types/database';

interface CategoriesTableProps {
  categories: AdminCategory[];
  fixedType?: CategoryType;
}

type ViewMode = 'tree' | 'table';
type TypeFilter = 'all' | 'product' | 'service';
type StatusFilter = 'all' | 'active' | 'hidden';

interface CategoryFilterBarProps {
  query: string;
  typeFilter: TypeFilter;
  statusFilter: StatusFilter;
  onQueryChange: (value: string) => void;
  onTypeFilterChange: (value: TypeFilter) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  fixedType?: CategoryType;
}

interface CategoryViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (value: ViewMode) => void;
}

interface CategoryTreeViewProps {
  categories: AdminCategory[];
  parentCategories: AdminCategory[];
  childrenByParentId: Map<string, AdminCategory[]>;
  expandedParents: Record<string, boolean>;
  onToggleExpand: (id: string) => void;
  fixedType?: CategoryType;
}

interface CategoryTableViewProps {
  categories: AdminCategory[];
  allCategories: AdminCategory[];
  categoryById: Map<string, AdminCategory>;
  fixedType?: CategoryType;
}

function CategoryTypeBadge({ type }: { type: AdminCategory['type'] }) {
  return (
    <span className="admin-badge border-[#DDE5F8] bg-[#4880FF]/10 text-[#3749A6]">
      {type === 'service' ? 'Dịch vụ' : 'Sản phẩm'}
    </span>
  );
}

function CategoryStatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`admin-badge ${active ? 'admin-status-active' : 'admin-status-muted'}`}>
      {active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
      {active ? 'Hiển thị' : 'Đang ẩn'}
    </span>
  );
}

function CategoryViewToggle({ viewMode, onViewModeChange }: CategoryViewToggleProps) {
  return (
    <div className="flex rounded-xl border border-[#E5E7EF] bg-[#F5F6FA] p-1 text-xs font-bold">
      <button
        type="button"
        onClick={() => onViewModeChange('tree')}
        className={`admin-focus inline-flex h-8 items-center gap-1.5 rounded-lg px-3 transition ${
          viewMode === 'tree'
            ? 'bg-white text-[#3749A6] shadow-sm'
            : 'text-[#646464] hover:text-[#202224]'
        }`}
      >
        <FolderTree className="h-3.5 w-3.5" />
        Dạng cây
      </button>
      <button
        type="button"
        onClick={() => onViewModeChange('table')}
        className={`admin-focus inline-flex h-8 items-center gap-1.5 rounded-lg px-3 transition ${
          viewMode === 'table'
            ? 'bg-white text-[#3749A6] shadow-sm'
            : 'text-[#646464] hover:text-[#202224]'
        }`}
      >
        <Table className="h-3.5 w-3.5" />
        Dạng bảng
      </button>
    </div>
  );
}

function CategoryFilterBar({
  query,
  typeFilter,
  statusFilter,
  onQueryChange,
  onTypeFilterChange,
  onStatusFilterChange,
  fixedType,
}: CategoryFilterBarProps) {
  return (
    <div className="admin-soft-panel flex flex-col gap-3 p-4 text-xs xl:flex-row xl:items-center xl:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-2.5">
        <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#646464]">
          <ListFilter className="h-3.5 w-3.5" />
          Bộ lọc
        </span>

        {!fixedType && (
          <select
            value={typeFilter}
            onChange={(event) => onTypeFilterChange(event.target.value as TypeFilter)}
            className="admin-select h-9 w-auto min-w-36 text-xs"
          >
            <option value="all">Tất cả loại</option>
            <option value="product">Sản phẩm</option>
            <option value="service">Dịch vụ</option>
          </select>
        )}

        <select
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value as StatusFilter)}
          className="admin-select h-9 w-auto min-w-40 text-xs"
        >
          <option value="all">Mọi trạng thái</option>
          <option value="active">Đang hiển thị</option>
          <option value="hidden">Đang ẩn</option>
        </select>
      </div>

      <div className="relative w-full sm:w-64">
        <input
          type="search"
          placeholder={fixedType === 'service' ? "Tìm dịch vụ..." : "Tìm danh mục..."}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="admin-input h-9 pl-9 text-xs"
        />
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  );
}

function CategoryTreeView({
  categories,
  parentCategories,
  childrenByParentId,
  expandedParents,
  onToggleExpand,
  fixedType,
}: CategoryTreeViewProps) {
  return (
    <div className="space-y-3">
      {parentCategories.map((parent) => {
        const children = childrenByParentId.get(parent.id) ?? [];
        const isExpanded = Boolean(expandedParents[parent.id]);
        const hasChildren = children.length > 0;

        return (
          <div
            key={parent.id}
            className="overflow-hidden rounded-2xl border border-[#E5E7EF] bg-white shadow-sm transition-colors hover:border-[#D8DEEC]"
          >
            <div className="flex flex-col gap-3 bg-[#F7F9FB] p-3.5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => onToggleExpand(parent.id)}
                  disabled={!hasChildren}
                  aria-label={isExpanded ? 'Thu gọn danh mục con' : 'Mở danh mục con'}
                  className="admin-focus inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#646464] transition-colors hover:bg-white hover:text-[#3749A6] disabled:cursor-default disabled:opacity-40"
                >
                  <ChevronRight
                    className={`h-4 w-4 transition-transform duration-200 ${
                      isExpanded ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4880FF]/10 text-[#4880FF]">
                  <FolderOpen className="h-5 w-5" />
                </span>

                <div className="min-w-0">
                  <span className="block truncate text-sm font-extrabold text-[#202224]">
                    {parent.name}
                  </span>
                  <span className="mt-0.5 inline-flex max-w-full truncate rounded-md bg-white px-2 py-0.5 font-mono text-[10px] font-semibold text-[#646464] ring-1 ring-[#E5E7EF]">
                    /{parent.slug}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                {!fixedType && <CategoryTypeBadge type={parent.type} />}
                <span className="admin-badge border-[#E5E7EF] bg-white text-[#646464]">
                  #{parent.sort_order}
                </span>
                <span className="admin-badge border-[#E5E7EF] bg-white text-[#646464]">
                  {children.length} mục con
                </span>
                <CategoryStatusBadge active={parent.is_active} />
                <CategoryRowActions categories={categories} category={parent} fixedType={fixedType} />
              </div>
            </div>

            {isExpanded ? (
              <div className="divide-y divide-[#EEF2F6] bg-white">
                {hasChildren ? (
                  children.map((child) => (
                    <div
                      key={child.id}
                      className="relative flex flex-col gap-3 py-3 pl-12 pr-4 transition-colors before:absolute before:left-8 before:top-0 before:h-full before:w-px before:bg-[#E5E7EF] hover:bg-[#F7F9FB] lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="relative z-10 h-px w-5 shrink-0 bg-[#C9D2E6]" />
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                          <FolderClosed className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <span className="block truncate text-sm font-bold text-[#202224]">
                            {child.name}
                          </span>
                          <span className="font-mono text-[10px] font-semibold text-[#646464]">
                            /{child.slug}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        {!fixedType && <CategoryTypeBadge type={child.type} />}
                        <span className="admin-badge border-[#E5E7EF] bg-[#F7F9FB] text-[#646464]">
                          #{child.sort_order}
                        </span>
                        <CategoryStatusBadge active={child.is_active} />
                        <CategoryRowActions categories={categories} category={child} compact fixedType={fixedType} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-5 text-center text-xs font-medium text-[#646464]">
                    Không có danh mục con trực thuộc.
                  </div>
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function CategoryTableView({ categories, allCategories, categoryById, fixedType }: CategoryTableViewProps) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
      <table className="w-full min-w-[860px] text-left text-xs">
        <thead>
          <tr className="border-b border-[#E5E7EF] bg-[#F7F9FB] text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#646464]">
            <th className="p-3.5">{fixedType === 'service' ? 'Tên dịch vụ' : 'Tên danh mục'}</th>
            <th className="p-3.5">Slug</th>
            {!fixedType && <th className="p-3.5">Loại</th>}
            {fixedType !== 'service' && <th className="p-3.5">Danh mục cha</th>}
            <th className="p-3.5">Display Priority</th>
            <th className="p-3.5">Trạng thái</th>
            <th className="p-3.5 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EEF2F6]">
          {categories.map((category) => {
            const parent = category.parent_id ? categoryById.get(category.parent_id) : null;

            return (
              <tr key={category.id} className="transition-colors hover:bg-[#F7F9FB]">
                <td className="p-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#4880FF]/10 text-[#4880FF]">
                      <FolderTree className="h-4 w-4" />
                    </span>
                    <span className="font-bold text-[#202224]">{category.name}</span>
                  </div>
                </td>
                <td className="p-3.5 font-mono font-semibold text-[#646464]">/{category.slug}</td>
                {!fixedType && (
                  <td className="p-3.5">
                    <CategoryTypeBadge type={category.type} />
                  </td>
                )}
                {fixedType !== 'service' && <td className="p-3.5 text-[#646464]">{parent ? parent.name : '—'}</td>}
                <td className="p-3.5 font-mono font-semibold text-[#646464]">
                  {category.sort_order}
                </td>
                <td className="p-3.5">
                  <CategoryStatusBadge active={category.is_active} />
                </td>
                <td className="p-3.5 text-right">
                  <div className="flex justify-end">
                    <CategoryRowActions categories={allCategories} category={category} fixedType={fixedType} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function CategoriesTable({ categories, fixedType }: CategoriesTableProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(fixedType ?? 'all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});
  const deferredQuery = useDeferredValue(query);

  const categoryById = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category]));
  }, [categories]);

  const filtered = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();

    return categories.filter((category) => {
      if (normalized) {
        const matchesName = category.name.toLowerCase().includes(normalized);
        const matchesSlug = category.slug.toLowerCase().includes(normalized);
        if (!matchesName && !matchesSlug) {
          return false;
        }
      }

      if (typeFilter !== 'all' && category.type !== typeFilter) {
        return false;
      }

      if (statusFilter === 'active' && !category.is_active) {
        return false;
      }

      if (statusFilter === 'hidden' && category.is_active) {
        return false;
      }

      return true;
    });
  }, [categories, deferredQuery, typeFilter, statusFilter]);

  const childrenByParentId = useMemo(() => {
    const groups = new Map<string, AdminCategory[]>();

    for (const category of filtered) {
      if (!category.parent_id) {
        continue;
      }

      const currentChildren = groups.get(category.parent_id) ?? [];
      currentChildren.push(category);
      groups.set(category.parent_id, currentChildren);
    }

    return groups;
  }, [filtered]);

  const filteredCategoryIds = useMemo(() => {
    return new Set(filtered.map((category) => category.id));
  }, [filtered]);

  const parentCategories = useMemo(() => {
    return filtered.filter((category) => {
      return !category.parent_id || !filteredCategoryIds.has(category.parent_id);
    });
  }, [filtered, filteredCategoryIds]);

  const toggleExpand = (id: string) => {
    setExpandedParents((current) => ({ ...current, [id]: !current[id] }));
  };

  return (
    <div className="admin-stagger-item space-y-5">
      <div className="admin-card space-y-5 p-4 sm:p-6">
        <div className="flex flex-col justify-between gap-4 border-b border-[#EEF2F6] pb-4 lg:flex-row lg:items-center">
          <div className="min-w-0">
            <h2 className="text-base font-extrabold text-[#202224]">
              {fixedType === 'service' ? 'Danh sách dịch vụ chuyên nghiệp' : 'Cấu trúc danh mục sản phẩm'}
            </h2>
            <p className="mt-1 max-w-3xl text-xs font-medium leading-relaxed text-[#646464]">
              {fixedType === 'service'
                ? 'Quản lý các dịch vụ chuyên nghiệp hiển thị giới thiệu trên trang chủ.'
                : 'Quản lý cây danh mục sản phẩm đang hiển thị trong catalog và menu website.'}
            </p>
          </div>

          <CategoryViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>

        <CategoryFilterBar
          query={query}
          typeFilter={typeFilter}
          statusFilter={statusFilter}
          onQueryChange={setQuery}
          onTypeFilterChange={setTypeFilter}
          onStatusFilterChange={setStatusFilter}
          fixedType={fixedType}
        />

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D8DEEC] bg-[#F7F9FB] px-6 py-16 text-center">
            <FolderTree className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="text-sm font-extrabold text-[#202224]">
              {fixedType === 'service' ? 'Không tìm thấy dịch vụ nào khớp bộ lọc' : 'Không tìm thấy danh mục nào khớp bộ lọc'}
            </p>
            <p className="mt-1 text-xs font-medium text-[#646464]">
              Thử đổi từ khóa hoặc trạng thái hiển thị.
            </p>
          </div>
        ) : viewMode === 'tree' ? (
          <CategoryTreeView
            categories={categories}
            parentCategories={parentCategories}
            childrenByParentId={childrenByParentId}
            expandedParents={expandedParents}
            onToggleExpand={toggleExpand}
            fixedType={fixedType}
          />
        ) : (
          <CategoryTableView
            categories={filtered}
            allCategories={categories}
            categoryById={categoryById}
            fixedType={fixedType}
          />
        )}

        <div className="flex flex-col gap-2 rounded-2xl border border-[#E5E7EF] bg-[#F7F9FB] p-3.5 text-[11px] font-medium text-[#646464] sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            {fixedType === 'service'
              ? 'Danh sách dịch vụ được đồng bộ an toàn với Supabase PostgreSQL.'
              : 'Cấu trúc cây danh mục được đồng bộ an toàn với Supabase PostgreSQL.'}
          </p>
          <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-[0.12em] text-[#3749A6]">
            <Layers3 className="h-3.5 w-3.5" />
            {fixedType === 'service' ? 'Services mapping' : 'Menu tree mapping'}
          </span>
        </div>
      </div>
    </div>
  );
}
