'use client';

import { useState } from 'react';
import { ImageIcon, Percent, Settings } from 'lucide-react';

import { AdminModal } from '@/components/admin/AdminModal';
import { ProductMediaManager } from '@/components/admin/ProductMediaManager';
import { ProductBulkDiscountManager } from '@/components/admin/ProductBulkDiscountManager';
import type { AdminProduct } from '@/lib/services/admin/products';

interface ProductMediaAndDiscountDialogProps {
  product: AdminProduct;
}

export function ProductMediaAndDiscountDialog({ product }: ProductMediaAndDiscountDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'media' | 'discounts'>('media');

  const images = product.product_images || [];
  const discounts = product.product_bulk_discounts || [];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="admin-focus inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E2E8F0] px-3 text-xs font-bold text-slate-700 transition hover:border-[#1B3A6B] hover:text-[#1B3A6B] cursor-pointer"
        title="Quản lý Media & Giá bán sỉ"
      >
        <Settings className="h-3.5 w-3.5" />
        <span>Media & Giá sỉ</span>
      </button>

      <AdminModal
        open={open}
        onClose={() => setOpen(false)}
        title={`Quản lý Media & Giá sỉ: ${product.name}`}
        description="Thiết lập các hình ảnh minh họa chi tiết và bậc giá bán sỉ cho khách hàng B2B"
        size="2xl"
      >
        <div className="space-y-6">
          {/* Elegant Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('media')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'media'
                  ? 'border-[#1B3A6B] text-[#1B3A6B]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Media & Hình ảnh sỉ ({images.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('discounts')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'discounts'
                  ? 'border-[#1B3A6B] text-[#1B3A6B]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Percent className="w-4 h-4" />
              <span>Bậc chiết khấu giá sỉ ({discounts.length})</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[300px]">
            {activeTab === 'media' ? (
              <ProductMediaManager 
                productId={product.id} 
                images={images} 
              />
            ) : (
              <ProductBulkDiscountManager 
                productId={product.id} 
                discounts={discounts}
                retailPrice={product.price}
              />
            )}
          </div>
        </div>
      </AdminModal>
    </>
  );
}
