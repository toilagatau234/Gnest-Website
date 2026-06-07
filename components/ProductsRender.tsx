'use client';

import { useModal } from '@/lib/context';
import { Layers, Info, Sparkles, Quote, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { LazyProductImageDisplay } from './LazyProductImageDisplay';
import { useCategories } from '@/lib/categories-context';
import { Interactive3DTilt } from './Interactive3DTilt';
import { CatalogItem } from '@/lib/data';
import { PublicProductCard } from '@/lib/services/public-products';

interface ProductsRenderProps {
  overviewProducts?: Record<string, PublicProductCard[]>;
}

export function ProductsRender({ overviewProducts }: ProductsRenderProps = {}) {
  const { openProductDetail, openContactModal } = useModal();
  const { catalog, categories, loading } = useCategories();

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-dtl-gray">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-dtl-red animate-spin mb-4"></div>
        <p className="text-sm font-medium">Đang tải sản phẩm Đại Tài Lợi...</p>
      </div>
    );
  }

  // Get root product categories
  const rootProductCategories = categories.filter(c => c.type === 'product' && !c.parentId);
  
  // Get all services
  const serviceCategories = categories.filter(c => c.type === 'service');

  return (
    <div id="san-pham">
      {/* 1. PRODUCT CATEGORIES SECTIONS */}
      {rootProductCategories.map((dbCat, index) => {
        const cat = catalog[dbCat.id];
        if (!cat) return null;
        
        const itemsFromOverview = overviewProducts?.[dbCat.id] || [];
        const overviewItems: CatalogItem[] = itemsFromOverview.length > 0
          ? itemsFromOverview.map(card => ({
              id: card.slug,
              name: card.name,
              img: card.thumbnailUrl || '/placeholder.svg',
              imgs: card.thumbnailUrl ? [card.thumbnailUrl] : [],
              price: card.price ?? undefined,
              stock: card.stock,
              categoryId: dbCat.id,
              dungTich: card.specs.dungTich,
              quyCach: card.specs.quyCach,
              phiNap: card.specs.phiNap,
              loaiNap: card.specs.loaiNap,
              color: card.specs.color,
              bulkDiscounts: card.hasActiveBulkDiscount && card.minBulkPrice ? [
                { threshold: 10, pricePerUnit: card.minBulkPrice }
              ] : undefined
            }))
          : (cat.items || []).slice(0, 4);
          
        const isAlt = index % 2 !== 0;

        return (
          <section key={dbCat.id} className={`py-8 md:py-10 ${isAlt ? 'bg-dtl-bg-alt' : 'bg-white'}`} id={dbCat.id}>
            <div className="max-w-[1220px] mx-auto px-5">
              <Link href={`/danh-muc/${dbCat.id}`} className="flex items-stretch justify-between bg-dtl-navy mb-5 rounded-[4px] overflow-hidden group hover:bg-[#0c1a30] transition-all shadow-sm">
                <div className="flex items-center gap-0 p-0">
                  <div className="w-1.5 bg-dtl-red self-stretch shrink-0"></div>
                  <h2 className="text-white text-[15px] font-bold uppercase tracking-wide px-5 py-[11px]">{cat.title}</h2>
                </div>
                <div
                  className="px-[18px] py-[11px] text-xs font-bold text-white/70 whitespace-nowrap self-center transition-colors group-hover:text-white"
                >
                  Xem tất cả →
                </div>
              </Link>

              {overviewItems.length > 0 ? (
                <div className="grid grid-cols-1 min-[340px]:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                  {overviewItems.map((item, idx) => {
                    return (
                      <Interactive3DTilt
                        key={idx}
                        className="bg-white border border-dtl-border rounded-lg overflow-hidden flex flex-col group cursor-pointer shadow-sm hover:shadow-[0_16px_40px_rgba(0,0,0,0.12)] transition-shadow duration-300"
                        maxTilt={10}
                      >
                        {/* Full-card navigation link — z-[1] below button */}
                        <Link
                          href={`/san-pham/${item.id}`}
                          className="absolute inset-0 z-[1] rounded-lg"
                          aria-label={`Xem chi tiết ${item.name}`}
                        />

                        {/* Card content — pointer-events-none so link overlay handles card clicks */}
                        <div className="flex flex-col h-full w-full pointer-events-none">
                          <div className="w-full aspect-square bg-[#fff] p-4 relative overflow-hidden border-b border-dtl-bg-alt flex items-center justify-center">
                            {item.bulkDiscounts && item.bulkDiscounts.length > 0 && (
                              <div className="absolute top-2.5 left-2.5 z-10 bg-gradient-to-r from-dtl-red to-orange-500 text-white text-[9px] min-[340px]:text-[10px] font-bold px-2 py-0.5 rounded shadow-sm tracking-wide uppercase">
                                GIÁ SỈ CHIẾT KHẤU LỚN
                              </div>
                            )}
                            <LazyProductImageDisplay imgs={item.imgs} img={item.img} alt={item.name} />
                          </div>

                          <div className="p-3.5 bg-white flex-1 flex flex-col items-center">
                            <div className="text-[13px] md:text-[14px] font-bold text-dtl-dark text-center leading-[1.45] transition-colors group-hover:text-dtl-red mb-2 h-10 line-clamp-2 overflow-hidden text-ellipsis font-sans">
                              {item.name}
                            </div>

                            {item.price ? (
                              <div className="mb-3 text-center flex flex-col items-center">
                                <div className="text-dtl-red text-[14px] md:text-[15px] font-extrabold">{item.price.toLocaleString('vi-VN')}đ</div>
                                {item.bulkDiscounts && item.bulkDiscounts.length > 0 ? (
                                  <div className="mt-1 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100 text-orange-700 text-[9px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-orange-500 animate-pulse"></span>
                                    <span>Sỉ chỉ từ:</span>
                                    <span className="font-extrabold text-[#c2410c]">{Math.min(...item.bulkDiscounts.map(d => d.pricePerUnit)).toLocaleString('vi-VN')}đ</span>
                                  </div>
                                ) : null}
                              </div>
                            ) : (
                              <div className="mb-3 text-dtl-gray text-xs font-semibold">Liên hệ báo giá sỉ</div>
                            )}

                            {/* Button re-enables pointer events at z-[2] above the link overlay */}
                            <div className="mt-auto w-full pt-1 flex relative z-[2] pointer-events-auto">
                              <button
                                onClick={() => openProductDetail(item, cat)}
                                className="w-full bg-[#f8f9fa] group-hover:bg-dtl-red font-bold text-[11px] md:text-[12px] py-[8.5px] rounded text-dtl-navy group-hover:text-white transition-all border border-dtl-border group-hover:border-dtl-red flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                              >
                                <Info className="w-3.5 h-3.5" />
                                Chi Tiết & Báo Giá Sỉ
                              </button>
                            </div>
                          </div>
                        </div>
                      </Interactive3DTilt>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white p-8 rounded-lg text-center border border-dashed border-dtl-border">
                  <p className="text-[13.5px] text-dtl-gray">Đang cập nhật danh sách sản phẩm. Vui lòng quay lại sau hoặc liên hệ Hotline.</p>
                </div>
              )}
            </div>
          </section>
        );
      })}

      {/* 2. SERVICES SHOWCASE SECTION */}
      <section className="py-12 bg-slate-50 border-t border-b border-slate-100" id="dich-vu">
        <div className="max-w-[1220px] mx-auto px-5">
          <div className="text-center mb-10">
            <h2 className="text-[28px] font-black text-dtl-navy flex items-center justify-center gap-2">
              <Sparkles className="text-dtl-red w-7 h-7 animate-pulse" /> DỊCH VỤ CHUYÊN NGHIỆP
            </h2>
            <p className="text-sm text-dtl-gray mt-2 max-w-xl mx-auto">
              Đại Tài Lợi cung cấp dịch vụ sản xuất, gia công, in ấn thương hiệu trọn gói với dây chuyền hiện đại và kỹ thuật tay nghề cao.
            </p>
            <div className="w-12 h-[3.5px] bg-dtl-red mx-auto mt-3.5 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serviceCategories.map((srv) => {
              const cat = catalog[srv.id];
              return (
                <Interactive3DTilt 
                  key={srv.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col group relative overflow-hidden"
                  maxTilt={8}
                >
                  <div className="p-6 flex flex-col justify-between h-full w-full">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-dtl-red/5 rounded-bl-[100px] transition-all group-hover:bg-dtl-red/10 pointer-events-none"></div>
                    
                    <div>
                      <div className="w-10 h-10 bg-slate-100 text-dtl-red rounded-lg flex items-center justify-center mb-4.5 font-black shrink-0">
                        <Quote className="w-5 h-5 opacity-80" />
                      </div>
                      <h3 className="text-[16px] font-bold text-dtl-navy mb-2">{srv.title}</h3>
                      <p className="text-[13px] text-slate-500 leading-relaxed mb-5">
                        Cam kết quy trình chất lượng cao bậc nhất, giao nhận nhanh chóng tận xưởng, giá xuất xưởng tốt nhất cho các đại lý kinh doanh toàn quốc.
                      </p>
                      <div className="space-y-1.5 mb-6">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                          <span>Kỹ thuật hiện đại hàng đầu</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                          <span>Bản vẽ duyệt nhanh trong ngày</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto w-full pt-1">
                      <button 
                        onClick={openContactModal}
                        className="w-full bg-[#f8f9fa] group-hover:bg-dtl-red font-bold text-xs py-2.5 rounded text-dtl-navy group-hover:text-white transition-all border border-dtl-border group-hover:border-dtl-red flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        Liên Hệ Tư Vấn
                      </button>
                    </div>
                  </div>
                </Interactive3DTilt>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
