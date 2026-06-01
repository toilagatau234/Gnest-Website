'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';

import { ProductFormDialog } from '@/components/admin/ProductFormDialog';
import { AdminConfirmDialog } from '@/components/admin/AdminConfirmDialog';
import { useToast } from '@/components/admin/AdminToast';
import type { AdminCategory } from '@/lib/services/admin/categories';
import type { AdminProduct } from '@/lib/services/admin/products';
import { deleteProductAction, toggleProductActiveAction } from '@/app/admin/(dashboard)/products/actions';

interface ProductRowActionsProps {
  categories: AdminCategory[];
  product: AdminProduct;
}

export function ProductRowActions({ categories, product }: ProductRowActionsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isToggling, startToggle] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleToggle = () => {
    startToggle(async () => {
      const formData = new FormData();
      formData.set('id', product.id);
      formData.set('next_is_active', String(!product.is_active));
      try {
        await toggleProductActiveAction(formData);
        toast(product.is_active ? 'Đã ẩn sản phẩm.' : 'Đã hiển thị sản phẩm.', 'success');
        router.refresh();
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Không thể đổi trạng thái.', 'error');
      }
    });
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isToggling}
        className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-[10px] font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
          product.is_active
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            : 'border-slate-200 bg-slate-100 text-slate-400 hover:bg-slate-200/50'
        }`}
      >
        {isToggling ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
        {product.is_active ? 'Hiển thị' : 'Đang ẩn'}
      </button>

      <ProductFormDialog categories={categories} product={product} />

      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        aria-label="Xóa sản phẩm"
        title="Xóa sản phẩm"
        className="admin-focus inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] text-slate-500 transition hover:border-[#E31E24] hover:text-[#E31E24]"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <AdminConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Xóa sản phẩm"
        description="Hành động này sẽ xóa vĩnh viễn sản phẩm. Nếu sản phẩm còn dữ liệu liên quan, hãy ẩn thay vì xóa."
        itemName={product.name}
        confirmLabel="Xóa sản phẩm"
        onConfirm={() => deleteProductAction(product.id)}
        onSuccess={() => {
          toast('Đã xóa sản phẩm.', 'success');
          router.refresh();
        }}
      />
    </div>
  );
}
