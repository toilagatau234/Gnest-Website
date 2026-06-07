"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Info,
  Layers,
  List,
} from "lucide-react";

import { getPublicProductsPageAction } from "@/app/actions/public-products";
import { useCategories } from "@/lib/categories-context";
import { CatalogCategory, CatalogItem } from "@/lib/data";
import { useModal } from "@/lib/context";
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
    <div className="py-4 first:pt-0 last:pb-0">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between text-[14px] font-bold tracking-wide text-dtl-dark transition-colors hover:text-dtl-red"
      >
        {def.label}
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-dtl-gray" />
        ) : (
          <ChevronDown className="h-4 w-4 text-dtl-gray" />
        )}
      </button>

      {isExpanded ? (
        <div className="mt-3 flex flex-wrap gap-2.5">
          {def.values.map((val) => {
            const active = isFilterActive(def.key, val);
            return (
              <button
                key={val}
                type="button"
                onClick={() => handleFilterClick(def.key, val)}
                className={`inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-all ${
                  active
                    ? "border-dtl-navy bg-dtl-navy text-white shadow-md"
                    : "border-dtl-border bg-white text-dtl-gray hover:border-dtl-navy/40 hover:bg-dtl-bg-alt/50 hover:text-dtl-navy"
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
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded bg-gradient-to-br from-[#f0f4f9] to-[#e4eaf3]">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-dtl-navy shadow-inner">
          <Layers className="h-6 w-6 text-white" />
        </div>
        <span className="text-xs font-medium tracking-wide text-[#8fa3be]">
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
    <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-lg border border-dtl-border bg-white shadow-sm"
        >
          <div className="aspect-square animate-pulse bg-slate-100" />
          <div className="space-y-3 p-4">
            <div className="h-4 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
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

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ProductLoadStatus>("idle");
  const [items, setItems] = useState<PublicProductCard[]>([]);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {},
  );

  const [prevSlug, setPrevSlug] = useState(slug);
  if (slug !== prevSlug) {
    setPrevSlug(slug);
    setPage(1);
    setActiveFilters({});
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
      <div className="mx-auto flex min-h-[400px] max-w-[1220px] flex-col items-center justify-center px-5 py-24">
        <div className="mb-4.5 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-dtl-red" />
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
      title: "Tất cả danh mục",
      type: "product",
      hasFilters: extraFilters.length > 0,
      filterDefs: extraFilters,
      items: [],
    };
  }

  if (!categoryDetail) {
    return (
      <div className="p-16 text-center text-lg font-medium text-dtl-gray">
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

  return (
    <div className="mx-auto flex max-w-[1220px] flex-col items-start gap-6 px-5 py-8 md:flex-row lg:gap-8">
      <div className="flex w-full shrink-0 flex-col gap-6 md:w-[280px]">
        <div className="overflow-hidden rounded-xl border border-dtl-border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-dtl-border bg-dtl-bg-alt/50 px-5 py-4">
            <h3 className="flex items-center gap-2 text-[14px] font-black uppercase tracking-[0.5px] text-dtl-navy">
              <List className="h-4 w-4 text-dtl-red" /> Danh Mục Sản Phẩm
            </h3>
          </div>
          <div className="p-3">
            <ul className="space-y-1">
              <li>
                <Link
                  href="/danh-muc"
                  className={`block rounded-lg px-3 py-2 text-[14px] font-semibold transition-colors ${
                    slug === "all"
                      ? "bg-dtl-red text-white"
                      : "text-dtl-dark hover:bg-dtl-bg-alt hover:text-dtl-red"
                  }`}
                >
                  Tất cả sản phẩm
                </Link>
              </li>
              {rootProductCategories.map((category) => {
                const key = category.id;
                const isRootActive = slug === key;
                const children = childCategories.filter(
                  (c) => c.parentId === key,
                );
                const hasActiveChild = children.some(
                  (child) => slug === child.id,
                );

                return (
                  <li key={key} className="pt-1">
                    <Link
                      href={`/danh-muc/${key}`}
                      className={`block rounded-lg px-3 py-2 text-[13.5px] font-semibold transition-colors ${
                        isRootActive
                          ? "bg-dtl-red text-white"
                          : hasActiveChild
                            ? "font-bold text-dtl-red"
                            : "text-dtl-dark hover:bg-dtl-bg-alt hover:text-dtl-red"
                      }`}
                    >
                      {category.title}
                    </Link>
                    {children.length > 0 ? (
                      <ul className="ml-4 mt-1 space-y-1 border-l-2 border-dtl-bg-alt pl-4">
                        {children.map((childCat) => (
                          <li key={childCat.id}>
                            <Link
                              href={`/danh-muc/${childCat.id}`}
                              className={`relative block rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors before:absolute before:-left-[18px] before:top-1/2 before:w-3 before:border-t-2 before:border-dtl-bg-alt before:content-[''] ${
                                slug === childCat.id
                                  ? "bg-dtl-bg-alt/50 font-bold text-dtl-red"
                                  : "text-dtl-gray hover:bg-dtl-bg-alt hover:text-dtl-red"
                              }`}
                            >
                              {childCat.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-dtl-border bg-white shadow-sm">
          <div className="border-b border-dtl-border bg-dtl-bg-alt/50 px-5 py-4">
            <h3 className="flex items-center gap-2 text-[14px] font-black uppercase tracking-[0.5px] text-dtl-navy">
              <Layers className="h-4 w-4 text-dtl-red" /> Dịch Vụ Cung Cấp
            </h3>
          </div>
          <div className="p-3">
            <ul className="space-y-1">
              {serviceCategories.map((service) => (
                <li key={service.id}>
                  <Link
                    href={`/danh-muc/${service.id}`}
                    className={`block rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${
                      slug === service.id
                        ? "bg-dtl-navy text-white"
                        : "text-dtl-dark hover:bg-dtl-bg-alt hover:text-dtl-red"
                    }`}
                  >
                    • {service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="min-w-0 flex-1 w-full">
        <div className="mb-5 flex items-center gap-3 rounded-lg bg-dtl-navy px-5 py-4.5 text-white shadow-sm">
          <div className="w-1.5 self-stretch rounded-full bg-dtl-red" />
          <h1 className="text-lg font-black uppercase tracking-wide">
            {categoryDetail.title}
          </h1>
        </div>

        {categoryDetail.hasFilters && categoryDetail.filterDefs ? (
          <div className="mb-5 overflow-hidden rounded-xl border border-dtl-border bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-dtl-border bg-dtl-bg-alt/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="flex items-center gap-2 text-[14px] font-black uppercase tracking-[0.5px] text-dtl-navy">
                <Filter className="h-4 w-4 text-dtl-red" /> Bộ Lọc Thông Số
              </h3>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="self-start text-[13px] font-medium text-dtl-red underline hover:text-dtl-red-dark sm:self-auto"
                >
                  Xóa tất cả
                </button>
              ) : null}
            </div>

            <div className="grid gap-x-6 divide-y divide-dtl-border/50 p-5 md:grid-cols-2 md:divide-y-0 lg:grid-cols-3">
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

        <div className="mb-4 flex items-center justify-between border-b border-dtl-border pb-4">
          <div className="text-[13px] text-dtl-gray">
            {hasActiveFilters ? (
              <>
                Hiển thị{" "}
                <strong className="font-bold text-dtl-navy">{total}</strong> kết
                quả phù hợp
              </>
            ) : (
              <>
                Tất cả{" "}
                <strong className="text-sm font-bold tracking-wide text-dtl-dark">
                  {total}
                </strong>{" "}
                sản phẩm hiện có
              </>
            )}
          </div>
        </div>

        {status === "loading" || status === "idle" ? (
          <ProductGridSkeleton />
        ) : status === "error" ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-8 text-center text-red-700">
            <p className="text-sm font-semibold">
              Không thể tải danh sách sản phẩm lúc này.
            </p>
            {loadError ? <p className="mt-2 text-xs">{loadError}</p> : null}
          </div>
        ) : status === "success" ? (
          <>
            <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-3">
              {visibleItems.map((item, idx) => (
                <div
                  key={idx}
                  className="group relative flex flex-col overflow-hidden rounded-lg border border-dtl-border bg-white transition-all hover:-translate-y-1 hover:border-dtl-navy/40 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
                >
                  <Link
                    href={`/san-pham/${item.id}`}
                    className="absolute inset-0 z-[1] rounded-lg"
                    aria-label={`Xem chi tiết ${item.name}`}
                  />

                  <div className="pointer-events-none">
                    <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden border-b border-dtl-bg-alt bg-[#fff] p-4">
                      {item.stock !== undefined ? (
                        <div className="absolute top-2 right-2 z-20 font-black uppercase leading-none tracking-wide">
                          {item.stock === 0 ? (
                            <span className="block rounded border border-red-200 bg-red-50 px-1.5 py-1 text-[9px] text-red-600 shadow-sm">
                              Hết hàng
                            </span>
                          ) : item.stock <= 15 ? (
                            <span className="block rounded border border-amber-200 bg-amber-50 px-1.5 py-1 text-[9px] text-amber-600 shadow-sm">
                              Chỉ còn {item.stock}
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

                    <div className="flex flex-1 flex-col items-center bg-white p-3 md:p-4">
                      <h3 className="mb-2.5 h-10 overflow-hidden text-ellipsis text-center text-[13px] font-bold leading-[1.4] text-dtl-dark transition-colors line-clamp-2 group-hover:text-dtl-red md:text-[14.5px]">
                        {item.name}
                      </h3>

                      {item.price && item.price > 0 ? (
                        <div className="mb-3 text-center">
                          <div className="text-[15px] font-extrabold text-dtl-red">
                            {item.price.toLocaleString("vi-VN")}đ
                          </div>
                          {item.bulkDiscounts &&
                          item.bulkDiscounts.length > 0 ? (
                            <div className="mt-0.5 text-[10px] text-dtl-gray">
                              Sỉ từ{" "}
                              {item.bulkDiscounts[
                                item.bulkDiscounts.length - 1
                              ].pricePerUnit.toLocaleString("vi-VN")}
                              đ
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="mb-3 text-xs font-semibold text-dtl-gray">
                          Báo giá qua hotline
                        </div>
                      )}

                      {categoryDetail.filterDefs ? (
                        <div className="mb-3 flex flex-wrap justify-center gap-1.5">
                          {categoryDetail.filterDefs.map((def) => {
                            const val = (item as CatalogItem & Record<string, unknown>)[
                              def.key
                            ];
                            if (!val) return null;

                            return (
                              <span
                                key={def.key}
                                className="rounded border border-dtl-border/60 bg-dtl-bg-alt px-2 py-0.5 text-[10px] font-semibold uppercase tracking-tight text-dtl-navy"
                              >
                                {String(val)}
                              </span>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="pointer-events-auto relative z-[2] px-3 pb-3 md:px-4 md:pb-4">
                    <button
                      type="button"
                      onClick={() =>
                        openProductDetail(
                          item,
                          categoryDetail as CatalogCategory,
                        )
                      }
                      className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded border border-dtl-border bg-[#f8f9fa] py-[9px] text-[11px] font-bold text-dtl-navy shadow-sm transition-all duration-300 group-hover:border-dtl-red group-hover:bg-dtl-red group-hover:text-white md:text-xs"
                    >
                      <Info className="h-3.5 w-3.5" /> Chi Tiết & Báo Giá Sỉ
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {pageCount > 1 ? (
              <div className="mt-8 flex items-center justify-center gap-3 border-t border-dtl-border pt-6">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="cursor-pointer rounded-lg border border-dtl-border px-4 py-2 text-[13px] font-bold text-dtl-navy transition-all hover:bg-dtl-bg-alt hover:text-dtl-red disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-dtl-navy"
                >
                  Trang trước
                </button>
                <span className="text-[13px] font-bold text-dtl-navy">
                  Trang {page} / {pageCount}
                </span>
                <button
                  type="button"
                  disabled={page === pageCount}
                  onClick={() => {
                    setPage((p) => Math.min(pageCount, p + 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="cursor-pointer rounded-lg border border-dtl-border px-4 py-2 text-[13px] font-bold text-dtl-navy transition-all hover:bg-dtl-bg-alt hover:text-dtl-red disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-dtl-navy"
                >
                  Trang sau
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-dtl-border bg-dtl-bg-alt px-4 py-16 text-center text-[15px] text-dtl-gray">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto mb-4 h-14 w-14 text-dtl-gray/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p>
              Không tìm thấy sản phẩm nào trong phân mục này.
              <br />
              Vui lòng thử bộ lọc thông số hoặc chọn danh mục khác.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
