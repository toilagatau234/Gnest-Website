'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Minus, Phone, Plus, X } from 'lucide-react';

import { getDiscountedPrice } from '@/lib/cart-context';
import { useModal } from '@/lib/context';
import { getPublicProductBySlugAction } from '@/app/actions/public-products';
import { CatalogItem } from '@/lib/data';

export function ProductModal() {
  const {
    isProductDetailOpen,
    activeProduct,
    activeProductCategory,
    closeProductDetail,
    openContactModal,
  } = useModal();

  if (!activeProduct || !activeProductCategory) return null;

  return (
    <ProductModalContent
      key={activeProduct.id ?? activeProduct.name}
      isProductDetailOpen={isProductDetailOpen}
      activeProduct={activeProduct}
      activeProductCategory={activeProductCategory}
      closeProductDetail={closeProductDetail}
      openContactModal={openContactModal}
    />
  );
}

function ProductModalContent({
  isProductDetailOpen,
  activeProduct,
  activeProductCategory,
  closeProductDetail,
  openContactModal,
}: {
  isProductDetailOpen: boolean;
  activeProduct: NonNullable<ReturnType<typeof useModal>['activeProduct']>;
  activeProductCategory: NonNullable<ReturnType<typeof useModal>['activeProductCategory']>;
  closeProductDetail: () => void;
  openContactModal: () => void;
}) {
  const [detailedProduct, setDetailedProduct] = useState<CatalogItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mainImgIdx, setMainImgIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Reset states during render when the active product changes
  const [prevProductId, setPrevProductId] = useState<string | undefined>(undefined);
  if (activeProduct.id !== prevProductId) {
    setPrevProductId(activeProduct.id);
    setDetailedProduct(null);
    setMainImgIdx(0);
    setQuantity(1);
  }

  useEffect(() => {
    if (!activeProduct.id) return;

    // Check if the product is a lightweight card.
    // Lightweight cards from pagination or search don't have descriptions, full bulkDiscounts tiers, or multiple images.
    // So if description is missing, or bulkDiscounts is missing, or imgs is missing/empty, load it.
    const isLightweight =
      activeProduct.desc === undefined ||
      activeProduct.desc === '' ||
      activeProduct.bulkDiscounts === undefined ||
      activeProduct.imgs === undefined;

    if (!isLightweight) return;

    let isCurrent = true;
    Promise.resolve().then(() => {
      if (isCurrent) setIsLoading(true);
    });

    getPublicProductBySlugAction(activeProduct.id)
      .then((detail) => {
        if (!isCurrent || !detail) return;
        const mapped: CatalogItem = {
          id: detail.slug,
          name: detail.name,
          img: (detail.images && detail.images[0]?.public_url) || '/placeholder.svg',
          imgs: detail.images.map((img) => img.public_url).filter((url): url is string => !!url),
          dungTich: detail.specs.dungTich ? String(detail.specs.dungTich) : undefined,
          quyCach: detail.specs.quyCach ? String(detail.specs.quyCach) : undefined,
          phiNap: detail.specs.phiNap ? String(detail.specs.phiNap) : undefined,
          loaiNap: detail.specs.loaiNap ? String(detail.specs.loaiNap) : undefined,
          color: detail.specs.color ? String(detail.specs.color) : undefined,
          desc: detail.description || '',
          price: detail.price ?? undefined,
          stock: detail.stock,
          bulkDiscounts: detail.bulkDiscounts.map((d) => ({
            threshold: d.min_quantity,
            pricePerUnit: d.price_per_unit,
          })),
          categoryId: detail.category?.slug || '',
        };
        setDetailedProduct(mapped);
      })
      .catch((err) => {
        console.error('Failed to load product details in modal:', err);
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [activeProduct.id, activeProduct.desc, activeProduct.bulkDiscounts, activeProduct.imgs]);

  const displayProduct = detailedProduct || activeProduct;
  const imgs = displayProduct.imgs?.length ? displayProduct.imgs : displayProduct.img ? [displayProduct.img] : [];
  const mainImg = imgs[mainImgIdx] || imgs[0];
  const unitPrice = displayProduct.price ? getDiscountedPrice(displayProduct, quantity) : undefined;
  const retailPrice = displayProduct.price;
  const bestWholesale =
    displayProduct.bulkDiscounts && displayProduct.bulkDiscounts.length > 0
      ? Math.min(...displayProduct.bulkDiscounts.map((discount) => discount.pricePerUnit))
      : null;
  const maxSavingsPercent =
    retailPrice && bestWholesale ? Math.round(((retailPrice - bestWholesale) / retailPrice) * 100) : 0;

  return (
    <div
      className={`fixed inset-0 z-[3000] flex items-center md:items-center justify-center p-0 md:p-5 items-end transition-opacity duration-200 ${
        isProductDetailOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/60 cursor-pointer" onClick={closeProductDetail}></div>

      <div
        className={`bg-white w-full max-w-[900px] max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col rounded-t-[12px] md:rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.28)] relative z-10 transition-transform duration-300 ${
          isProductDetailOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-[11px] bg-dtl-navy text-white shrink-0">
          <h4 className="text-[13px] font-bold uppercase tracking-[0.5px]">Chi tiết sản phẩm</h4>
          <button
            onClick={closeProductDetail}
            className="w-8 h-8 bg-white/15 rounded hover:bg-white/30 flex items-center justify-center shrink-0 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden">
          <div className="w-full md:w-[42%] shrink-0 flex flex-col bg-[#fafafa] border-b md:border-b-0 md:border-r border-dtl-border p-3.5 md:p-[18px]">
            {mainImg ? (
              <div className="relative w-full h-[220px] md:h-auto md:aspect-square rounded bg-white border border-dtl-border">
                <Image
                  src={mainImg}
                  alt={displayProduct.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 380px"
                  className="object-contain p-2.5"
                />
              </div>
            ) : (
              <div className="w-full h-[220px] md:h-auto md:aspect-square flex items-center justify-center rounded bg-[#f0f4f9] border border-dtl-border text-dtl-gray text-xs">
                Chưa có hình ảnh
              </div>
            )}

            {imgs.length > 1 && (
              <div className="flex flex-wrap gap-2 mt-2.5">
                {imgs.map((src, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`w-[58px] h-[58px] border-2 rounded bg-white p-1 cursor-pointer transition-colors ${
                      mainImgIdx === idx ? 'border-dtl-navy' : 'border-dtl-border hover:border-dtl-gray'
                    }`}
                    onClick={() => setMainImgIdx(idx)}
                  >
                    <div className="relative w-full h-full">
                      <Image
                        src={src}
                        alt={`${displayProduct.name} ${idx + 1}`}
                        fill
                        sizes="58px"
                        className="object-contain"
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 md:overflow-y-auto p-4 md:p-5 md:px-6">
            <h2 className="text-[15px] md:text-[17px] font-extrabold text-dtl-dark mb-1.5 leading-[1.3]">
              {displayProduct.name}
            </h2>

            {displayProduct.stock !== undefined && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {displayProduct.stock === 0 ? (
                  <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 text-[11px] font-black px-2.5 py-1 rounded-full border border-red-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                    Hết hàng (tạm ngưng nhận đơn)
                  </span>
                ) : displayProduct.stock <= 15 ? (
                  <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 text-[11px] font-black px-2.5 py-1 rounded-full border border-amber-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                    Sắp hết hàng (chỉ còn {displayProduct.stock} sản phẩm)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-black px-2.5 py-1 rounded-full border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Sẵn hàng trong kho ({displayProduct.stock} sản phẩm)
                  </span>
                )}
              </div>
            )}

            {isLoading && (
              <div className="mb-4.5 flex items-center gap-2 text-xs font-semibold text-dtl-navy bg-dtl-bg-alt/50 border border-dtl-border/60 p-2.5 rounded-lg animate-pulse">
                <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-dtl-red rounded-full animate-spin"></div>
                <span>Đang tải thông tin chi tiết và giá sỉ mới nhất...</span>
              </div>
            )}

            {displayProduct.price && (
              <div className="mb-4 bg-dtl-bg-alt/50 p-4 rounded-lg border border-dtl-border">
                {maxSavingsPercent > 0 && (
                  <div className="mb-3.5 flex items-center gap-2 bg-gradient-to-r from-orange-500 to-dtl-red text-white text-[11px] font-extrabold px-3 py-1.5 rounded-lg shadow-sm">
                    <span className="bg-white text-dtl-red px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                      Ưu đãi sỉ
                    </span>
                    <span>Tiết kiệm tới {maxSavingsPercent}% khi mua số lượng lớn!</span>
                  </div>
                )}

                <div className="flex items-end gap-2 mb-2">
                  <span className="text-2xl font-bold text-dtl-red">{unitPrice?.toLocaleString('vi-VN')}đ</span>
                  <span className="text-sm text-dtl-gray font-medium pb-1">/ theo đơn vị tính</span>
                </div>

                {displayProduct.bulkDiscounts && displayProduct.bulkDiscounts.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-[11px] font-extrabold text-dtl-navy mb-2.5 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-dtl-red rounded-full animate-ping"></span>
                      Bảng chiết khấu giá sỉ tốt nhất
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {[{ threshold: 1, pricePerUnit: displayProduct.price }, ...displayProduct.bulkDiscounts].map(
                        (tier, idx) => {
                          const isSelected =
                            quantity >= tier.threshold &&
                            (idx === displayProduct.bulkDiscounts!.length ||
                              quantity < displayProduct.bulkDiscounts![idx].threshold);

                          return (
                            <button
                              key={idx}
                              onClick={() => setQuantity(tier.threshold)}
                              className={`p-2.5 flex flex-col items-center justify-center rounded-lg text-center cursor-pointer transition-all duration-200 relative ${
                                isSelected
                                  ? 'border-2 border-dtl-red bg-red-50/50 text-dtl-red shadow-sm scale-[1.02]'
                                  : 'border border-dtl-border bg-white text-dtl-gray hover:border-dtl-red/40 hover:bg-dtl-red/5'
                              }`}
                            >
                              {isSelected && (
                                <span className="absolute -top-1.5 -right-1.5 bg-dtl-red text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                                  ✓
                                </span>
                              )}
                              <div
                                className={`text-[11px] font-bold mb-0.5 ${
                                  isSelected ? 'text-dtl-red' : 'text-dtl-dark'
                                }`}
                              >
                                Từ {tier.threshold} sản phẩm
                              </div>
                              <div
                                className={`text-[14px] font-black ${
                                  isSelected ? 'text-dtl-red' : 'text-dtl-dark'
                                }`}
                              >
                                {tier.pricePerUnit.toLocaleString('vi-VN')}đ
                              </div>
                              {tier.threshold > 1 && retailPrice && (
                                <div className="text-[9px] text-green-600 font-extrabold mt-1 bg-green-50/80 border border-green-100 px-1.5 py-0.5 rounded-full leading-none">
                                  Giảm -{Math.round(((retailPrice - tier.pricePerUnit) / retailPrice) * 100)}%
                                </div>
                              )}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeProductCategory.filterDefs && (
              <div className="border border-dtl-border rounded-[5px] overflow-hidden mb-4">
                {activeProductCategory.filterDefs.map((def) => {
                  const val = displayProduct[def.key as keyof typeof displayProduct];
                  if (!val) return null;

                  return (
                    <div key={def.key} className="flex items-stretch border-b border-dtl-border last:border-b-0 text-[13px]">
                      <div className="w-[112px] shrink-0 p-2 px-3 bg-dtl-bg-alt font-bold text-dtl-navy text-[11px] uppercase tracking-[0.3px] flex items-center">
                        {def.label}
                      </div>
                      <div className="flex-1 p-2 px-3 text-dtl-dark font-medium border-l border-dtl-border md:border-l-0">
                        {String(val)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mb-4.5">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-[13px] font-bold text-dtl-dark">Số lượng:</div>
                <div className="flex items-center border border-dtl-border rounded-lg bg-white overflow-hidden">
                  <button
                    disabled={displayProduct.stock === 0}
                    onClick={() => {
                      if (displayProduct.stock === 0) return;
                      setQuantity(Math.max(1, quantity - 1));
                    }}
                    className="w-8 h-8 flex items-center justify-center text-dtl-gray hover:text-dtl-navy hover:bg-dtl-bg-alt transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    disabled={displayProduct.stock === 0}
                    onChange={(e) => {
                      if (displayProduct.stock === 0) return;
                      let val = parseInt(e.target.value, 10) || 1;
                      if (displayProduct.stock !== undefined) {
                        val = Math.min(displayProduct.stock, val);
                      }
                      setQuantity(Math.max(1, val));
                    }}
                    className="w-12 h-8 text-center text-[13px] font-bold border-x border-dtl-border focus:outline-none"
                  />
                  <button
                    disabled={
                      displayProduct.stock === 0 ||
                      (displayProduct.stock !== undefined && quantity >= displayProduct.stock)
                    }
                    onClick={() => {
                      if (displayProduct.stock === 0) return;
                      if (displayProduct.stock !== undefined && quantity >= displayProduct.stock) return;
                      setQuantity(quantity + 1);
                    }}
                    className="w-8 h-8 flex items-center justify-center text-dtl-gray hover:text-dtl-navy hover:bg-dtl-bg-alt transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={() => {
                    closeProductDetail();
                    openContactModal();
                  }}
                  className="w-full py-3 px-5 rounded-[6px] text-[13.5px] font-extrabold text-center block bg-dtl-red text-white hover:bg-dtl-red-dark transition-all select-none shadow-[0_4px_12px_rgba(227,30,36,0.18)] hover:shadow-[0_4px_16px_rgba(227,30,36,0.28)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Phone className="w-4 h-4 animate-[pulse_1s_infinite]" strokeWidth={2.5} />
                  NHẬN BÁO GIÁ SỈ THEO SỐ LƯỢNG NGAY
                </button>
              </div>
            </div>

            {displayProduct.desc && (
              <div
                className="text-[13px] text-dtl-dark leading-[1.75]"
                dangerouslySetInnerHTML={{ __html: displayProduct.desc }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
