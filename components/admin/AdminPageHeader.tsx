import React from 'react';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
}

export function AdminPageHeader({ title, description, action, badge }: AdminPageHeaderProps) {
  return (
    <div className="admin-stagger-item flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <h1 className="min-w-0 text-[24px] font-extrabold tracking-tight text-[#202224]">{title}</h1>
          {badge}
        </div>
        {description && (
          <p className="mt-1.5 max-w-3xl text-[13px] font-medium leading-relaxed text-[#646464]">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pt-1">{action}</div>
      )}
    </div>
  );
}
