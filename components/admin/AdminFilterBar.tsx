import React from 'react';

interface AdminFilterBarProps {
  /** Primary control on the left (usually the search input). */
  children: React.ReactNode;
  /** Secondary controls aligned to the right (filters, actions). */
  trailing?: React.ReactNode;
  className?: string;
}

/**
 * Toolbar row for table pages: search on the left, filters/actions on the
 * right. Wraps gracefully on small screens.
 */
export function AdminFilterBar({ children, trailing, className = '' }: AdminFilterBarProps) {
  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2.5">{children}</div>
      {trailing && <div className="flex flex-wrap items-center gap-2.5">{trailing}</div>}
    </div>
  );
}

interface AdminSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

/** Compact filter <select> matching the admin input style. */
export function AdminSelect({ label, className = '', ...props }: AdminSelectProps) {
  return (
    <select
      aria-label={label}
      className={`admin-focus h-10 rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-slate-700 transition-colors hover:border-[#CBD5E1] ${className}`}
      {...props}
    />
  );
}
