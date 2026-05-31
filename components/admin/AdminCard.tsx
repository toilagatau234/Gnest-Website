import React from 'react';

interface AdminCardProps {
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

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
      className={`overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-admin ${className}`}
    >
      {hasHeader && (
        <div className="flex flex-col gap-3 border-b border-[#EEF2F6] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title && <h3 className="text-[15px] font-semibold text-[#1B3A6B]">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </div>
  );
}
