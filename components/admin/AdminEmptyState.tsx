import React from 'react';

interface AdminEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function AdminEmptyState({ icon, title, description, action }: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-[#E2E8F0] rounded-2xl bg-slate-50/50">
      <div className="p-4 bg-white rounded-full shadow-admin text-slate-400 border border-[#E2E8F0] mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-6">{description}</p>
      {action && action}
    </div>
  );
}
