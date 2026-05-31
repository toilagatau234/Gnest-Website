import React from 'react';
import Link from 'next/link';

type StatTone = 'default' | 'accent';

interface AdminStatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  hint?: string;
  /** `accent` draws a restrained red emphasis — reserve it for items needing attention. */
  tone?: StatTone;
  /** Optional destination; the whole card becomes a link. */
  href?: string;
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
