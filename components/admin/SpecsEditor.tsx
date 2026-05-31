'use client';

import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import type { Json } from '@/lib/types/database';

interface SpecRow {
  key: string;
  value: string;
}

interface SpecsEditorProps {
  /** Name of the hidden field submitted to the server action (JSON string). */
  name?: string;
  initialSpecs?: Json;
}

function toRows(specs?: Json): SpecRow[] {
  if (!specs || typeof specs !== 'object' || Array.isArray(specs)) {
    return [{ key: '', value: '' }];
  }

  const entries = Object.entries(specs).map(([key, value]) => ({
    key,
    value: value == null ? '' : String(value),
  }));

  return entries.length > 0 ? entries : [{ key: '', value: '' }];
}

const fieldClass =
  'admin-focus h-10 w-full rounded-lg border border-[#E2E8F0] px-3 text-sm text-slate-700 transition-colors focus:border-[#1B3A6B]';

/**
 * Friendly key/value editor for product specs. Serializes to a JSON object in
 * a hidden input so the existing `specs` server-action contract is unchanged.
 */
export function SpecsEditor({ name = 'specs', initialSpecs }: SpecsEditorProps) {
  const [rows, setRows] = useState<SpecRow[]>(() => toRows(initialSpecs));

  const serialized = useMemo(() => {
    const object: Record<string, string> = {};
    for (const row of rows) {
      const key = row.key.trim();
      if (key) {
        object[key] = row.value.trim();
      }
    }
    return JSON.stringify(object);
  }, [rows]);

  const updateRow = (index: number, patch: Partial<SpecRow>) => {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const addRow = () => setRows((current) => [...current, { key: '', value: '' }]);

  const removeRow = (index: number) => {
    setRows((current) => {
      const next = current.filter((_, i) => i !== index);
      return next.length > 0 ? next : [{ key: '', value: '' }];
    });
  };

  return (
    <div className="space-y-2.5">
      <input type="hidden" name={name} value={serialized} />

      <div className="hidden grid-cols-[1fr_1fr_auto] gap-2.5 px-1 text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:grid">
        <span>Thuộc tính</span>
        <span>Giá trị</span>
        <span className="sr-only">Xóa</span>
      </div>

      {rows.map((row, index) => (
        <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2.5">
          <input
            value={row.key}
            onChange={(event) => updateRow(index, { key: event.target.value })}
            placeholder="VD: Dung tích"
            className={fieldClass}
          />
          <input
            value={row.value}
            onChange={(event) => updateRow(index, { value: event.target.value })}
            placeholder="VD: 500ml"
            className={fieldClass}
          />
          <button
            type="button"
            onClick={() => removeRow(index)}
            aria-label="Xóa thông số"
            className="admin-focus flex h-10 w-10 items-center justify-center rounded-lg border border-[#E2E8F0] text-slate-400 transition-colors hover:border-[#E31E24] hover:text-[#E31E24]"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="admin-focus inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-[#1B3A6B] transition-colors hover:bg-[#1B3A6B]/5"
      >
        <Plus className="h-4 w-4" />
        Thêm thông số
      </button>

      <p className="text-xs leading-relaxed text-slate-400">
        Mỗi dòng là một thông số kỹ thuật (ví dụ: Dung tích → 500ml, Chất liệu → Thủy tinh). Dữ liệu
        được lưu dưới dạng JSON, dòng trống sẽ tự bỏ qua.
      </p>
    </div>
  );
}
