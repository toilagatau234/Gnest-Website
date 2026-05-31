import React from 'react';

interface AdminTableShellProps {
  /** Header cells, rendered inside <thead><tr>. */
  head: React.ReactNode;
  /** Body rows, rendered inside <tbody>. */
  children: React.ReactNode;
  /** Minimum table width to keep columns readable; overflow scrolls horizontally. */
  minWidth?: number;
  className?: string;
}

/**
 * Rounded, soft-shadowed container for admin data tables.
 * Handles the bordered card, horizontal overflow, header styling and row dividers.
 */
export function AdminTableShell({ head, children, minWidth = 820, className = '' }: AdminTableShellProps) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-admin ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full" style={{ minWidth }}>
          <thead className="border-b border-[#E2E8F0] bg-[#F1F5F9]/70">
            <tr>{head}</tr>
          </thead>
          <tbody className="divide-y divide-[#EEF2F6]">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

interface AdminThProps {
  children?: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

/** Standard table header cell: label-md uppercase styling. */
export function AdminTh({ children, align = 'left', className = '' }: AdminThProps) {
  return (
    <th
      className={`px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-500 ${
        align === 'right' ? 'text-right' : 'text-left'
      } ${className}`}
    >
      {children}
    </th>
  );
}
