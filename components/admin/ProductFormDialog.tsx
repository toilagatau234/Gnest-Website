'use client';

import { useActionState, useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Pencil, Plus } from 'lucide-react';

import { AdminActionButton } from '@/components/admin/AdminActionButton';
import { AdminModal } from '@/components/admin/AdminModal';
import { ProductForm } from '@/components/admin/ProductForm';
import { useToast } from '@/components/admin/AdminToast';
import type { AdminCategory } from '@/lib/services/admin/categories';
import type { AdminProduct } from '@/lib/services/admin/products';
import {
  createProductAction,
  updateProductAction,
  type AdminFormState,
} from '@/app/admin/(dashboard)/products/actions';

interface ProductFormDialogProps {
  categories: AdminCategory[];
  /** When provided the dialog edits this product; otherwise it creates a new one. */
  product?: AdminProduct;
}

const INITIAL_STATE: AdminFormState = { ok: false };

export function ProductFormDialog({ categories, product }: ProductFormDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const formId = useId();
  const isEdit = Boolean(product);

  const [open, setOpen] = useState(false);
  const action = product ? updateProductAction : createProductAction;
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);
  const handledOk = useRef(false);

  useEffect(() => {
    if (open && state.ok && !handledOk.current) {
      handledOk.current = true;
      toast(isEdit ? 'Đã cập nhật sản phẩm.' : 'Đã đăng sản phẩm mới.', 'success');
      setOpen(false);
      router.refresh();
    }
  }, [open, state.ok, isEdit, router, toast]);

  const openDialog = () => {
    handledOk.current = false;
    setOpen(true);
  };

  const closeDialog = () => {
    if (isPending) return;
    setOpen(false);
  };

  return (
    <>
      {isEdit ? (
        <AdminActionButton variant="secondary" size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={openDialog}>
          Sửa
        </AdminActionButton>
      ) : (
        <AdminActionButton icon={<Plus className="h-4 w-4" />} onClick={openDialog}>
          Thêm sản phẩm
        </AdminActionButton>
      )}

      <AdminModal
        open={open}
        onClose={closeDialog}
        title={isEdit ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}
        description="Thông tin cơ bản, giá & kho và thông số kỹ thuật."
        size="xl"
        dismissible={!isPending}
        footer={
          <>
            <button
              type="button"
              onClick={closeDialog}
              disabled={isPending}
              className="admin-focus inline-flex h-10 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white px-5 text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="submit"
              form={formId}
              disabled={isPending}
              className="admin-focus inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#1B3A6B] px-6 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#16315b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isPending ? 'Đang lưu…' : isEdit ? 'Cập nhật sản phẩm' : 'Đăng sản phẩm'}
            </button>
          </>
        }
      >
        <ProductForm
          formId={formId}
          formAction={formAction}
          state={state}
          categories={categories}
          product={product}
        />
      </AdminModal>
    </>
  );
}
