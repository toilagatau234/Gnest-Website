"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Info,
  Layers,
  PackageSearch,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { getPublicProductsPageAction } from "@/app/actions/public-products";
import { useCategories } from "@/lib/categories-context";
import { useModal } from "@/lib/context";
import { CatalogCategory, CatalogItem } from "@/lib/data";
import { PublicProductCard } from "@/lib/services/public-products";
import { Interactive3DTilt } from "./Interactive3DTilt";
import { LazyProductImageDisplay } from "./LazyProductImageDisplay";

type ProductLoadStatus = "idle" | "loading" | "success" | "empty" | "error";

function FilterGroup({
  def,
  isFilterActive,
  handleFilterClick,
}: {
  def: { key: string; label: string; values: string[] };
  isFilterActive: (key: string, value: string) => boolean;
  handleFilterClick: (key: string, value: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border-b border-slate-100 py-3 last:border-b-0">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className="flex w-full items-center justify-between gap-3 text-left text-[11.5px] font-extrabold uppercase tracking-wider text-dtl-navy transition-colors hover:text-dtl-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dtl-navy/40"
      >
        <span>{def.label}</span>
        {isExpanded ? (
          <ChevronUp className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
        )}
      </button>

      {isExpanded ? (
        <div className="pt-2.5">
          <div className="flex flex-wrap gap-1.5">
            {def.values.map((val) => {
              const active = isFilterActive(def.key, val);
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleFilterClick(def.key, val)}
                  className={`inline-flex min-h-[30px] items-center justify-center rounded px-2.5 py-0.5 text-[11.5px] font-semibold transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dtl-navy/40 ${
                    active
                      ? "bg-dtl-navy text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-dtl-navy border border-transparent"
                  }`}
                >
                  {val}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 min-[340px]:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-lg bg-white border border-dtl-border"
        >
          <div className="aspect-square animate-pulse bg-slate-100" />
          <div className="space-y-3 border-t border-dtl-border p-4">
            <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
            <div className="h-5 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
            <div className="h-9 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CatalogPage({ slug }: { slug: string }) {
  const { openProductDetail } = useModal();
  const { catalog, categories, loading } = useCategories();
  const searchParams = useSearchParams();

  const [page, setPage] = useState(() => {
    const p = Number(searchParams.get("page"));
    return p > 0 ? p : 1;
  });
  const [status, setStatus] = useState<ProductLoadStatus>("idle");
  const [items, setItems] = useState<PublicProductCard[]>([]);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    () => {
      const filters: Record<string, string[]> = {};
      searchParams.forEach((value, key) => {
        if (key !== "page") {
          filters[key] = value.split(",").filter(Boolean);
        }
      });
      return filters;
    },
  );
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [prevSlug, setPrevSlug] = useState(slug);
  if (slug !== prevSlug) {
    setPrevSlug(slug);
    setPage(1);
    setActiveFilters({});
    setIsMobileSidebarOpen(false);
  }

  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileSidebarOpen]);

  // Sync filter + page state to URL without triggering router navigation
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    Object.entries(activeFilters).forEach(([key, values]) => {
      if (values.length > 0) params.set(key, values.join(","));
    });
    const query = params.toString();
    const path = window.location.pathname;
    window.history.replaceState(null, "", query ? `${path}?${query}` : path);
  }, [page, activeFilters]);

  useEffect(() => {
    let isCurrent = true;

    Promise.resolve().then(() => {
      if (!isCurrent) return;
      setStatus("loading");
      setLoadError(null);
    });

    getPublicProductsPageAction({
      categorySlug: slug,
      page,
      pageSize: 12,
      filters: activeFilters,
    })
      .then((res) => {
        if (!isCurrent) return;
        setItems(res.items);
        setTotal(res.total);
        setPageCount(res.pageCount);
        setStatus(res.items.length > 0 ? "success" : "empty");
      })
      .catch((err) => {
        if (!isCurrent) return;
        console.error("Failed to load products page:", err);
        setItems([]);
        setTotal(0);
        setPageCount(1);
        setLoadError(
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách sản phẩm lúc này.",
        );
        setStatus("error");
      });

    return () => {
      isCurrent = false;
    };
  }, [slug, page, activeFilters]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[420px] max-w-[1220px] flex-col items-center justify-center px-5 py-24">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white border border-dtl-border">
          <PackageSearch
            className="h-5 w-5 animate-pulse text-dtl-navy"
            aria-hidden="true"
          />
        </div>
        <p className="text-sm font-semibold text-slate-500">
          Đang tải thông tin sản phẩm...
        </p>
      </div>
    );
  }

  let categoryDetail: CatalogCategory | undefined = catalog[slug];

  if (categoryDetail && categoryDetail.type !== "product") {
    categoryDetail = undefined;
  }

  if (slug === "all") {
    const allDefs = Object.values(catalog)
      .filter((c) => c.hasFilters && c.filterDefs)
      .flatMap((c) => c.filterDefs || []);

    const mergedDefsMap = new Map<
      string,
      { key: string; label: string; values: Set<string> }
    >();

    allDefs.forEach((def) => {
      if (!mergedDefsMap.has(def.key)) {
        mergedDefsMap.set(def.key, {
          key: def.key,
          label: def.label,
          values: new Set(def.values),
        });
        return;
      }

      const existing = mergedDefsMap.get(def.key)!;
      def.values.forEach((value) => existing.values.add(value));
    });

    const extraFilters = Array.from(mergedDefsMap.values()).map((def) => ({
      key: def.key,
      label: def.label,
      values: Array.from(def.values),
    }));

    categoryDetail = {
      title: "Tất cả sản phẩm",
      type: "product",
      hasFilters: extraFilters.length > 0,
      filterDefs: extraFilters,
      items: [],
    };
  }

  if (!categoryDetail) {
    return (
      <div className="mx-auto max-w-[1220px] px-5 py-20 text-center">
        <p className="text-base font-semibold text-slate-500">
          Không tìm thấy danh mục này.
        </p>
        <Link
          href="/danh-muc"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-dtl-navy hover:text-dtl-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dtl-navy/40"
        >
          Xem tất cả sản phẩm
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  const handleFilterClick = (key: string, value: string) => {
    setActiveFilters((prev) => {
      const current = prev[key] || [];
      const nextValues = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];

      const nextFilters = { ...prev, [key]: nextValues };
      if (nextValues.length === 0) {
        delete nextFilters[key];
      }
      return nextFilters;
    });
    setPage(1);
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    setPage(1);
  };

  const isFilterActive = (key: string, value: string) =>
    activeFilters[key]?.includes(value) || false;

  const hasActiveFilters = Object.keys(activeFilters).length > 0;
  const activeFilterCount = Object.values(activeFilters).reduce(
    (count, values) => count + values.length,
    0,
  );

  const visibleItems: CatalogItem[] = items.map((card) => ({
    id: card.slug,
    name: card.name,
    img: card.thumbnailUrl || null,
    imgs: card.thumbnailUrl ? [card.thumbnailUrl] : [],
    price: card.price ?? undefined,
    stock: card.stock,
    categoryId: card.category_slug || "",
    dungTich: card.specs.dungTich,
    quyCach: card.specs.quyCach,
    phiNap: card.specs.phiNap,
    loaiNap: card.specs.loaiNap,
    color: card.specs.color,
    bulkDiscounts:
      card.hasActiveBulkDiscount && card.minBulkPrice
        ? [{ threshold: 10, pricePerUnit: card.minBulkPrice }]
        : undefined,
  }));

  const rootProductCategories = categories
    .filter((c) => c.type === "product" && !c.parentId)
    .sort((a, b) => {
      const orderA = a.sortOrder ?? 0;
      const orderB = b.sortOrder ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return a.title.localeCompare(b.title, "vi");
    });

  const childCategories = categories
    .filter((c) => c.type === "product" && !!c.parentId)
    .sort((a, b) => {
      const orderA = a.sortOrder ?? 0;
      const orderB = b.sortOrder ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return a.title.localeCompare(b.title, "vi");
    });

  const categorySortOrderMap = new Map<string, number>();
  categories.forEach((c) => {
    categorySortOrderMap.set(c.id, c.sortOrder ?? 0);
  });

  const sortedItems = [...visibleItems].sort((a, b) => {
    const orderA = categorySortOrderMap.get(a.categoryId) ?? 9999;
    const orderB = categorySortOrderMap.get(b.categoryId) ?? 9999;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name, "vi");
  });
  const activeRootCategory = rootProductCategories.find((category) => {
    if (category.id === slug) return true;
    return childCategories.some(
      (child) => child.id === slug && child.parentId === category.id,
    );
  });
  const activeChildCategories = activeRootCategory
    ? childCategories.filter((child) => child.parentId === activeRootCategory.id)
    : [];
  const activeFilterBadges = categoryDetail.filterDefs
    ? categoryDetail.filterDefs.flatMap((def) =>
        (activeFilters[def.key] ?? []).map((value) => ({
          key: def.key,
          label: def.label,
          value,
        })),
      )
    : [];

  const renderSidebarContent = (isMobile = false) => {
    return (
      <div className="flex flex-col h-full">
        {/* Category Navigation */}
        <div className="mb-6">
          <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3 px-1">
            Danh mục sản phẩm
          </h3>
          <div className="space-y-1">
            <Link
              href="/danh-muc"
              onClick={() => isMobile && setIsMobileSidebarOpen(false)}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-bold transition-all duration-150 ${
                slug === "all"
                  ? "bg-dtl-navy text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-dtl-navy"
              }`}
            >
              <span>Tất cả sản phẩm</span>
            </Link>

            {rootProductCategories.map((category) => {
              const isParentActive = activeRootCategory?.id === category.id;
              const isCategoryActive = slug === category.id;
              const nestedChildren = childCategories.filter(
                (child) => child.parentId === category.id
              );

              return (
                <div key={category.id} className="space-y-0.5">
                  <Link
                    href={`/danh-muc/${category.id}`}
                    onClick={() => isMobile && setIsMobileSidebarOpen(false)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-bold transition-all duration-150 ${
                      isCategoryActive
                        ? "bg-dtl-navy text-white shadow-sm"
                        : isParentActive
                        ? "text-dtl-navy bg-slate-100/60 hover:bg-slate-100"
                        : "text-slate-600 hover:bg-slate-100 hover:text-dtl-navy"
                    }`}
                  >
                    <span className="truncate pr-2">{category.title}</span>
                    {nestedChildren.length > 0 && (
                      <ChevronRight
                        className={`w-3.5 h-3.5 shrink-0 opacity-60 transition-transform duration-200 ${
                          isParentActive ? "rotate-90 text-current" : ""
                        }`}
                      />
                    )}
                  </Link>

                  {/* Render nested children if parent is active */}
                  {isParentActive && nestedChildren.length > 0 && (
                    <div className="ml-3.5 pl-2.5 border-l border-slate-200 space-y-0.5 py-1">
                      {nestedChildren.map((child) => {
                        const isChildActive = slug === child.id;
                        return (
                          <Link
                            key={child.id}
                            href={`/danh-muc/${child.id}`}
                            onClick={() => isMobile && setIsMobileSidebarOpen(false)}
                            className={`block rounded-md px-2.5 py-1.5 text-xs font-bold transition-all duration-150 ${
                              isChildActive
                                ? "text-dtl-red bg-red-50/50"
                                : "text-slate-500 hover:text-dtl-red hover:bg-slate-50/30"
                            }`}
                          >
                            {child.title}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        {categoryDetail.hasFilters && categoryDetail.filterDefs ? (
          <div className="mt-2 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between gap-3 mb-4 px-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Bộ lọc thông số
                </span>
                {hasActiveFilters ? (
                  <span className="rounded-full bg-dtl-navy px-1.5 py-0.5 text-[9px] font-extrabold leading-none text-white">
                    {activeFilterCount}
                  </span>
                ) : null}
              </div>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-[11px] font-extrabold text-dtl-red transition-colors hover:text-dtl-red-dark"
                >
                  Xóa tất cả
                </button>
              ) : null}
            </div>

            <div className="space-y-1">
              {categoryDetail.filterDefs.map((def) => (
                <FilterGroup
                  key={def.key}
                  def={def as { key: string; label: string; values: string[] }}
                  isFilterActive={isFilterActive}
                  handleFilterClick={handleFilterClick}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <main className="bg-dtl-bg-alt">
      {/* ─── Breadcrumb ───────────────────────────────────────────── */}
      <nav
        aria-label="Điều hướng"
        className=""
      >
        <div className="max-w-[1220px] mx-auto px-5 pt-6 pb-2 flex items-center gap-1.5 text-[13px] text-dtl-gray flex-wrap">
          <Link href="/" className="hover:text-dtl-red transition-colors font-medium">
            Trang chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          {slug === "all" ? (
            <span className="text-dtl-dark font-semibold">Danh mục sản phẩm</span>
          ) : (
            <>
              <Link href="/danh-muc" className="hover:text-dtl-red transition-colors font-medium">
                Danh mục
              </Link>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="text-dtl-dark font-semibold line-clamp-1">{categoryDetail.title}</span>
            </>
          )}
        </div>
      </nav>

      <section className="mx-auto max-w-[1220px] px-5 pb-14 pt-2">
        {/* ─── Premium Gradient Banner ─────────────────────────────── */}
        <div className="relative bg-gradient-to-r from-dtl-navy-dark to-[#1e3a75] text-white rounded-2xl overflow-hidden p-8 md:p-12 mb-6 shadow-md">
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54 48c-2 0-3 1-3 3s1 3 3 3 3-1 3-3-1-3-3-3zM6 48c-2 0-3 1-3 3s1 3 3 3 3-1 3-3-1-3-3-3z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E\")" }} />
          <div className="relative z-10">
            <span className="inline-block bg-dtl-red text-white text-[11px] font-bold tracking-widest px-3.5 py-1 rounded-full uppercase mb-4 shadow-[0_2px_8px_rgba(227,30,36,0.3)]">
              Danh mục sản phẩm
            </span>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight uppercase">
                  {categoryDetail.title}
                </h1>
                <p className="text-white/80 text-[13.5px] font-medium max-w-xl">
                  Đại Tài Lợi cung cấp các sản phẩm bao bì, chai lọ chất lượng cao và dịch vụ gia công kỹ thuật chuyên nghiệp.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Layout Grid (Sidebar + Product Grid) ─────────────────── */}
        <div className="flex flex-col lg:flex-row gap-8 items-start mt-6">
          {/* Desktop Left Sidebar */}
          <aside className="w-full lg:w-[280px] shrink-0 hidden lg:block bg-white border border-dtl-border rounded-xl p-5 shadow-sm">
            {renderSidebarContent(false)}
          </aside>

          {/* Right Product Grid Area */}
          <div className="flex-1 w-full">
            {/* Mobile Filter Button & matched count */}
            <div className="flex items-center justify-between lg:hidden mb-4 bg-white p-3.5 rounded-xl border border-dtl-border shadow-sm">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-dtl-navy text-white text-xs font-bold rounded-lg hover:bg-dtl-navy-dark transition-all duration-150 shadow-sm"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Bộ lọc & Danh mục</span>
              </button>
              {status === "success" && total > 0 ? (
                <span className="text-xs font-semibold text-dtl-gray">
                  {total.toLocaleString("vi-VN")} sản phẩm
                </span>
              ) : null}
            </div>

            {/* Active filter badges in main section */}
            {activeFilterBadges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4 items-center">
                <span className="text-xs font-semibold text-dtl-gray mr-1">Đang lọc:</span>
                {activeFilterBadges.map((badge) => (
                  <button
                    key={`${badge.key}:${badge.value}`}
                    type="button"
                    onClick={() => handleFilterClick(badge.key, badge.value)}
                    aria-label={`Bỏ lọc ${badge.label}: ${badge.value}`}
                    className="inline-flex items-center gap-1 rounded bg-[#EDF2FA] px-2 py-1 text-[11px] font-bold text-dtl-navy border border-dtl-navy/15 transition-colors hover:bg-[#E1EAF6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dtl-navy/40 focus-visible:ring-offset-1"
                  >
                    <span className="text-dtl-gray">{badge.label}:</span>
                    <span>{badge.value}</span>
                    <X className="h-3 w-3 shrink-0 text-dtl-navy/50" aria-hidden="true" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs font-bold text-dtl-red hover:underline ml-2"
                >
                  Xóa tất cả
                </button>
              </div>
            )}

            {/* Product grid status/summary */}
            {(status === "success" || status === "empty") && (
              <p
                className="mb-4 text-xs font-semibold text-dtl-gray"
                aria-live="polite"
              >
                {hasActiveFilters ? (
                  <>
                    Hiển thị{" "}
                    <span className="font-black text-dtl-dark">{total}</span> kết
                    quả phù hợp
                  </>
                ) : total > 0 ? (
                  <>
                    <span className="font-black text-dtl-dark">
                      {total.toLocaleString("vi-VN")}
                    </span>{" "}
                    sản phẩm
                  </>
                ) : null}
              </p>
            )}

            {/* Product list */}
            {status === "loading" || status === "idle" ? (
              <ProductGridSkeleton />
            ) : status === "error" ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-10 text-center">
                <p className="text-sm font-extrabold text-red-700">
                  Không thể tải danh sách sản phẩm lúc này.
                </p>
                {loadError ? (
                  <p className="mt-1 text-xs text-red-600">{loadError}</p>
                ) : null}
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="mt-4 rounded bg-red-600 px-4 py-2 text-xs font-extrabold text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 focus-visible:ring-offset-1"
                >
                  Thử lại
                </button>
              </div>
            ) : status === "success" ? (
              <>
                <div className="grid grid-cols-1 min-[340px]:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {sortedItems.map((item, idx) => (
                  <Interactive3DTilt
                    key={idx}
                    className="bg-white border border-dtl-border rounded-lg overflow-hidden flex flex-col group cursor-pointer shadow-sm hover:shadow-[0_16px_40px_rgba(0,0,0,0.12)] transition-shadow duration-300"
                    maxTilt={10}
                  >
                    <Link
                      href={`/san-pham/${item.id}`}
                      className="absolute inset-0 z-[1] rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dtl-navy/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      aria-label={`Xem chi tiết sản phẩm ${item.name}`}
                    />

                    <div className="pointer-events-none flex flex-1 flex-col h-full w-full">
                      {/* Product image */}
                      <div className="relative w-full aspect-square bg-[#fff] p-4 border-b border-dtl-bg-alt flex items-center justify-center">
                        {item.bulkDiscounts && item.bulkDiscounts.length > 0 && (
                          <div className="absolute top-2.5 left-2.5 z-10 bg-gradient-to-r from-dtl-red to-orange-500 text-white text-[9px] min-[340px]:text-[10px] font-bold px-2 py-0.5 rounded shadow-sm tracking-wide uppercase">
                            GIÁ SỈ CHIẾT KHẤU LỚN
                          </div>
                        )}
                        {item.stock !== undefined && item.stock <= 15 && (
                          <div className="absolute top-2.5 right-2.5 z-10">
                            {item.stock === 0 ? (
                              <span className="block rounded border border-red-200 bg-white px-2 py-0.5 text-[9px] font-extrabold text-red-600 shadow-sm">
                                Hết hàng
                              </span>
                            ) : (
                              <span className="block rounded border border-amber-200 bg-white px-2 py-0.5 text-[9px] font-extrabold text-amber-600 shadow-sm">
                                Còn {item.stock}
                              </span>
                            )}
                          </div>
                        )}
                        <LazyProductImageDisplay
                          imgs={item.imgs}
                          img={item.img}
                          alt={item.name}
                        />
                      </div>

                      {/* Card content */}
                      <div className="p-3.5 bg-white flex-1 flex flex-col items-center">
                        {item.categoryId ? (
                          <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wider text-dtl-gray text-center">
                            {item.categoryId}
                          </p>
                        ) : null}
                        <h3 className="text-[13px] md:text-[14px] font-bold text-dtl-dark text-center leading-[1.45] transition-colors group-hover:text-dtl-red mb-2 h-10 line-clamp-2 overflow-hidden text-ellipsis font-sans">
                          {item.name}
                        </h3>

                        <div className="mt-auto pt-2 w-full flex flex-col items-center">
                          {item.price && item.price > 0 ? (
                            <div className="flex flex-col items-center text-center">
                              <div className="text-dtl-red text-[14px] md:text-[15px] font-extrabold">
                                {item.price.toLocaleString("vi-VN")}đ
                              </div>
                              {item.bulkDiscounts &&
                              item.bulkDiscounts.length > 0 ? (
                                <div className="mt-1 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100 text-orange-700 text-[9px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit">
                                  <span className="w-1 h-1 rounded-full bg-orange-500 animate-pulse"></span>
                                  <span>Sỉ chỉ từ:</span>
                                  <span className="font-extrabold text-[#c2410c]">
                                    {Math.min(...item.bulkDiscounts.map((d) => d.pricePerUnit)).toLocaleString("vi-VN")}đ
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            <div className="text-dtl-gray text-[12px] font-semibold text-center">
                              Liên hệ báo giá sỉ
                            </div>
                          )}

                          {categoryDetail.filterDefs ? (
                            <div className="mt-2.5 flex flex-wrap gap-1 justify-center">
                              {categoryDetail.filterDefs.map((def) => {
                                const val = (
                                  item as CatalogItem & Record<string, unknown>
                                )[def.key];
                                if (!val) return null;

                                return (
                                  <span
                                    key={def.key}
                                    className="rounded bg-dtl-bg-alt px-1.5 py-0.5 text-[9px] font-semibold uppercase text-dtl-navy border border-dtl-border/30"
                                  >
                                    {String(val)}
                                  </span>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="pointer-events-auto relative z-[2] px-3.5 pb-3.5">
                      <button
                        type="button"
                        onClick={() =>
                          openProductDetail(
                            item,
                            categoryDetail as CatalogCategory,
                          )
                        }
                        className="w-full bg-[#f8f9fa] group-hover:bg-dtl-red font-bold text-[11px] md:text-[12px] py-[8.5px] rounded text-dtl-navy group-hover:text-white transition-all border border-dtl-border group-hover:border-dtl-red flex items-center justify-center gap-1.5 shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dtl-navy/40 focus-visible:ring-offset-1 focus-visible:ring-offset-white"
                      >
                        <Info className="w-3.5 h-3.5" />
                        Chi Tiết & Báo Giá Sỉ
                      </button>
                    </div>
                  </Interactive3DTilt>
                ))}
              </div>

              {pageCount > 1 ? (
                <div className="mt-10 flex flex-wrap items-center justify-center gap-2 border-t border-dtl-border pt-7">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => {
                      setPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="rounded bg-white px-4 py-2 text-[13px] font-extrabold text-dtl-navy border border-dtl-border transition-colors hover:bg-dtl-bg-alt disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dtl-navy/40"
                  >
                    Trang trước
                  </button>
                  <span className="rounded bg-dtl-navy px-4 py-2 text-[13px] font-extrabold tabular-nums text-white">
                    {page} / {pageCount}
                  </span>
                  <button
                    type="button"
                    disabled={page === pageCount}
                    onClick={() => {
                      setPage((p) => Math.min(pageCount, p + 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="rounded bg-white px-4 py-2 text-[13px] font-extrabold text-dtl-navy border border-dtl-border transition-colors hover:bg-dtl-bg-alt disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dtl-navy/40"
                  >
                    Trang sau
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-lg bg-white border border-dtl-border px-5 py-16 text-center">
              <PackageSearch
                className="mx-auto mb-4 h-12 w-12 text-slate-200"
                aria-hidden="true"
              />
              <p className="text-sm font-black text-dtl-dark">
                Không tìm thấy sản phẩm nào trong danh mục này.
              </p>
              <p className="mt-1.5 text-sm font-medium text-dtl-gray">
                Thử điều chỉnh bộ lọc hoặc chọn danh mục khác.
              </p>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-4 rounded bg-dtl-navy px-4 py-2 text-xs font-extrabold text-white transition-colors hover:bg-dtl-navy-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dtl-navy/40 focus-visible:ring-offset-1"
                >
                  Xóa bộ lọc
                </button>
              ) : null}
            </div>
          )}
            {/* Mobile Sidebar Drawer */}
            <div
              className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${
                isMobileSidebarOpen ? "visible" : "invisible pointer-events-none"
              }`}
              role="dialog"
              aria-modal="true"
            >
              {/* Backdrop overlay */}
              <div
                className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${
                  isMobileSidebarOpen ? "opacity-100" : "opacity-0"
                }`}
                onClick={() => setIsMobileSidebarOpen(false)}
              />

              {/* Drawer container */}
              <div
                className={`absolute inset-y-0 left-0 w-full max-w-[300px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
                  isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
              >
                {/* Drawer header */}
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-slate-50">
                  <span className="text-sm font-black text-dtl-navy">Bộ lọc & Danh mục</span>
                  <button
                    type="button"
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-all"
                    aria-label="Đóng bộ lọc"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer scrollable content */}
                <div className="flex-1 overflow-y-auto px-4 py-6">
                  {renderSidebarContent(true)}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
