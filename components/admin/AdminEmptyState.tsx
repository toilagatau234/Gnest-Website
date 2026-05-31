import React from 'react';

interface AdminEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function AdminEmptyState({ icon, title, description, action }: AdminEmptyStateProps) {
  return (
<<<<<<< HEAD
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#CBD5E1] bg-white px-6 py-12 text-center">
      <div className="mb-4 rounded-full border border-[#E2E8F0] bg-slate-50 p-3 text-[#1B3A6B]">
        {icon}
      </div>
      <h3 className="mb-2 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mb-6 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
      {action && action}
=======
    <div className="flex flex-col items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white px-6 py-14 text-center shadow-admin">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
>>>>>>> 3b38c8f142158fddd39741ee7b80a71a7f60a0d6
    </div>
  );
}
