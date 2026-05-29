'use client';

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
  return (
    <div
      className={`
        bg-white border border-[#D7E0EC] rounded-2xl shadow-sm
        overflow-hidden transition-all duration-300 hover:shadow-md
        ${className}
      `}
    >
      {(title || subtitle || headerAction) && (
        <div className="border-b border-[#EBEFF5] px-6 py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50">
          <div>
            {title && <h3 className="text-base font-extrabold text-[#1B3A6B] uppercase tracking-wider">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-1 leading-normal">{subtitle}</p>}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>{children}</div>
    </div>
  );
}
