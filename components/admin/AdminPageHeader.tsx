import React from 'react';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
}

export function AdminPageHeader({ title, description, action, badge }: AdminPageHeaderProps) {
  return (
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <h1 className="min-w-0 text-[22px] font-bold tracking-tight text-[#1B3A6B]">{title}</h1>
          {badge}
        </div>
        {description && (
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-slate-500">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>
      )}
    </div>
  );
}
