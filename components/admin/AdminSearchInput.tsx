'use client';

import { Search, X } from 'lucide-react';

interface AdminSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function AdminSearchInput({
  value,
  onChange,
  placeholder = 'Tìm kiếm…',
  className = '',
}: AdminSearchInputProps) {
  return (
    <div className={`relative w-full sm:w-72 ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="admin-focus h-10 w-full rounded-lg border border-[#E2E8F0] bg-white pl-9 pr-9 text-sm text-slate-700 placeholder:text-slate-400 transition-colors hover:border-[#CBD5E1]"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Xóa tìm kiếm"
          className="admin-focus absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
