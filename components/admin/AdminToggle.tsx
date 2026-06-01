'use client';

interface AdminToggleProps {
  name: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
}

/**
 * Accessible switch-style checkbox for admin forms. Submits the standard
 * checkbox value (`on`) so existing server actions keep working unchanged.
 */
export function AdminToggle({ name, label, description, defaultChecked = false }: AdminToggleProps) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-lg px-1 py-1.5">
      <span className="min-w-0">
        <span className="block text-xs font-bold text-slate-700">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-[11px] font-medium leading-snug text-slate-400">{description}</span>
        ) : null}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
        <span className="h-5 w-9 rounded-full bg-slate-300 transition-colors peer-checked:bg-[#1B3A6B] peer-focus-visible:ring-2 peer-focus-visible:ring-[#1B3A6B]/30 peer-focus-visible:ring-offset-1" />
        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
      </span>
    </label>
  );
}
