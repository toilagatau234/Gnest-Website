'use client';

import { useActionState, useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Pencil, Plus } from 'lucide-react';

import { AdminActionButton } from '@/components/admin/AdminActionButton';
import { AdminModal } from '@/components/admin/AdminModal';
import { CategoryForm } from '@/components/admin/CategoryForm';
import { useToast } from '@/components/admin/AdminToast';
import type { AdminCategory } from '@/lib/services/admin/categories';
import {
  createCategoryAction,
  updateCategoryAction,
  type AdminFormState,
} from '@/app/admin/(dashboard)/categories/actions';
import type { CategoryType } from '@/lib/types/database';

interface CategoryFormDialogProps {
  categories: AdminCategory[];
  category?: AdminCategory;
  fixedType?: CategoryType;
}

interface CategoryFormDialogSessionProps extends CategoryFormDialogProps {
  onClose: () => void;
}

const INITIAL_STATE: AdminFormState = { ok: false };

function CategoryFormDialogSession({
  categories,
  category,
  fixedType,
  onClose,
}: CategoryFormDialogSessionProps) {
  const router = useRouter();
  const { toast } = useToast();
  const formId = useId();
  const isEdit = Boolean(category);
  const action = category ? updateCategoryAction : createCategoryAction;
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);
  const handledOk = useRef(false);

  useEffect(() => {
    if (!state.ok || handledOk.current) {
      return;
    }

    handledOk.current = true;
    const term = fixedType === 'service' ? 'dịch vụ' : 'danh mục';
    toast(isEdit ? `Đã lưu thay đổi ${term}.` : `Đã tạo ${term} mới.`, 'success');
    onClose();
    router.refresh();
  }, [state.ok, fixedType, isEdit, onClose, router, toast]);

  const closeDialog = () => {
    if (isPending) {
      return;
    }

    onClose();
  };

  return (
    <AdminModal
      open
      onClose={closeDialog}
      title={
        isEdit
          ? fixedType === 'service'
            ? 'Cập nhật dịch vụ'
            : 'Cập nhật danh mục'
          : fixedType === 'service'
            ? 'Thêm dịch vụ'
            : 'Thêm danh mục'
      }
      description={
        fixedType === 'service'
          ? 'Quản lý thông tin dịch vụ chuyên nghiệp hiển thị trên trang chủ.'
          : 'Quản lý danh mục cha/con hiển thị trên catalog.'
      }
      size="lg"
      dismissible={!isPending}
      footer={
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
            {isPending ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : fixedType === 'service' ? 'Tạo dịch vụ' : 'Tạo danh mục'}
          </button>
        </>
      }
    >
      <CategoryForm
        formId={formId}
        formAction={formAction}
        state={state}
        categories={categories}
        category={category}
        fixedType={fixedType}
      />
    </AdminModal>
  );
}

export function CategoryFormDialog({ categories, category, fixedType }: CategoryFormDialogProps) {
  const isEdit = Boolean(category);
  const [open, setOpen] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  const openDialog = () => {
    setSessionKey((current) => current + 1);
    setOpen(true);
  };

  return (
    <>
      {isEdit ? (
        <AdminActionButton variant="secondary" size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={openDialog}>
          Sửa
        </AdminActionButton>
      ) : (
        <AdminActionButton icon={<Plus className="h-4 w-4" />} onClick={openDialog}>
          {fixedType === 'service' ? 'Thêm dịch vụ' : 'Thêm danh mục'}
        </AdminActionButton>
      )}

      {open ? (
        <CategoryFormDialogSession
          key={sessionKey}
          categories={categories}
          category={category}
          fixedType={fixedType}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
