import React from 'react';
import Link from 'next/link';

type StatTone = 'default' | 'accent';

interface AdminStatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  hint?: string;
  tone?: StatTone;
  href?: string;
}

const iconToneStyles: Record<StatTone, string> = {
  default: 'bg-[#1B3A6B]/[0.06] text-[#1B3A6B]',
  accent: 'bg-[#E31E24]/[0.07] text-[#E31E24]',
};

export function AdminStatCard({
  label,
  value,
  icon,
  hint,
  tone = 'default',
  href,
}: AdminStatCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
          {label}
        </span>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconToneStyles[tone]}`}
        >
          {icon}
        </span>
      </div>
      <p
        className={`mt-3 text-[28px] font-bold leading-none tracking-tight ${
          tone === 'accent' ? 'text-[#E31E24]' : 'text-[#1B3A6B]'
        }`}
      >
        {value}
      </p>
      {hint && (
        <p className="mt-1.5 text-[12px] leading-snug text-slate-400">{hint}</p>
      )}
    </>
  );

  const baseClass =
    'block rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-admin admin-stat-lift';

  if (href) {
    return (
      <Link href={href} className={`admin-focus ${baseClass}`}>
        {content}
      </Link>
    );
  }

  return <div className={baseClass}>{content}</div>;
}
