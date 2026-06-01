'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyles: Record<ToastTone, { ring: string; icon: React.ReactNode; bar: string }> = {
  success: {
    ring: 'ring-emerald-200',
    bar: 'bg-emerald-500',
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
  },
  error: {
    ring: 'ring-rose-200',
    bar: 'bg-[#E31E24]',
    icon: <AlertCircle className="h-5 w-5 text-[#E31E24]" />,
  },
  info: {
    ring: 'ring-slate-200',
    bar: 'bg-[#1B3A6B]',
    icon: <Info className="h-5 w-5 text-[#1B3A6B]" />,
  },
};

/**
 * Lightweight, dependency-free toast system for admin CRUD feedback.
 * Toasts auto-dismiss after a few seconds and stack at the bottom-right.
 */
export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      const id = counter.current + 1;
      counter.current = id;
      setToasts((current) => [...current, { id, tone, message }]);
      window.setTimeout(() => remove(id), tone === 'error' ? 6000 : 3500);
    },
    [remove],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6">
        {toasts.map((item) => {
          const style = toneStyles[item.tone];
          return (
            <div
              key={item.id}
              role="status"
              className={`admin-modal-panel pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-xl bg-white py-3 pl-4 pr-3 shadow-admin-pop ring-1 ${style.ring}`}
            >
              <span className={`absolute left-0 top-0 h-full w-1 ${style.bar}`} aria-hidden />
              <span className="mt-0.5 shrink-0">{style.icon}</span>
              <p className="flex-1 text-xs font-semibold leading-relaxed text-slate-700">{item.message}</p>
              <button
                type="button"
                onClick={() => remove(item.id)}
                aria-label="Đóng thông báo"
                className="admin-focus -mr-1 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    // Fail soft: never crash a CRUD flow because a provider is missing.
    return { toast: () => {} };
  }
  return context;
}
