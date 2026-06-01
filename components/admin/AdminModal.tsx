'use client';

import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface AdminModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: ModalSize;
  children: React.ReactNode;
  /** Sticky footer area, typically the cancel/save actions. */
  footer?: React.ReactNode;
  /**
   * When false the modal cannot be dismissed via Escape or overlay click
   * (e.g. while a submission is pending). The close button is also hidden.
   */
  dismissible?: boolean;
}

const sizeStyles: Record<ModalSize, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
  '2xl': 'sm:max-w-[1100px]',
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Dependency-free modal dialog used to host admin create/edit forms.
 *
 * The dialog is rendered into `document.body` through a portal so the
 * `fixed` overlay always covers the full viewport. This is essential because
 * the admin page content is wrapped in `.admin-page-enter`, whose animation
 * keeps a `transform` on the element — a transformed ancestor becomes the
 * containing block for `position: fixed` descendants, which previously clipped
 * the modal inside the page column instead of letting it cover topbar/sidebar.
 *
 * Locks body scroll while open, closes on Escape or overlay click, keeps a
 * sticky header/footer so long forms never get cut off, and traps focus.
 */
export function AdminModal({
  open,
  onClose,
  title,
  description,
  size = 'lg',
  children,
  footer,
  dismissible = true,
}: AdminModalProps) {
  const headingId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible) {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'Tab') {
        const panel = panelRef.current;
        if (!panel) return;

        const focusable = Array.from(
          panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        ).filter((el) => el.offsetParent !== null || el === document.activeElement);

        if (focusable.length === 0) {
          event.preventDefault();
          panel.focus();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;

        if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKey);
    // Lock body scroll without layout shift (compensate for scrollbar width).
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Move focus into the dialog once it renders.
    const focusTimer = window.setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const firstField = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (firstField ?? panel).focus();
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      // Restore focus to the trigger so keyboard users keep their place.
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [open, onClose, dismissible]);

  // `open` is only ever true after a client-side interaction, so `document`
  // is guaranteed to exist here; the guard keeps this SSR-safe regardless.
  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className="admin-modal-overlay fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto overscroll-contain bg-slate-950/40 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (dismissible && event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
        className={`admin-modal-panel admin-focus flex max-h-[min(92svh,900px)] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-admin-pop ring-1 ring-[#E5E7EF] sm:rounded-3xl ${sizeStyles[size]}`}
      >
        <div className="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-4 border-b border-[#EEF2F6] bg-white px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 id={headingId} className="text-base font-extrabold text-[#202224]">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm font-medium text-[#646464]">
                {description}
              </p>
            )}
          </div>
          {dismissible && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="admin-focus -mr-1 rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-[#F5F6FA] hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="admin-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>

        {footer && (
          <div className="sticky bottom-0 z-10 flex shrink-0 flex-col-reverse gap-3 border-t border-[#EEF2F6] bg-[#F7F9FB] px-5 py-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
