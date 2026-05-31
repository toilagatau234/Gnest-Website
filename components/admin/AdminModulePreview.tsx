import React from 'react';

import { AdminStatusChip } from '@/components/admin/AdminStatusChip';

interface PreviewFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface AdminModulePreviewProps {
  intro: string;
  features: PreviewFeature[];
  note?: string;
}

/**
 * Shared layout for modules that are planned but not yet built. Communicates
 * scope with a clear feature list instead of a blank "coming soon" box.
 */
export function AdminModulePreview({ intro, features, note }: AdminModulePreviewProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-admin">
      <div className="flex flex-col gap-3 border-b border-[#EEF2F6] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600">{intro}</p>
        <AdminStatusChip tone="info" dot className="shrink-0">
          Đang phát triển
        </AdminStatusChip>
      </div>

      <div className="grid gap-px bg-[#EEF2F6] sm:grid-cols-2">
        {features.map((feature) => (
          <div key={feature.title} className="flex items-start gap-3.5 bg-white p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-[#1B3A6B]">
              {feature.icon}
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      {note ? (
        <p className="border-t border-[#EEF2F6] bg-slate-50/60 px-6 py-3.5 text-xs leading-relaxed text-slate-500">
          {note}
        </p>
      ) : null}
    </div>
  );
}
