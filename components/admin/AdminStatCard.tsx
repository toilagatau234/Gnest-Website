import React from 'react';
<<<<<<< HEAD
=======
import Link from 'next/link';

type StatTone = 'default' | 'accent';
>>>>>>> 3b38c8f142158fddd39741ee7b80a71a7f60a0d6

interface AdminStatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
<<<<<<< HEAD
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
  tone?: 'default' | 'attention';
=======
  hint?: string;
  /** `accent` draws a restrained red emphasis — reserve it for items needing attention. */
  tone?: StatTone;
  /** Optional destination; the whole card becomes a link. */
  href?: string;
>>>>>>> 3b38c8f142158fddd39741ee7b80a71a7f60a0d6
}

const iconToneStyles: Record<StatTone, string> = {
  default: 'bg-slate-50 text-[#1B3A6B]',
  accent: 'bg-red-50 text-[#E31E24]',
};

/**
 * Clean KPI tile: label, large value, small icon. No decorative gradients or
 * tilt — the number is the focus.
 */
export function AdminStatCard({
  label,
  value,
  icon,
<<<<<<< HEAD
  description,
  trend,
  tone = 'default',
  className = '',
}: AdminStatCardProps) {
  return (
    <div
      className={`flex h-full flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-admin ${className}`}
    >
      <div>
        <div className="mb-4 flex items-start justify-between gap-3">
          <span className="text-sm font-medium leading-5 text-slate-500">{title}</span>
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
              tone === 'attention'
                ? 'border-red-100 bg-red-50 text-[#E31E24]'
                : 'border-slate-100 bg-slate-50 text-[#1B3A6B]'
            }`}
          >
            {icon}
          </div>
        </div>

        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-3xl font-semibold tracking-tight text-slate-950">{value}</span>
          {trend && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                trend.isPositive
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                  : 'bg-red-50 text-[#B42318] ring-red-100'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
      </div>

      {description && <p className="mt-4 text-sm leading-6 text-slate-500">{description}</p>}
    </div>
=======
  hint,
  tone = 'default',
  href,
}: AdminStatCardProps) {
  const interactive = href ? 'transition-colors hover:border-[#CBD5E1]' : '';

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconToneStyles[tone]}`}
        >
          {icon}
        </span>
      </div>
      <p
        className={`mt-3 text-3xl font-bold tracking-tight ${
          tone === 'accent' ? 'text-[#E31E24]' : 'text-[#1B3A6B]'
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs leading-normal text-slate-400">{hint}</p>}
    </>
>>>>>>> 3b38c8f142158fddd39741ee7b80a71a7f60a0d6
  );

  const className = `block rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-admin ${interactive}`;

  if (href) {
    return (
      <Link href={href} className={`admin-focus ${className}`}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
