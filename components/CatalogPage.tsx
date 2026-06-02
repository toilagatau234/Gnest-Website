"use client";

import { useModal } from "@/lib/context";
import {
  Layers,
  Info,
  Check,
  Filter,
  List,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCategories } from "@/lib/categories-context";

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
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-[14px] font-bold text-dtl-dark mb-3 tracking-wide hover:text-dtl-red transition-colors"
      >
        {def.label}
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-dtl-gray" />
        ) : (
          <ChevronDown className="w-4 h-4 text-dtl-gray" />
        )}
      </button>

      {isExpanded && (
        <div className="flex flex-wrap gap-2.5">
          {def.values.map((val) => {
            const active = isFilterActive(def.key, val);
            return (
              <button
                key={val}
                onClick={() => handleFilterClick(def.key, val)}
                className={`inline-flex items-center justify-center px-3 py-1.5 border rounded-lg text-[13px] font-medium transition-all ${
                  active
                    ? "bg-dtl-navy border-dtl-navy text-white shadow-md"
                    : "bg-white border-dtl-border text-dtl-gray hover:border-dtl-navy/40 hover:bg-dtl-bg-alt/50 hover:text-dtl-navy"
                }`}
              >
                {val}
              </button>
            );
          })}
        </div>
      )}
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
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#f0f4f9] to-[#e4eaf3] gap-2 rounded">
        <div className="w-12 h-12 bg-dtl-navy rounded-xl flex items-center justify-center shadow-inner">
          <Layers className="text-white w-6 h-6" />
        </div>
        <span className="text-xs text-[#8fa3be] font-medium tracking-wide">
          Coming Soon
        </span>
      </div>
    );
  }

  const primaryImg = images[0];
  const secondaryImg = images.length > 1 ? images[1] : null;

  return (
    <div className="w-full h-full relative group">
      <Image
        src={primaryImg}
        alt={alt}
        fill
        sizes="(max-width: 768px) 50vw, 25vw"
        className={`object-contain mix-blend-multiply transition-all duration-300 group-hover:scale-105 ${secondaryImg ? "group-hover:opacity-0" : ""}`}
      />
      {secondaryImg && (
        <Image
          src={secondaryImg}
          alt={alt}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="absolute inset-0 object-contain mix-blend-multiply opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-105"
        />
      )}
    </div>
  );
}

