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
  default: 'bg-[#4880FF]/10 text-[#4880FF]',
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
        <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#646464]">
          {label}
        </span>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconToneStyles[tone]}`}
        >
          {icon}
        </span>
      </div>
      <p
        className={`mt-3 text-[28px] font-bold leading-none tracking-tight ${
          tone === 'accent' ? 'text-[#E31E24]' : 'text-[#202224]'
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
    'block rounded-2xl border border-[#E5E7EF] bg-white p-5 shadow-admin admin-stat-lift';

  if (href) {
    return (
      <Link href={href} className={`admin-focus ${baseClass}`}>
        {content}
      </Link>
    );
  }

  return <div className={baseClass}>{content}</div>;
}
