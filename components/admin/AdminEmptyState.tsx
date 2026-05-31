import React from 'react';

interface AdminEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function AdminEmptyState({ icon, title, description, action }: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#CBD5E1] bg-white px-6 py-12 text-center">
      <div className="mb-4 rounded-full border border-[#E2E8F0] bg-slate-50 p-3 text-[#1B3A6B]">
        {icon}
      </div>
      <h3 className="mb-2 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mb-6 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
      {action && action}
    </div>
  );
}