export function CatalogPage({ slug }: { slug: string }) {
  const { openProductDetail } = useModal();
  const { catalog, categories, loading } = useCategories();
  const [activeFilters, setActiveFilters] = useState<
    Record<string, Set<string>>
  >({});

  if (loading) {
    return (
      <div className="max-w-[1220px] mx-auto px-5 py-24 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-dtl-red animate-spin mb-4.5"></div>
        <p className="text-sm font-semibold text-slate-500">
          Đang tải thông tin sản phẩm và dịch vụ...
        </p>
      </div>
    );
  }

  let cat = catalog[slug];

  if (slug === "all") {
    const allItems = Object.keys(catalog).flatMap((key) => {
      // Make sure we carry categoryTitle
      return (catalog[key]?.items || []).map((item) => ({
        ...item,
        categoryTitle: catalog[key].title,
      }));
    });

    // Collect all filter defs from every category
    const allDefs = Object.values(catalog)
      .filter((c) => c.hasFilters && c.filterDefs)
      .flatMap((c) => c.filterDefs || []);

    // Deduplicate by key and merge values
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
      } else {
        const existing = mergedDefsMap.get(def.key)!;
        def.values.forEach((v) => existing.values.add(v));
      }
    });

    const extraFilters = Array.from(mergedDefsMap.values()).map((def) => ({
      key: def.key,
      label: def.label,
      values: Array.from(def.values),
    }));

    cat = {
      title: "Tất cả danh mục",
      type: "product",
      hasFilters: extraFilters.length > 0,
      filterDefs: extraFilters,
      items: allItems,
    };
  }

  if (!cat) {
    return (
      <div className="p-16 text-center text-dtl-gray text-lg font-medium">
        Không tìm thấy phân mục {slug}
      </div>
    );
  }

  const handleFilterClick = (key: string, value: string) => {
    setActiveFilters((prev) => {
      const next = { ...prev };

      if (!next[key]) {
        next[key] = new Set();
      } else {
        next[key] = new Set(next[key]);
      }

      if (next[key].has(value)) {
        next[key].delete(value);
      } else {
        next[key].add(value);
      }

      return next;
    });
  };

  const clearAllFilters = () => setActiveFilters({});

  const isFilterActive = (key: string, value: string) => {
    return activeFilters[key]?.has(value) || false;
  };

  const activeGroups = Object.entries(activeFilters).filter(
    ([, v]) => v.size > 0,
  );
  const hasActiveFilters = activeGroups.length > 0;

  const visibleItems = cat.items.filter((item) => {
    if (activeGroups.length === 0) return true;
    return activeGroups.every(([key, vals]) => {
      const itemVal = (item as any)[key];
      return itemVal && vals.has(itemVal);
    });
  });

  const allEmpty = cat.items.every(
    (i) => !i.img && (!i.imgs || i.imgs.length === 0),
  );

  // Build category tree - separates products and services
  const rootProductCategories = categories.filter(
    (c) => c.type === "product" && !c.parentId,
  );
  const childCategories = categories.filter((c) => !!c.parentId);
  const serviceCategories = categories.filter((c) => c.type === "service");

  return (
    <div className="max-w-[1220px] mx-auto px-5 py-8 flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
      {/* Sidebar Filters */}
      <div className="w-full md:w-[280px] shrink-0 flex flex-col gap-6">
        {/* Category List */}
        <div className="bg-white border border-dtl-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-dtl-bg-alt/50 border-b border-dtl-border flex justify-between items-center">
            <h3 className="text-[14px] font-black uppercase tracking-[0.5px] text-dtl-navy flex items-center gap-2">
              <List className="w-4 h-4 text-dtl-red" /> Danh Mục Sản Phẩm
            </h3>
          </div>
          <div className="p-3">
            <ul className="space-y-1">
              <li>
                <Link
                  href="/danh-muc"
                  className={`block px-3 py-2 rounded-lg text-[14px] font-semibold transition-colors ${
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
                const showChildren = children.length > 0;

                return (
                  <li key={key} className="pt-1">
                    <Link
                      href={`/danh-muc/${key}`}
                      className={`block px-3 py-2 rounded-lg text-[13.5px] font-semibold transition-colors ${
                        isRootActive
                          ? "bg-dtl-red text-white"
                          : hasActiveChild
                            ? "text-dtl-red font-bold"
                            : "text-dtl-dark hover:bg-dtl-bg-alt hover:text-dtl-red"
                      }`}
                    >
                      {category.title}
                    </Link>
                    {showChildren && (
                      <ul className="pl-4 mt-1 border-l-2 border-dtl-bg-alt ml-4 space-y-1">
                        {children.map((childCat) => (
                          <li key={childCat.id}>
                            <Link
                              href={`/danh-muc/${childCat.id}`}
                              className={`block px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors relative before:content-[''] before:absolute before:-left-[18px] before:top-1/2 before:w-3 before:border-t-2 before:border-dtl-bg-alt ${
                                slug === childCat.id
                                  ? "text-dtl-red bg-dtl-bg-alt/50 font-bold"
                                  : "text-dtl-gray hover:text-dtl-red hover:bg-dtl-bg-alt"
                              }`}
                            >
                              {childCat.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Services List */}
        <div className="bg-white border border-dtl-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-dtl-bg-alt/50 border-b border-dtl-border">
            <h3 className="text-[14px] font-black uppercase tracking-[0.5px] text-dtl-navy flex items-center gap-2">
              <Layers className="w-4 h-4 text-dtl-red" /> Dịch Vụ Cung Cấp
            </h3>
          </div>
          <div className="p-3">
            <ul className="space-y-1">
              {serviceCategories.map((service) => (
                <li key={service.id}>
                  <Link
                    href={`/danh-muc/${service.id}`}
                    className={`block px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
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

        {cat.hasFilters && cat.filterDefs && (
          <div className="bg-white border border-dtl-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-dtl-bg-alt/50 border-b border-dtl-border flex justify-between items-center">
              <h3 className="text-[14px] font-black uppercase tracking-[0.5px] text-dtl-navy flex items-center gap-2">
                <Filter className="w-4 h-4 text-dtl-red" /> Bộ Lọc Thông Số
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-[13px] text-dtl-red underline font-medium hover:text-dtl-red-dark"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            <div className="p-5 divide-y divide-dtl-border/50">
              {cat.filterDefs.map((def) => (
                <FilterGroup
                  key={def.key}
                  def={def as any}
                  isFilterActive={isFilterActive}
                  handleFilterClick={handleFilterClick}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Product Grid */}
      <div className="flex-1 w-full min-w-0">
        <div className="flex items-center gap-3 bg-dtl-navy text-white px-5 py-4.5 mb-5 rounded-lg shadow-sm">
          <div className="w-1.5 self-stretch bg-dtl-red rounded-full"></div>
          <h1 className="text-lg font-black uppercase tracking-wide">
            {cat.title}
          </h1>
        </div>

        <div className="flex items-center justify-between mb-4 pb-4 border-b border-dtl-border">
          <div className="text-[13px] text-dtl-gray">
            {hasActiveFilters ? (
              <>
                Hiển thị{" "}
                <strong className="text-dtl-navy font-bold">
                  {visibleItems.length}
                </strong>{" "}
                / {cat.items.length} mục phù hợp
              </>
            ) : (
              <>
                <strong className="text-dtl-dark font-bold text-sm tracking-wide">
                  {cat.items.length}
                </strong>{" "}
                mục hiện có
              </>
            )}
          </div>
        </div>

        {allEmpty && (
          <div className="bg-dtl-bg-alt border border-dashed border-dtl-border rounded-md p-6 text-center mb-6">
            <p className="text-[14px] text-dtl-gray">
              <strong className="text-dtl-navy">
                Đang cập nhật thêm thông tin.
              </strong>{" "}
              Vui lòng liên hệ hotline{" "}
              <a href="tel:0939991551" className="text-dtl-red font-bold">
                0939.991.551
              </a>{" "}
              để được hỗ trợ tức thì.
            </p>
          </div>
        )}

        {visibleItems.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
            {visibleItems.map((item, idx) => {
              const hasDetail = !!item.desc;

              return (
                <div
                  key={idx}
                  className="relative bg-white border border-dtl-border rounded-lg overflow-hidden transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:border-dtl-navy/40 hover:-translate-y-1 flex flex-col group cursor-pointer"
                >
                  {/* Full-card navigation link — z-[1] below button */}
                  <Link
                    href={`/san-pham/${item.id}`}
                    className="absolute inset-0 z-[1] rounded-lg"
                    aria-label={`Xem chi tiết ${item.name}`}
                  />

                  {/* Card content — pointer-events-none so link overlay handles card clicks */}
                  <div className="pointer-events-none">
                    <div className="relative w-full aspect-square bg-[#fff] p-4 border-b border-dtl-bg-alt overflow-hidden flex items-center justify-center">
                      {item.stock !== undefined && (
                        <div className="absolute top-2 right-2 z-20 font-black uppercase tracking-wide leading-none">
                          {item.stock === 0 ? (
                            <span className="bg-red-50 text-red-600 px-1.5 py-1 text-[9px] rounded border border-red-200 shadow-sm block">
                              Hết hàng
                            </span>
                          ) : item.stock <= 15 ? (
                            <span className="bg-amber-50 text-amber-600 px-1.5 py-1 text-[9px] rounded border border-amber-200 shadow-sm block">
                              Chỉ còn {item.stock}
                            </span>
                          ) : null}
                        </div>
                      )}
                      <ProductImageDisplay
                        imgs={item.imgs}
                        img={item.img}
                        alt={item.name}
                      />
                    </div>

                    <div className="p-3 md:p-4 bg-white flex-1 flex flex-col items-center">
                      <h3 className="text-[13px] md:text-[14.5px] font-bold text-dtl-dark text-center leading-[1.4] transition-colors group-hover:text-dtl-red mb-2.5 h-10 line-clamp-2 overflow-hidden text-ellipsis">
                        {item.name}
                      </h3>

                      {item.price && item.price > 0 ? (
                        <div className="mb-3 text-center">
                          <div className="text-dtl-red text-[15px] font-extrabold">
                            {item.price.toLocaleString("vi-VN")}đ
                          </div>
                          {item.bulkDiscounts &&
                            item.bulkDiscounts.length > 0 && (
                              <div className="text-[10px] text-dtl-gray mt-0.5">
                                Sỉ từ{" "}
                                {item.bulkDiscounts[
                                  item.bulkDiscounts.length - 1
                                ].pricePerUnit.toLocaleString("vi-VN")}
                                đ
                              </div>
                            )}
                        </div>
                      ) : (
                        <div className="mb-3 text-dtl-gray text-xs font-semibold">
                          Báo giá qua hotline
                        </div>
                      )}

                      {cat.filterDefs && (
                        <div className="flex flex-wrap gap-1.5 justify-center mb-3">
                          {cat.filterDefs.map((def) => {
                            const val = (item as any)[def.key];
                            if (!val) return null;
                            return (
                              <span
                                key={def.key}
                                className="text-[10px] bg-dtl-bg-alt text-dtl-navy font-semibold px-2 py-0.5 rounded border border-dtl-border/60 uppercase tracking-tight"
                              >
                                {val}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Button re-enables pointer events at z-[2] above the link overlay */}
                  <div className="px-3 md:px-4 pb-3 md:pb-4 relative z-[2] pointer-events-auto">
                    <button
                      onClick={() => openProductDetail(item, cat)}
                      className="w-full bg-[#f8f9fa] group-hover:bg-dtl-red text-dtl-navy group-hover:text-white font-bold text-[11px] md:text-xs py-[9px] rounded transition-all border border-dtl-border group-hover:border-dtl-red flex items-center justify-center gap-1.5 cursor-pointer shadow-sm duration-300"
                    >
                      <Info className="w-3.5 h-3.5" /> Chi Tiết & Báo Giá Sỉ
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 px-4 text-[15px] bg-dtl-bg-alt rounded-lg text-dtl-gray border border-dashed border-dtl-border">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-14 h-14 mx-auto mb-4 text-dtl-gray/40"
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
