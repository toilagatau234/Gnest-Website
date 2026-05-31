import React from 'react';

export type AdminStatusTone = 'success' | 'alert' | 'neutral' | 'info' | 'warning';

interface AdminStatusChipProps {
  tone?: AdminStatusTone;
  children: React.ReactNode;
  /** Show a small leading status dot. */
  dot?: boolean;
  className?: string;
}

const toneStyles: Record<AdminStatusTone, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  alert: 'bg-red-50 text-[#B42318] ring-red-100',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
  info: 'bg-[#1B3A6B]/5 text-[#1B3A6B] ring-[#1B3A6B]/10',
  warning: 'bg-amber-50 text-amber-700 ring-amber-100',
};

const dotStyles: Record<AdminStatusTone, string> = {
  success: 'bg-emerald-500',
  alert: 'bg-[#E31E24]',
  neutral: 'bg-slate-400',
  info: 'bg-[#1B3A6B]',
  warning: 'bg-amber-500',
};

export function AdminStatusChip({
  tone = 'neutral',
  children,
  dot = false,
  className = '',
}: AdminStatusChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${toneStyles[tone]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[tone]}`} />}
      {children}
    </span>
  );
}
