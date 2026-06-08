'use client';

import { useActionState, useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Pencil, Plus } from 'lucide-react';

import { AdminActionButton } from '@/components/admin/AdminActionButton';
import { AdminModal } from '@/components/admin/AdminModal';
import { JobForm } from '@/components/admin/JobForm';
import { useToast } from '@/components/admin/AdminToast';
import type { AdminJobVacancy } from '@/lib/services/admin/jobs';
import {
  createJobAction,
  updateJobAction,
  type AdminFormState,
} from '@/app/admin/(dashboard)/jobs/actions';

interface JobFormDialogProps {
  job?: AdminJobVacancy;
}

interface JobFormDialogSessionProps extends JobFormDialogProps {
  onClose: () => void;
}

const INITIAL_STATE: AdminFormState = { ok: false };

function JobFormDialogSession({ job, onClose }: JobFormDialogSessionProps) {
  const router = useRouter();
  const { toast } = useToast();
  const formId = useId();
  const isEdit = Boolean(job);
  const action = job ? updateJobAction : createJobAction;
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);
  const handledOk = useRef(false);

  useEffect(() => {
    if (!state.ok || handledOk.current) {
      return;
    }

    handledOk.current = true;
    toast(isEdit ? 'Đã cập nhật tin tuyển dụng.' : 'Đã đăng tin tuyển dụng mới thành công.', 'success');
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
      title={isEdit ? 'Cập nhật tin tuyển dụng' : 'Đăng tin tuyển dụng mới'}
      description="Quản lý thông tin chi tiết, địa điểm làm việc và thời hạn của tin tuyển dụng trên website."
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
            {isPending ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Đăng tuyển'}
          </button>
        </>
      }
    >
      <JobForm formId={formId} formAction={formAction} state={state} job={job} />
    </AdminModal>
  );
}

export function JobFormDialog({ job }: JobFormDialogProps) {
  const isEdit = Boolean(job);
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
          Đăng tin mới
        </AdminActionButton>
      )}

      {open ? (
        <JobFormDialogSession
          key={sessionKey}
          job={job}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
