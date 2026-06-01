'use client';

import { useState, useEffect } from 'react';
import { ImageIcon, Percent, Loader2, Settings } from 'lucide-react';

import { AdminModal } from '@/components/admin/AdminModal';
import { ProductMediaManager } from '@/components/admin/ProductMediaManager';
import { ProductBulkDiscountManager } from '@/components/admin/ProductBulkDiscountManager';
import { createClient } from '@/lib/supabase/client';
import type { AdminProduct } from '@/lib/services/admin/products';

interface ProductMediaAndDiscountDialogProps {
  product: AdminProduct;
}

export function ProductMediaAndDiscountDialog({ product }: ProductMediaAndDiscountDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'media' | 'discounts'>('media');
  const [loading, setLoading] = useState(false);
  
  // Dynamic details state
  const [images, setImages] = useState<any[]>([]);
  const [discounts, setDiscounts] = useState<any[]>([]);

  // Fetch the latest data when dialog opens
  useEffect(() => {
    if (!open) return;

    async function fetchDetails() {
      setLoading(true);
      try {
        const supabase = createClient();
        
        // 1. Fetch images (to ensure sorting and fresh active state)
        const { data: imgData, error: imgError } = await supabase
          .from('product_images')
          .select('*')
          .eq('product_id', product.id)
          .order('sort_order', { ascending: true });

        // 2. Fetch bulk discounts
        const { data: discData, error: discError } = await supabase
          .from('product_bulk_discounts')
          .select('*')
          .eq('product_id', product.id)
          .order('min_quantity', { ascending: true });

        if (!imgError && imgData) {
          setImages(imgData);
        }
        if (!discError && discData) {
          setDiscounts(discData);
        }
      } catch (err) {
        console.error('Lỗi khi tải chi tiết sản phẩm:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [open, product.id]);

  // Keep internal states synced when router.refresh() happens in parent
  // (e.g. after uploading image, setImages is updated)
  useEffect(() => {
    if (!open || loading) return;
    
    // We can refetch or rely on parent updates. Let's do a silent refetch to keep dialog completely synced!
    const supabase = createClient();
    supabase
      .from('product_images')
      .select('*')
      .eq('product_id', product.id)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data) setImages(data);
      });

    supabase
      .from('product_bulk_discounts')
      .select('*')
      .eq('product_id', product.id)
      .order('min_quantity', { ascending: true })
      .then(({ data }) => {
        if (data) setDiscounts(data);
      });
  }, [product.updated_at, open, loading, product.id]);

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

          {/* Dynamic Content */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-[#1B3A6B]" />
              <p className="font-bold text-xs">Đang đồng bộ dữ liệu sỉ từ hệ thống...</p>
            </div>
          ) : (
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
          )}
        </div>
      </AdminModal>
    </>
  );
}
