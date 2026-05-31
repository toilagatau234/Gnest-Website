'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Plus } from 'lucide-react';

import { AdminActionButton } from '@/components/admin/AdminActionButton';
import { AdminModal } from '@/components/admin/AdminModal';
import { ProductForm } from '@/components/admin/ProductForm';
import type { AdminCategory } from '@/lib/services/admin/categories';
import type { AdminProduct } from '@/lib/services/admin/products';

interface ProductFormDialogProps {
  categories: AdminCategory[];
  /** When provided the dialog edits this product; otherwise it creates a new one. */
  product?: AdminProduct;
}

export function ProductFormDialog({ categories, product }: ProductFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(product);

  const handleSuccess = useCallback(() => {
    setOpen(false);
    router.refresh();
  }, [router]);

  return (
    <>
      {isEdit ? (
        <AdminActionButton variant="secondary" size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setOpen(true)}>
          Sửa
        </AdminActionButton>
      ) : (
        <AdminActionButton icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
          Thêm sản phẩm
        </AdminActionButton>
      )}

      <AdminModal
        open={open}
        onClose={() => setOpen(false)}
        title={isEdit ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}
        description="Thông tin cơ bản, giá & kho và thông số kỹ thuật."
        size="xl"
      >
        <ProductForm categories={categories} product={product} onSuccess={handleSuccess} />
      </AdminModal>
    </>
  );
}
