'use client';

import { useEffect, useMemo, useState } from 'react';
import { generateProductName } from '@/lib/utils/product-name-generator';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';

import {
  isKnownTemplate,
  SPEC_TEMPLATES,
  TEMPLATE_KEYS,
  type SpecField,
  type SpecTemplate,
  type TemplateKey,
  type TemplateRegistry,
} from '@/lib/product-spec-templates';
import type { Json } from '@/lib/types/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SpecRow {
  key: string;
  value: string;
}

interface SpecsEditorProps {
  /** Hidden field name submitted to the server action. */
  name?: string;
  initialSpecs?: Json;
  /** DB-loaded template registry. Falls back to code templates if absent. */
  specTemplates?: TemplateRegistry;
  /** Called with the active template's nameTemplate string (or null) when template/values change. */
  onNameSuggestion?: (suggestion: string | null) => void;
}

// ---------------------------------------------------------------------------
// Registry resolution helpers (module-level, no hooks)
// ---------------------------------------------------------------------------

function resolveRegistry(sr?: TemplateRegistry): TemplateRegistry {
  if (sr && sr.keys.length > 0) return sr;
  return {
    templates: SPEC_TEMPLATES as Record<string, SpecTemplate>,
    keys: [...TEMPLATE_KEYS],
  };
}

function isValidTemplateKey(value: unknown, validKeys: string[]): boolean {
  return typeof value === 'string' && validKeys.includes(value);
}

// ---------------------------------------------------------------------------
// Initializers
// ---------------------------------------------------------------------------

function specsToObject(specs?: Json): Record<string, unknown> {
  if (specs && typeof specs === 'object' && !Array.isArray(specs)) {
    return specs as Record<string, unknown>;
  }
  return {};
}

function initTemplateKey(specs: Json | undefined, validKeys: string[]): string {
  const obj = specsToObject(specs);
  return isValidTemplateKey(obj._template, validKeys) ? (obj._template as string) : 'other';
}

function initTemplateValues(
  templateKey: string,
  specs: Json | undefined,
  templates: Record<string, SpecTemplate>,
): Record<string, string> {
  if (templateKey === 'other') return {};
  const obj = specsToObject(specs);
  const values: Record<string, string> = {};
  const fields = templates[templateKey]?.fields ?? [];
  for (const field of fields) {
    const raw = obj[field.key];
    if (raw != null && raw !== '') values[field.key] = String(raw);
  }
  return values;
}

function initCustomRows(templateKey: string, specs?: Json): SpecRow[] {
  if (templateKey !== 'other') return [{ key: '', value: '' }];
  const obj = specsToObject(specs);
  const rows = Object.entries(obj)
    .filter(([k]) => k !== '_template')
    .map(([k, v]) => ({ key: k, value: v == null ? '' : String(v) }));
  return rows.length > 0 ? rows : [{ key: '', value: '' }];
}

// ---------------------------------------------------------------------------
// Field input sub-component
// ---------------------------------------------------------------------------

const inputClass =
  'admin-focus h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-xs text-slate-700 transition-colors focus:border-[#1B3A6B] focus:outline-none';
const selectFieldClass =
  'admin-focus h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-xs text-slate-700 transition-colors focus:border-[#1B3A6B] focus:outline-none';
const textareaFieldClass =
  'admin-focus w-full resize-y rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-slate-700 transition-colors focus:border-[#1B3A6B] focus:outline-none min-h-[72px]';

