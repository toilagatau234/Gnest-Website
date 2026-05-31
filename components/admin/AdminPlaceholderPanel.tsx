import React from 'react';

interface AdminPlaceholderPanelProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  items?: string[];
}

export function AdminPlaceholderPanel({ icon, title, description, items = [] }: AdminPlaceholderPanelProps) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-admin">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#1B3A6B]/5 text-[#1B3A6B]">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-base font-semibold text-slate-900">{title}</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
          {items.length > 0 ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {items.map((item) => (
                <div key={item} className="rounded-lg border border-[#E2E8F0] bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  {item}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
