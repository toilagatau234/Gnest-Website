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

interface SalesContactFormDialogSessionProps extends SalesContactFormDialogProps {
  onClose: () => void;
}

const INITIAL_STATE: AdminFormState = { ok: false };

function SalesContactFormDialogSession({ contact, onClose }: SalesContactFormDialogSessionProps) {
  const router = useRouter();
  const { toast } = useToast();
  const formId = useId();
  const isEdit = Boolean(contact);
  const action = contact ? updateSalesContactAction : createSalesContactAction;
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);
  const handledOk = useRef(false);

  useEffect(() => {
    if (!state.ok || handledOk.current) {
      return;
    }

    handledOk.current = true;
    toast(isEdit ? 'Đã cập nhật liên hệ bán hàng.' : 'Đã thêm liên hệ bán hàng.', 'success');
    onClose();
    router.refresh();
  }, [state.ok, isEdit, onClose, router, toast]);

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
            {isPending ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm liên hệ'}
          </button>
        </>
      }
    >
      <SalesContactForm formId={formId} formAction={formAction} state={state} contact={contact} />
    </AdminModal>
  );
}

export function SalesContactFormDialog({ contact }: SalesContactFormDialogProps) {
  const isEdit = Boolean(contact);
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
          Thêm liên hệ
        </AdminActionButton>
      )}

      {open ? (
        <SalesContactFormDialogSession
          key={sessionKey}
          contact={contact}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
