'use client';

import { useActionState, useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Pencil, Plus } from 'lucide-react';

import { AdminActionButton } from '@/components/admin/AdminActionButton';
import { AdminModal } from '@/components/admin/AdminModal';
import { SalesContactForm } from '@/components/admin/SalesContactForm';
import { useToast } from '@/components/admin/AdminToast';
import type { AdminSalesContact } from '@/lib/services/admin/sales-contacts';
import {
  createSalesContactAction,
  updateSalesContactAction,
  type AdminFormState,
} from '@/app/admin/(dashboard)/sales-contacts/actions';

interface SalesContactFormDialogProps {
  contact?: AdminSalesContact;
}

const INITIAL_STATE: AdminFormState = { ok: false };

export function SalesContactFormDialog({ contact }: SalesContactFormDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const formId = useId();
  const isEdit = Boolean(contact);

  const [open, setOpen] = useState(false);
  const action = contact ? updateSalesContactAction : createSalesContactAction;
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);
  const handledOk = useRef(false);

  useEffect(() => {
    if (open && state.ok && !handledOk.current) {
      handledOk.current = true;
      toast(isEdit ? 'Đã cập nhật liên hệ bán hàng.' : 'Đã thêm liên hệ bán hàng.', 'success');
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
          Thêm liên hệ
        </AdminActionButton>
      )}

      <AdminModal
        open={open}
        onClose={closeDialog}
        title={isEdit ? 'Cập nhật liên hệ bán hàng' : 'Thêm liên hệ bán hàng'}
        description="Quản lý nhân sự tư vấn, hotline và liên kết Zalo hiển thị trên website."
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
              {isPending ? 'Đang lưu…' : isEdit ? 'Lưu thay đổi' : 'Thêm liên hệ'}
            </button>
          </>
        }
      >
        <SalesContactForm formId={formId} formAction={formAction} state={state} contact={contact} />
      </AdminModal>
    </>
  );
}
