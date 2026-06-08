'use client';

import { useActionState, useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Pencil, Plus } from 'lucide-react';

import { AdminActionButton } from '@/components/admin/AdminActionButton';
import { AdminModal } from '@/components/admin/AdminModal';
import { BannerForm } from '@/components/admin/BannerForm';
import { useToast } from '@/components/admin/AdminToast';
import type { AdminBanner } from '@/lib/services/admin/banners';
import {
  createBannerAction,
  updateBannerAction,
  type AdminFormState,
} from '@/app/admin/(dashboard)/banners/actions';

interface BannerFormDialogProps {
  banner?: AdminBanner;
}

interface BannerFormDialogSessionProps extends BannerFormDialogProps {
  onClose: () => void;
}

const INITIAL_STATE: AdminFormState = { ok: false };

function BannerFormDialogSession({ banner, onClose }: BannerFormDialogSessionProps) {
  const router = useRouter();
  const { toast } = useToast();
  const formId = useId();
  const isEdit = Boolean(banner);
  const action = banner ? updateBannerAction : createBannerAction;
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);
  const handledOk = useRef(false);

  useEffect(() => {
    if (!state.ok || handledOk.current) {
      return;
    }

    handledOk.current = true;
    toast(isEdit ? 'Đã cập nhật banner quảng cáo.' : 'Đã thêm banner quảng cáo.', 'success');
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
      title={isEdit ? 'Cập nhật banner quảng cáo' : 'Thêm banner quảng cáo'}
      description="Tạo banner bằng nội dung dễ hiểu, ảnh tùy chọn, lịch hiển thị và preview trực quan trước khi lưu."
      size="2xl"
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
            {isPending ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm banner'}
          </button>
        </>
      }
    >
      <BannerForm formId={formId} formAction={formAction} state={state} banner={banner} />
    </AdminModal>
  );
}

export function BannerFormDialog({ banner }: BannerFormDialogProps) {
  const isEdit = Boolean(banner);
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
          Thêm banner
        </AdminActionButton>
      )}

      {open ? (
        <BannerFormDialogSession
          key={sessionKey}
          banner={banner}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
