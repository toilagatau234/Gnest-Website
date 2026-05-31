import React from 'react';

interface AdminCardProps {
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  lift?: boolean;
}

export function AdminCard({
  title,
  subtitle,
  headerAction,
  children,
  className = '',
  noPadding = false,
  lift = false,
}: AdminCardProps) {
  const hasHeader = title || subtitle || headerAction;

  return (
    <div
      className={`overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-admin ${lift ? 'admin-card-lift' : ''} ${className}`}
    >
      {hasHeader && (
        <div className="flex flex-col gap-2 border-b border-[#EEF2F6] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {title && (
              <h3 className="text-[14px] font-semibold tracking-tight text-[#1B3A6B]">{title}</h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-[12px] leading-normal text-slate-400">{subtitle}</p>
            )}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </div>
  );
}
