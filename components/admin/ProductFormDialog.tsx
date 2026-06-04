'use client';

import { useActionState, useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, Pencil, Plus } from 'lucide-react';

import { AdminActionButton } from '@/components/admin/AdminActionButton';
import { AdminModal } from '@/components/admin/AdminModal';
import { ProductForm } from '@/components/admin/ProductForm';
import { useToast } from '@/components/admin/AdminToast';
import type { AdminCategory } from '@/lib/services/admin/categories';
import type { ProductFormData } from '@/lib/services/admin/products';
import {
  createProductAction,
  fetchProductDetailAction,
  updateProductAction,
  type AdminFormState,
} from '@/app/admin/(dashboard)/products/actions';

interface ProductFormDialogProps {
  categories: AdminCategory[];
  /** Provide id + name to enter edit mode; form data is fetched lazily on open. */
  product?: { id: string; name?: string };
}

const INITIAL_STATE: AdminFormState = { ok: false };

export function ProductFormDialog({ categories, product }: ProductFormDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const formId = useId();
  const isEdit = Boolean(product?.id);

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<ProductFormData | null>(null);
  const [loadingForm, setLoadingForm] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const action = isEdit ? updateProductAction : createProductAction;
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

  const openDialog = async () => {
    handledOk.current = false;
    setFetchError(null);

    if (isEdit && product?.id) {
      setLoadingForm(true);
      setFormData(null);
      setOpen(true);

      const result = await fetchProductDetailAction(product.id);
      if (result.error || !result.data) {
        setFetchError(result.error ?? 'Không tìm thấy sản phẩm');
      } else {
        const d = result.data;
        setFormData({
          id: d.id,
          name: d.name,
          slug: d.slug,
          category_id: d.category_id,
          price: d.price,
          stock: d.stock,
          is_active: d.is_active,
          description: d.description,
          specs: d.specs,
        });
      }
      setLoadingForm(false);
    } else {
      setFormData(null);
      setOpen(true);
    }
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
          loadingForm || fetchError ? undefined : (
            <>
              <button
                type="button"
                onClick={closeDialog}
                disabled={isPending}
                className="admin-button-secondary px-5 text-xs"
              >
                Hủy
              </button>
              <button
                type="submit"
                form={formId}
                disabled={isPending}
                className="admin-button-primary px-6 text-xs"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isPending ? 'Đang lưu…' : isEdit ? 'Cập nhật sản phẩm' : 'Đăng sản phẩm'}
              </button>
            </>
          )
        }
      >
        {loadingForm ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-[#4880FF]" />
            <span className="ml-2 text-sm text-slate-500">Đang tải thông tin sản phẩm…</span>
          </div>
        ) : fetchError ? (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-[#FFF5F5] px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#E31E24]" />
            <p className="text-xs font-medium text-[#B42318]">{fetchError}</p>
          </div>
        ) : (
          <ProductForm
            formId={formId}
            formAction={formAction}
            state={state}
            categories={categories}
            product={formData ?? undefined}
          />
        )}
      </AdminModal>
    </>
  );
}
