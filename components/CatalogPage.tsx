"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Filter,
  Grid2X2,
  Info,
  Layers,
  PackageSearch,
  SlidersHorizontal,
} from "lucide-react";

import { getPublicProductsPageAction } from "@/app/actions/public-products";
import { useCategories } from "@/lib/categories-context";
import { useModal } from "@/lib/context";
import { CatalogCategory, CatalogItem } from "@/lib/data";
import { PublicProductCard } from "@/lib/services/public-products";

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
    <div className="min-w-0 rounded-lg bg-white/70 px-3 py-3 ring-1 ring-[#E5EAF2]">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between gap-3 text-left text-[12px] font-extrabold uppercase text-[#1B3A6B] transition-colors hover:text-[#E31E24]"
      >
        <span className="truncate">{def.label}</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        )}
      </button>

      {isExpanded ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {def.values.map((val) => {
            const active = isFilterActive(def.key, val);
            return (
              <button
                key={val}
                type="button"
                onClick={() => handleFilterClick(def.key, val)}
                className={`inline-flex min-h-8 items-center justify-center rounded-md border px-3 py-1 text-[12px] font-semibold transition-all duration-200 active:scale-[0.98] ${
                  active
                    ? "border-[#1B3A6B] bg-[#1B3A6B] text-white shadow-[0_8px_20px_rgba(27,58,107,0.18)]"
                    : "border-[#E1E7F0] bg-white text-slate-600 hover:border-[#B9C7DA] hover:bg-[#F7F9FC] hover:text-[#1B3A6B]"
                }`}
              >
                {val}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function ProductImageDisplay({
  imgs,
  img,
  alt,
}: {
  imgs?: string[];
  img?: string | null;
  alt: string;
}) {
  const images = imgs && imgs.length > 0 ? imgs : img ? [img] : [];

  if (images.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded bg-[#F3F6FA]">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-[#1B3A6B] shadow-sm ring-1 ring-[#E5EAF2]">
          <Layers className="h-6 w-6" />
        </div>
        <span className="text-xs font-semibold tracking-wide text-slate-400">
          Coming Soon
        </span>
      </div>
    );
  }

  const primaryImg = images[0];
  const secondaryImg = images.length > 1 ? images[1] : null;

  return (
    <div className="group relative h-full w-full">
      <Image
        src={primaryImg}
        alt={alt}
        fill
        sizes="(max-width: 768px) 50vw, 25vw"
        className={`object-contain mix-blend-multiply transition-all duration-300 group-hover:scale-105 ${
          secondaryImg ? "group-hover:opacity-0" : ""
        }`}
      />
      {secondaryImg ? (
        <Image
          src={secondaryImg}
          alt={alt}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="absolute inset-0 object-contain mix-blend-multiply opacity-0 transition-all duration-300 group-hover:scale-105 group-hover:opacity-100"
        />
      ) : null}
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl bg-white shadow-[0_14px_40px_rgba(27,58,107,0.08)] ring-1 ring-[#E8EDF5]"
        >
          <div className="aspect-[4/3] animate-pulse bg-slate-100" />
          <div className="space-y-3 p-5">
            <div className="h-4 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="h-10 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CatalogPage({ slug }: { slug: string }) {
  const { openProductDetail } = useModal();
  const { catalog, categories, loading } = useCategories();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ProductLoadStatus>("idle");
  const [items, setItems] = useState<PublicProductCard[]>([]);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(true);

  const [prevSlug, setPrevSlug] = useState(slug);
  if (slug !== prevSlug) {
    setPrevSlug(slug);
    setPage(1);
    setActiveFilters({});
    setIsFilterPanelOpen(true);
  }

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
      <div className="mx-auto flex min-h-[420px] max-w-[1280px] flex-col items-center justify-center px-5 py-24">
        <div className="mb-5 grid h-14 w-14 place-items-center rounded-xl bg-white shadow-[0_18px_45px_rgba(27,58,107,0.12)] ring-1 ring-[#E8EDF5]">
          <PackageSearch className="h-6 w-6 animate-pulse text-[#1B3A6B]" />
        </div>
        <p className="text-sm font-semibold text-slate-500">
          Đang tải thông tin sản phẩm và dịch vụ...
        </p>
      </div>
    );
  }

  let categoryDetail = catalog[slug];

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
      <div className="mx-auto max-w-[1280px] px-5 py-20 text-center text-lg font-semibold text-slate-500">
        Không tìm thấy phân mục {slug}
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
    img: card.thumbnailUrl || "/placeholder.svg",
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

  const rootProductCategories = categories.filter(
    (c) => c.type === "product" && !c.parentId,
  );
  const childCategories = categories.filter((c) => !!c.parentId);
  const serviceCategories = categories.filter((c) => c.type === "service");
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

  return (
    <main className="bg-[#F6F8FB]">
      <section className="mx-auto max-w-[1280px] px-5 pb-14 pt-8 md:pt-10">
        <div className="overflow-hidden rounded-2xl bg-[#102A4C] text-white shadow-[0_28px_70px_rgba(16,42,76,0.18)]">
          <div className="grid gap-8 px-5 py-8 sm:px-8 md:grid-cols-[minmax(0,1fr)_280px] md:px-10 md:py-10">
            <div className="min-w-0">
              <div className="mb-4 inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-1.5 text-[11px] font-extrabold uppercase text-white/80 ring-1 ring-white/15">
                <Grid2X2 className="h-3.5 w-3.5" />
                Catalog sản phẩm
              </div>
              <h1 className="max-w-3xl text-balance text-3xl font-black leading-tight text-white md:text-5xl">
                {categoryDetail.title}
              </h1>
            </div>

            <div className="grid content-end gap-3 rounded-xl bg-white/8 p-4 ring-1 ring-white/12">
              <div>
                <p className="text-[11px] font-bold uppercase text-white/55">
                  Kết quả hiện tại
                </p>
                <p className="mt-1 text-4xl font-black tabular-nums text-white">
                  {total}
                </p>
                <p className="text-xs font-semibold text-white/60">
                  sản phẩm trong phạm vi đang xem
                </p>
              </div>
              <div className="h-px bg-white/12" />
              <p className="text-xs font-medium leading-5 text-white/66">
                Chọn danh mục hoặc bộ lọc bên dưới để thu hẹp nhanh danh sách.
              </p>
            </div>
          </div>
        </div>

        <nav className="mt-6 rounded-2xl bg-white p-3 shadow-[0_18px_45px_rgba(27,58,107,0.08)] ring-1 ring-[#E8EDF5]">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Link
              href="/danh-muc"
              className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-extrabold transition-all duration-200 ${
                slug === "all"
                  ? "bg-[#E31E24] text-white shadow-[0_12px_24px_rgba(227,30,36,0.18)]"
                  : "bg-[#F7F9FC] text-slate-650 hover:bg-[#EEF3F8] hover:text-[#1B3A6B]"
              }`}
            >
              Tất cả sản phẩm
            </Link>
            {rootProductCategories.map((category) => {
              const isActive =
                slug === category.id ||
                childCategories.some(
                  (child) => child.id === slug && child.parentId === category.id,
                );

              return (
                <Link
                  key={category.id}
                  href={`/danh-muc/${category.id}`}
                  className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-extrabold transition-all duration-200 ${
                    isActive
                      ? "bg-[#1B3A6B] text-white shadow-[0_12px_24px_rgba(27,58,107,0.18)]"
                      : "bg-[#F7F9FC] text-slate-650 hover:bg-[#EEF3F8] hover:text-[#1B3A6B]"
                  }`}
                >
                  {category.title}
                </Link>
              );
            })}
          </div>

          {activeChildCategories.length > 0 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto border-t border-[#EEF2F6] pt-3">
              {activeChildCategories.map((child) => (
                <Link
                  key={child.id}
                  href={`/danh-muc/${child.id}`}
                  className={`shrink-0 rounded-md px-3 py-2 text-xs font-bold transition-all ${
                    slug === child.id
                      ? "bg-[#FFF1F1] text-[#E31E24] ring-1 ring-[#F4C7C9]"
                      : "bg-white text-slate-500 ring-1 ring-[#E8EDF5] hover:text-[#E31E24]"
                  }`}
                >
                  {child.title}
                </Link>
              ))}
            </div>
          ) : null}
        </nav>

        {categoryDetail.hasFilters && categoryDetail.filterDefs ? (
          <section className="mt-5 overflow-hidden rounded-2xl bg-white shadow-[0_18px_45px_rgba(27,58,107,0.07)] ring-1 ring-[#E8EDF5]">
            <div className="flex flex-col gap-3 border-b border-[#EEF2F6] bg-[#FBFCFE] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#F1F5FA] text-[#1B3A6B]">
                  <SlidersHorizontal className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-black text-[#1B3A6B]">
                    Bộ lọc thông số
                  </h2>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    Chọn một hoặc nhiều thông số để lọc sản phẩm phù hợp.
                  </p>
                </div>
              </div>

              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="self-start rounded-md px-3 py-2 text-xs font-extrabold text-[#E31E24] ring-1 ring-[#F3C5C7] transition-colors hover:bg-[#FFF4F4] sm:self-auto"
                >
                  Xóa tất cả
                </button>
              ) : null}
            </div>

            {activeFilterBadges.length > 0 ? (
              <div className="flex flex-wrap gap-2 border-b border-[#EEF2F6] bg-white px-4 py-3">
                <span className="inline-flex items-center rounded-md bg-[#1B3A6B] px-2.5 py-1.5 text-[11px] font-extrabold text-white">
                  {activeFilterCount} đang chọn
                </span>
                {activeFilterBadges.map((badge) => (
                  <button
                    key={`${badge.key}:${badge.value}`}
                    type="button"
                    onClick={() => handleFilterClick(badge.key, badge.value)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-[#FFF4F4] px-2.5 py-1.5 text-[11px] font-bold text-[#E31E24] ring-1 ring-[#F3C5C7] transition-colors hover:bg-[#FFECEC]"
                    title={`Bỏ ${badge.label}: ${badge.value}`}
                  >
                    <span className="text-[#9B1C20]">{badge.label}:</span>
                    {badge.value}
                    <span aria-hidden="true" className="text-sm leading-none">
                      ×
                    </span>
                  </button>
                ))}
              </div>
            ) : null}

            {isFilterPanelOpen ? (
              <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {categoryDetail.filterDefs.map((def) => (
                <FilterGroup
                  key={def.key}
                  def={def as { key: string; label: string; values: string[] }}
                  isFilterActive={isFilterActive}
                  handleFilterClick={handleFilterClick}
                />
              ))}
              </div>
            ) : (
              <div className="border-t border-[#EEF2F6] bg-white px-4 py-3 text-xs font-semibold text-slate-500">
                Bộ lọc đang thu gọn. Bấm “Tùy chỉnh bộ lọc” để chọn thông số.
              </div>
            )}
          </section>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-white px-5 py-4 shadow-[0_14px_36px_rgba(27,58,107,0.06)] ring-1 ring-[#E8EDF5] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#F7F9FC] text-[#1B3A6B] ring-1 ring-[#E8EDF5]">
              <Filter className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-black text-[#1B3A6B]">
                {hasActiveFilters ? "Kết quả sau lọc" : "Danh sách sản phẩm"}
              </p>
              <p className="text-xs font-semibold text-slate-500">
                {hasActiveFilters ? (
                  <>
                    Hiển thị <span className="text-[#E31E24]">{total}</span> kết
                    quả phù hợp
                  </>
                ) : (
                  <>
                    Có <span className="text-[#E31E24]">{total}</span> sản phẩm
                    hiện có
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-md bg-[#F7F9FC] px-3 py-2 text-xs font-bold text-slate-500 ring-1 ring-[#E8EDF5] sm:self-auto">
            <Grid2X2 className="h-3.5 w-3.5" />
            Dạng lưới
          </div>
        </div>

        <section className="mt-6">
          {status === "loading" || status === "idle" ? (
            <ProductGridSkeleton />
          ) : status === "error" ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center text-red-700">
              <p className="text-sm font-extrabold">
                Không thể tải danh sách sản phẩm lúc này.
              </p>
              {loadError ? <p className="mt-2 text-xs">{loadError}</p> : null}
            </div>
          ) : status === "success" ? (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {visibleItems.map((item, idx) => (
                  <article
                    key={idx}
                    className="group relative flex min-h-full flex-col overflow-hidden rounded-xl bg-white shadow-[0_16px_45px_rgba(27,58,107,0.08)] ring-1 ring-[#E8EDF5] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_65px_rgba(27,58,107,0.14)]"
                  >
                    <Link
                      href={`/san-pham/${item.id}`}
                      className="absolute inset-0 z-[1] rounded-xl"
                      aria-label={`Xem chi tiết ${item.name}`}
                    />

                    <div className="pointer-events-none flex flex-1 flex-col">
                      <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-[#F8FAFD] p-5">
                        {item.stock !== undefined ? (
                          <div className="absolute right-3 top-3 z-20 font-black uppercase leading-none tracking-wide">
                            {item.stock === 0 ? (
                              <span className="block rounded-md border border-red-200 bg-white px-2 py-1.5 text-[10px] text-red-600 shadow-sm">
                                Hết hàng
                              </span>
                            ) : item.stock <= 15 ? (
                              <span className="block rounded-md border border-amber-200 bg-white px-2 py-1.5 text-[10px] text-amber-600 shadow-sm">
                                Còn {item.stock}
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                        <ProductImageDisplay
                          imgs={item.imgs}
                          img={item.img}
                          alt={item.name}
                        />
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        <p className="mb-2 text-[11px] font-extrabold uppercase text-[#E31E24]">
                          {item.categoryId || "catalog"}
                        </p>
                        <h3 className="line-clamp-2 min-h-11 text-[15px] font-black leading-snug text-[#17233A] transition-colors group-hover:text-[#E31E24]">
                          {item.name}
                        </h3>

                        {item.price && item.price > 0 ? (
                          <div className="mt-4">
                            <div className="text-[18px] font-black tabular-nums text-[#E31E24]">
                              {item.price.toLocaleString("vi-VN")}đ
                            </div>
                            {item.bulkDiscounts &&
                            item.bulkDiscounts.length > 0 ? (
                              <div className="mt-1 text-[11px] font-bold text-slate-500">
                                Sỉ từ{" "}
                                {item.bulkDiscounts[
                                  item.bulkDiscounts.length - 1
                                ].pricePerUnit.toLocaleString("vi-VN")}
                                đ
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <div className="mt-4 text-xs font-bold text-slate-500">
                            Báo giá qua hotline
                          </div>
                        )}

                        {categoryDetail.filterDefs ? (
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {categoryDetail.filterDefs.map((def) => {
                              const val = (
                                item as CatalogItem & Record<string, unknown>
                              )[def.key];
                              if (!val) return null;

                              return (
                                <span
                                  key={def.key}
                                  className="rounded-md bg-[#F3F6FA] px-2 py-1 text-[10px] font-bold uppercase text-[#1B3A6B]"
                                >
                                  {String(val)}
                                </span>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="pointer-events-auto relative z-[2] px-5 pb-5">
                      <button
                        type="button"
                        onClick={() =>
                          openProductDetail(
                            item,
                            categoryDetail as CatalogCategory,
                          )
                        }
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#17233A] px-4 py-3 text-[12px] font-extrabold text-white shadow-[0_12px_24px_rgba(23,35,58,0.18)] transition-all duration-300 hover:bg-[#E31E24] active:scale-[0.98]"
                      >
                        Chi tiết & báo giá sỉ
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {pageCount > 1 ? (
                <div className="mt-10 flex flex-wrap items-center justify-center gap-3 border-t border-[#E8EDF5] pt-7">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => {
                      setPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="cursor-pointer rounded-lg bg-white px-4 py-2.5 text-[13px] font-extrabold text-[#1B3A6B] shadow-sm ring-1 ring-[#E8EDF5] transition-all hover:bg-[#F7F9FC] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Trang trước
                  </button>
                  <span className="rounded-lg bg-[#1B3A6B] px-4 py-2.5 text-[13px] font-extrabold text-white shadow-sm">
                    Trang {page} / {pageCount}
                  </span>
                  <button
                    type="button"
                    disabled={page === pageCount}
                    onClick={() => {
                      setPage((p) => Math.min(pageCount, p + 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="cursor-pointer rounded-lg bg-white px-4 py-2.5 text-[13px] font-extrabold text-[#1B3A6B] shadow-sm ring-1 ring-[#E8EDF5] transition-all hover:bg-[#F7F9FC] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Trang sau
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#D8E0EC] bg-white px-5 py-16 text-center text-slate-500 shadow-sm">
              <PackageSearch className="mx-auto mb-4 h-14 w-14 text-slate-300" />
              <p className="text-sm font-extrabold text-[#17233A]">
                Không tìm thấy sản phẩm nào trong phân mục này.
              </p>
              <p className="mt-2 text-sm font-medium">
                Vui lòng thử bộ lọc thông số hoặc chọn danh mục khác.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
