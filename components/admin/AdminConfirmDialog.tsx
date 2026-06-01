'use client';

import { useState, useTransition } from 'react';
import { AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';

import { AdminModal } from '@/components/admin/AdminModal';

interface AdminConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Supporting copy explaining the consequence of the action. */
  description?: string;
  /** Highlighted name of the item being acted on. */
  itemName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Visual intent of the confirm button. */
  tone?: 'danger' | 'primary';
  /** Runs the mutation. Return `{ ok, error }` — never throw for expected failures. */
  onConfirm: () => Promise<{ ok: boolean; error?: string }>;
  /** Called after a successful confirmation (e.g. to show a toast). */
  onSuccess?: () => void;
}

/**
 * Safe confirmation dialog for destructive or irreversible admin actions.
 * Shows the affected item, a loading state while running, and surfaces a
 * human-readable error (e.g. FK constraint) without closing on failure.
 */
export function AdminConfirmDialog({
  open,
  onClose,
  title,
  description,
  itemName,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  tone = 'danger',
  onConfirm,
  onSuccess,
}: AdminConfirmDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (isPending) return;
    setError(null);
    onClose();
  };

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await onConfirm();
      if (result.ok) {
        onSuccess?.();
        onClose();
      } else {
        setError(result.error ?? 'Đã xảy ra lỗi, vui lòng thử lại.');
      }
    });
  };

  const confirmClass =
    tone === 'danger'
      ? 'bg-[#E31E24] hover:bg-[#C01519]'
      : 'bg-[#1B3A6B] hover:bg-[#16315b]';

  return (
    <AdminModal
      open={open}
      onClose={close}
      title={title}
      size="sm"
      dismissible={!isPending}
      footer={
        <>
          <button
            type="button"
            onClick={close}
            disabled={isPending}
            className="admin-focus inline-flex h-10 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white px-5 text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className={`admin-focus inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-xs font-extrabold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${confirmClass}`}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isPending ? 'Đang xử lý…' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              tone === 'danger' ? 'bg-rose-50 text-[#E31E24]' : 'bg-[#1B3A6B]/5 text-[#1B3A6B]'
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0 space-y-1">
            {description ? (
              <p className="text-sm leading-relaxed text-slate-600">{description}</p>
            ) : null}
            {itemName ? (
              <p className="break-words rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-[#EEF2F6]">
                {itemName}
              </p>
            ) : null}
          </div>
        </div>

        {error ? (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-[#FFF5F5] px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#E31E24]" />
            <p className="text-xs font-medium text-[#B42318]">{error}</p>
          </div>
        ) : null}
      </div>
    </AdminModal>
  );
}