function TemplateFieldInput({
  field,
  value,
  onChange,
}: {
  field: SpecField;
  value: string;
  onChange: (v: string) => void;
}) {
  const placeholder = `Nhập ${field.label.toLowerCase()}${field.unit ? ` (${field.unit})` : ''}…`;

  const isRequired = field.required ?? false;

  switch (field.type) {
    case 'textarea':
      return (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={isRequired}
          className={textareaFieldClass}
          rows={3}
        />
      );
    case 'select':
      return (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={isRequired}
          className={selectFieldClass}
        >
          <option value="">— Chọn {field.label.toLowerCase()} —</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    case 'number':
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min="0"
          step="any"
          required={isRequired}
          placeholder={placeholder}
          className={inputClass}
        />
      );
    case 'boolean':
      // Boolean fields are checkboxes — required means it must be checked.
      return (
        <label className="flex h-10 cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={value === 'true'}
            onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
            required={isRequired && value !== 'true'}
            className="rounded border-slate-300 text-[#1B3A6B] focus:ring-[#1B3A6B]/30"
          />
          <span className="text-xs text-slate-600">{field.label}</span>
        </label>
      );
    default:
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={isRequired}
          placeholder={placeholder}
          className={inputClass}
        />
      );
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const customRowInputClass =
  'admin-focus h-10 w-full rounded-lg border border-[#E2E8F0] px-3 text-sm text-slate-700 transition-colors focus:border-[#1B3A6B] focus:outline-none';

export function SpecsEditor({ name = 'specs', initialSpecs, specTemplates, onNameSuggestion }: SpecsEditorProps) {
  // Resolve registry once — DB-loaded takes precedence, code fallback if absent/empty.
  // Stable across re-renders because specTemplates comes from a parent server load.
  const registry = useMemo(() => resolveRegistry(specTemplates), [specTemplates]);

  // Derive initial state from the resolved registry so DB keys are recognised.
  const initKey = useMemo(
    () => initTemplateKey(initialSpecs, registry.keys),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],  // intentionally stable: only used for useState initialisation below
  );

  const [templateKey, setTemplateKey] = useState<string>(initKey);
  const [templateValues, setTemplateValues] = useState<Record<string, string>>(() =>
    initTemplateValues(initKey, initialSpecs, registry.templates),
  );
  const [customRows, setCustomRows] = useState<SpecRow[]>(() =>
    initCustomRows(initKey, initialSpecs),
  );

  // ── Serialization ─────────────────────────────────────────────────────────

  const serialized = useMemo(() => {
    if (templateKey === 'other') {
      const obj: Record<string, string> = {};
      for (const row of customRows) {
        const k = row.key.trim();
        if (k) obj[k] = row.value.trim();
      }
      return JSON.stringify(obj);
    }

    const obj: Record<string, string> = { _template: templateKey };
    const fields = registry.templates[templateKey]?.fields ?? [];
    for (const field of fields) {
      const v = (templateValues[field.key] ?? '').trim();
      if (v) obj[field.key] = v;
    }
    return JSON.stringify(obj);
  }, [templateKey, templateValues, customRows, registry.templates]);

  // ── Name suggestion ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!onNameSuggestion) return;
    if (templateKey === 'other') {
      onNameSuggestion(null);
      return;
    }
    const nameTemplate = registry.templates[templateKey]?.nameTemplate;
    const suggestion = generateProductName(nameTemplate, templateValues);
    onNameSuggestion(suggestion);
  }, [templateKey, templateValues, registry.templates, onNameSuggestion]);

  // ── Template switching ────────────────────────────────────────────────────

  function handleTemplateChange(newKey: string) {
    if (newKey === templateKey) return;

    if (newKey === 'other' && templateKey !== 'other') {
      // Carry over filled template fields into custom rows
      const fields = registry.templates[templateKey]?.fields ?? [];
      const rows = fields
        .filter((f) => (templateValues[f.key] ?? '').trim())
        .map((f) => ({ key: f.key, value: templateValues[f.key] }));
      setCustomRows(rows.length > 0 ? rows : [{ key: '', value: '' }]);
    } else if (newKey !== 'other') {
      // Preserve values for keys that exist in the new template
      setTemplateValues((prev) => {
        const next: Record<string, string> = {};
        const newFields = registry.templates[newKey]?.fields ?? [];
        for (const field of newFields) {
          next[field.key] = prev[field.key] ?? '';
        }
        return next;
      });
    }

    setTemplateKey(newKey);
  }

  function setField(key: string, value: string) {
    setTemplateValues((prev) => ({ ...prev, [key]: value }));
  }

  // ── Custom rows management ────────────────────────────────────────────────

  function updateRow(index: number, patch: Partial<SpecRow>) {
    setCustomRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setCustomRows((prev) => [...prev, { key: '', value: '' }]);
  }

  function removeRow(index: number) {
    setCustomRows((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [{ key: '', value: '' }];
    });
  }

  // ── Required-field advisory errors ───────────────────────────────────────

  const requiredErrors = useMemo<Record<string, string>>(() => {
    if (templateKey === 'other') return {};
    const errs: Record<string, string> = {};
    const fields = registry.templates[templateKey]?.fields ?? [];
    for (const field of fields) {
      if (field.required && !(templateValues[field.key] ?? '').trim()) {
        errs[field.key] = `${field.label} là bắt buộc.`;
      }
    }
    return errs;
  }, [templateKey, templateValues, registry.templates]);

  const currentTemplate = registry.templates[templateKey];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      <input type="hidden" name={name} value={serialized} />

      {/* Template / product-type selector */}
      <div>
        <label className="mb-1.5 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-[#646464]">
          Loại sản phẩm / Mẫu thông số
        </label>
        <select
          value={templateKey}
          onChange={(e) => handleTemplateChange(e.target.value)}
          className="admin-select text-xs"
        >
          {registry.keys.map((k) => (
            <option key={k} value={k}>
              {registry.templates[k]?.label ?? k}
            </option>
          ))}
        </select>
      </div>

      {templateKey === 'other' ? (
        /* ── Custom key/value editor (original behavior) ───────────────────── */
        <div className="space-y-2.5">
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-[11px] font-medium leading-relaxed text-amber-800">
            <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0 text-amber-600" />
            Thông số tùy chỉnh có thể ảnh hưởng đến tính nhất quán khi lọc và import dữ liệu hàng loạt.
          </div>

          <div className="hidden grid-cols-[1fr_1fr_auto] gap-2.5 px-1 text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:grid">
            <span>Thuộc tính</span>
            <span>Giá trị</span>
            <span className="sr-only">Xóa</span>
          </div>

          {customRows.map((row, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2.5">
              <input
                value={row.key}
                onChange={(e) => updateRow(idx, { key: e.target.value })}
                placeholder="VD: Dung tích"
                className={customRowInputClass}
              />
              <input
                value={row.value}
                onChange={(e) => updateRow(idx, { value: e.target.value })}
                placeholder="VD: 500ml"
                className={customRowInputClass}
              />
              <button
                type="button"
                onClick={() => removeRow(idx)}
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
            Mỗi dòng là một thông số kỹ thuật (ví dụ: Dung tích → 500ml). Dữ liệu được lưu dưới dạng JSON,
            dòng trống sẽ tự bỏ qua.
          </p>
        </div>
      ) : (
        /* ── Template fields ────────────────────────────────────────────────── */
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {[...(currentTemplate?.fields ?? [])]
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((field) => (
                <div
                  key={field.key}
                  className={field.type === 'textarea' ? 'sm:col-span-2' : ''}
                >
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    {field.label}
                    {field.required ? <span className="ml-1 text-[#E31E24]">*</span> : null}
                    {field.unit ? (
                      <span className="ml-1 font-normal text-slate-400">({field.unit})</span>
                    ) : null}
                  </label>

                  <TemplateFieldInput
                    field={field}
                    value={templateValues[field.key] ?? ''}
                    onChange={(v) => setField(field.key, v)}
                  />

                  {requiredErrors[field.key] ? (
                    <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-rose-600">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {requiredErrors[field.key]}
                    </p>
                  ) : null}
                </div>
              ))}
          </div>

          <p className="text-xs leading-relaxed text-slate-400">
            Mẫu thông số giúp đồng nhất dữ liệu và hỗ trợ lọc, import sau này. Các trường bỏ trống sẽ không được lưu.
          </p>
        </div>
      )}
    </div>
  );
}
