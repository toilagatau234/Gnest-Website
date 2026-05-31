'use client';

import React, { useState } from 'react';
import { X, PhoneCall, CheckCircle2, MessageCircle, ShoppingBag, Calculator } from 'lucide-react';
import { Product, Category } from '@/lib/mock-data';

interface ProductPreviewModalProps {
  product: Product;
  categories: Category[];
  onClose: () => void;
  triggerToast: (msg: string, type: 'success' | 'error') => void;
}

export default function ProductPreviewModal({
  product,
  categories,
  onClose,
  triggerToast
}: ProductPreviewModalProps) {
  const [selectedImgIdx, setSelectedImgIdx] = useState<number>(0);
  const [qty, setQty] = useState<number>(100);

  const getCategoryName = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : 'Chưa phân loại';
  };

  // Wholesale calculator logic
  const getUnitPriceForQty = (quantity: number) => {
    if (typeof product.price === 'string') return 0;
    
    // Sort discounts descending by min_qty
    const sortedDiscounts = [...product.bulk_discounts].sort((a, b) => b.min_qty - a.min_qty);
    const applicable = sortedDiscounts.find(tier => quantity >= tier.min_qty);
    
    return applicable ? applicable.price_per_unit : (product.price || 0);
  };

  const calculatedUnitPrice = getUnitPriceForQty(qty);
  const calculatedTotal = calculatedUnitPrice * qty;

  const handleContactZalo = () => {
    triggerToast(`Đang liên kết chat Zalo để thương lượng sỉ số lượng lớn (${qty} cái) cho sản phẩm ${product.name}`, "success");
    window.open(`https://zalo.me/0987654321`, '_blank');
  };

  const handleCallBack = () => {
    triggerToast(`Đã ghi nhận yêu cầu gọi lại tư vấn mẫu sản phẩm ${product.name}, nhân viên tư vấn sẽ liên hệ lại ngay!`, "success");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      
      {/* Modal Main container */}
      <div className="relative bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-200/80 flex flex-col md:flex-row md:max-h-[85vh]">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-slate-900/10 hover:bg-slate-900/20 text-slate-700 hover:text-slate-900 rounded-full transition-colors border border-white/20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Column 1: Image Gallery (Left half on desktop) */}
        <div className="md:w-1/2 p-6 bg-slate-50 flex flex-col justify-between">
          
          {/* Active Image Canvas */}
          <div className="flex-1 flex items-center justify-center bg-white rounded-2xl overflow-hidden aspect-video border border-slate-200 shadow-xs relative">
            {product.images.length > 0 ? (
              <img 
                src={product.images[selectedImgIdx]?.url} 
                alt={product.images[selectedImgIdx]?.alt || product.name} 
                className="w-full h-full object-cover transition-all"
              />
            ) : (
              <div className="text-center p-8 text-rose-500 font-semibold space-y-1.5">
                <p className="p-2 border border-rose-200 bg-rose-50 rounded-full inline-block">⚠️</p>
                <p className="text-xs">Sản phẩm này chưa có ảnh sỉ sản xuất</p>
              </div>
            )}
            
            {/* Primary badge tag */}
            <span className="absolute bottom-3 left-3 bg-[#1B3A6B] text-white text-[9px] font-bold px-2 py-0.5 rounded-md font-mono uppercase tracking-wider">
              {getCategoryName(product.category_id)}
            </span>
          </div>

          {/* Thumbnail gallery slider */}
          {product.images.length > 1 && (
            <div className="flex gap-2.5 mt-4 overflow-x-auto pb-1">
              {product.images.map((img, iIdx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImgIdx(iIdx)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-colors ${
                    selectedImgIdx === iIdx ? 'border-[#E31E24] shadow' : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Technical Specs grid */}
          <div className="mt-5 space-y-2 text-xs">
            <h4 className="font-bold text-[#1B3A6B] text-[10px] uppercase tracking-wider font-mono">Thông Số Kỹ Thuật (Specs):</h4>
            <div className="grid grid-cols-2 gap-2">
              {product.specs.map((spec, sIdx) => (
                <div key={sIdx} className="p-2 bg-white rounded-lg border border-slate-200/60">
                  <p className="text-slate-400 text-[9px] uppercase tracking-wider font-mono">{spec.key}</p>
                  <p className="font-semibold text-slate-800 mt-0.5 mt-0.5 truncate">{spec.value}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Column 2: Pricing, details and calculator (Right half) */}
        <div className="md:w-1/2 p-6 overflow-y-auto space-y-5 flex flex-col justify-between">
          
          <div className="space-y-4">
            {/* Name */}
            <div>
              <h2 className="text-[#1B3A6B] font-extrabold text-lg leading-tight tracking-tight">{product.name}</h2>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">/{product.slug}</p>
            </div>

            {/* Price banner */}
            <div className="py-2.5 px-3.5 bg-slate-50 border-l-4 border-l-[#E31E24] rounded-r-xl">
              <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider block">Gía bán lẻ đề xuất tham khảo:</span>
              <strong className="text-slate-800 text-sm font-bold">
                {typeof product.price === 'number' ? `${product.price.toLocaleString('vi-VN')} đ` : 'Liên hệ sỉ'}
              </strong>
              <span className="text-slate-500 text-xs font-mono"> /{product.unit}</span>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 leading-relaxed font-normal">{product.description}</p>

            {/* Wholesale tiers lists */}
            {product.bulk_discounts.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-[#1B3A6B] uppercase tracking-wider font-mono">Bảng Giá Chiết Khấu Số Lượng Lớn:</p>
                <div className="grid grid-cols-3 gap-2">
                  {product.bulk_discounts.map((tier, tIdx) => (
                    <div key={tIdx} className="p-2 bg-emerald-50/60 border border-emerald-100 rounded-xl text-center text-xs">
                      <p className="text-slate-500 text-[9px] font-mono">&ge; {tier.min_qty} {product.unit}</p>
                      <p className="font-extrabold text-emerald-800 mt-0.5">{tier.price_per_unit.toLocaleString('vi-VN')}đ</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Calculator widget */}
            {typeof product.price === 'number' && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <h4 className="text-[10px] font-extrabold text-[#1B3A6B] uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-[#E31E24]" /> Tính Dự Chi Sỉ Catalog
                </h4>
                
                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-semibold mb-1">Số lượng sỉ lấy:</label>
                    <input 
                      type="number" 
                      min={1}
                      value={qty}
                      onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full bg-white border border-slate-350 border-slate-300 focus:outline-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B] rounded-lg px-2 py-1 text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">Giá sỉ chạm mốc:</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{calculatedUnitPrice.toLocaleString('vi-VN')} đ</p>
                  </div>
                </div>

                <div className="border-t border-slate-200/50 pt-2 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Tổng tạm tính đơn sỉ:</span>
                  <span className="text-sm font-extrabold text-[#E31E24]">{calculatedTotal.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
            )}

          </div>

          {/* Action CTAs */}
          <div className="grid grid-cols-2 gap-3.5 pt-4 border-t border-slate-100">
            <button
              onClick={handleCallBack}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-250 text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors outline-none cursor-pointer"
            >
              <PhoneCall className="w-4 h-4 text-slate-500" /> Gọi Hotline
            </button>
            <button
              onClick={handleContactZalo}
              className="bg-[#1B3A6B] hover:bg-[#112546] text-white text-xs font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs outline-none cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" /> Chat Thương Lượng
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
