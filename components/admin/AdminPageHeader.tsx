import React from 'react';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function AdminPageHeader({ title, description, action }: AdminPageHeaderProps) {
  return (
<<<<<<< HEAD
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1B3A6B] sm:text-[28px]">{title}</h1>
        {description && <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-3">{action}</div>}
=======
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-[#1B3A6B]">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-500">{description}</p>
        )}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2.5">{action}</div>}
>>>>>>> 3b38c8f142158fddd39741ee7b80a71a7f60a0d6
    </div>
  );
}
