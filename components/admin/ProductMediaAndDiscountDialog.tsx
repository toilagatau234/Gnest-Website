'use client';

import { useState } from 'react';
import { AlertCircle, ImageIcon, Loader2, Percent, Settings } from 'lucide-react';

import { AdminModal } from '@/components/admin/AdminModal';
import { ProductMediaManager } from '@/components/admin/ProductMediaManager';
import { ProductBulkDiscountManager } from '@/components/admin/ProductBulkDiscountManager';
import { fetchProductDetailAction } from '@/app/admin/(dashboard)/products/actions';
import type { AdminProduct } from '@/lib/services/admin/products';

interface ProductMediaAndDiscountDialogProps {
  productId: string;
  productName: string;
  productPrice: number | null;
}

export function ProductMediaAndDiscountDialog({ productId, productName, productPrice }: ProductMediaAndDiscountDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'media' | 'discounts'>('media');
  const [discountSessionKey, setDiscountSessionKey] = useState(0);
  const [detail, setDetail] = useState<AdminProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  async function loadDetail(silent = false) {
    if (!silent) {
      setLoading(true);
    }
    setFetchError(null);
    const result = await fetchProductDetailAction(productId);
    if (!silent) {
      setLoading(false);
    }
    if (result.error || !result.data) {
      setFetchError(result.error ?? 'Không thể tải dữ liệu sản phẩm.');
    } else {
      setDetail(result.data);
    }
  }

  async function openDialog() {
    setDiscountSessionKey((current) => current + 1);
    setOpen(true);
    if (detail) return;
    await loadDetail();
  }

  const images = detail?.product_images ?? [];
  const discounts = detail?.product_bulk_discounts ?? [];

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="admin-focus inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E2E8F0] px-3 text-xs font-bold text-slate-700 transition hover:border-[#1B3A6B] hover:text-[#1B3A6B] cursor-pointer"
        title="Quản lý Media & Giá bán sỉ"
      >
        <Settings className="h-3.5 w-3.5" />
        <span>Media & Giá sỉ</span>
      </button>

      <AdminModal
        open={open}
        onClose={() => setOpen(false)}
        title={`Quản lý Media & Giá sỉ: ${productName}`}
        description="Thiết lập các hình ảnh minh họa chi tiết và bậc giá bán sỉ cho khách hàng B2B"
        size="2xl"
      >
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center gap-3 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">Đang tải dữ liệu…</span>
          </div>
        ) : fetchError ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 text-red-600">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span className="text-sm">{fetchError}</span>
            </div>
            <button
              type="button"
              onClick={() => loadDetail()}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="space-y-6">
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

            <div className="min-h-[300px]">
              {activeTab === 'media' ? (
                <ProductMediaManager productId={productId} images={images} />
              ) : (
                <ProductBulkDiscountManager
                  key={`${productId}:${discountSessionKey}`}
                  productId={productId}
                  discounts={discounts}
                  retailPrice={productPrice}
                  onMutated={() => loadDetail(true)}
                />
              )}
            </div>
          </div>
        )}
      </AdminModal>
    </>
  );
}
