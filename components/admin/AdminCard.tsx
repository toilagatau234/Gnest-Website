import React from 'react';

interface AdminCardProps {
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

/**
 * Calm white surface for grouping admin content. Light border, very soft
 * shadow, no hover animation — the card should recede so its contents lead.
 */
export function AdminCard({
  title,
  subtitle,
  headerAction,
  children,
  className = '',
  noPadding = false,
}: AdminCardProps) {
  const hasHeader = title || subtitle || headerAction;

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-admin ${className}`}
    >
      {hasHeader && (
        <div className="flex flex-col gap-3 border-b border-[#EEF2F6] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {title && <h3 className="text-[15px] font-semibold text-[#1B3A6B]">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs leading-normal text-slate-500">{subtitle}</p>}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </div>
  );
}
