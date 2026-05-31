import React from 'react';

interface AdminStatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
  tone?: 'default' | 'attention';
}

export function AdminStatCard({
  title,
  value,
  icon,
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
  );
}
