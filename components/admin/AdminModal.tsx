'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

type ModalSize = 'md' | 'lg' | 'xl';

interface AdminModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: ModalSize;
  children: React.ReactNode;
  /** Sticky footer area, typically the cancel/save actions. */
  footer?: React.ReactNode;
}

const sizeStyles: Record<ModalSize, string> = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/**
 * Dependency-free modal dialog used to host admin create/edit forms.
 * Locks body scroll while open and closes on Escape or overlay click.
 */
export function AdminModal({
  open,
  onClose,
  title,
  description,
  size = 'lg',
  children,
  footer,
}: AdminModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm sm:p-6"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
        className={`my-auto flex max-h-[calc(100vh-3rem)] w-full ${sizeStyles[size]} flex-col overflow-hidden rounded-2xl bg-white shadow-admin-pop ring-1 ring-[#E2E8F0]`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#EEF2F6] px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[#1B3A6B]">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="admin-focus -mr-1 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-[#EEF2F6] bg-slate-50/60 px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
