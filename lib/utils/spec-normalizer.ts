import { normalizeNumericByUnit } from '@/lib/utils/import-normalizers';
import type { SpecField } from '@/lib/product-spec-templates';

/**
 * Schema-driven parse/validate of a single spec field value.
 * Normalization (numbers) is driven by the field's declared `unit`, and
 * enum membership is checked against the field's `options` — so new fields
 * and new product types work without code changes.
 *
 * Returns `{ value }` on success (where `value === null` means the input was empty/absent),
 * or `{ error }` with a Vietnamese message describing why the value is invalid.
 *
 * Pure (no server-only deps) so it can be unit-tested directly.
 */
export function parseSpecValue(field: SpecField, rawVal: unknown): { error?: string; value?: unknown } {
  if (rawVal === undefined || rawVal === null || String(rawVal).trim() === '') {
    return { value: null };
  }
  const strVal = String(rawVal).trim();

  switch (field.type) {
    case 'number': {
      const normalized = normalizeNumericByUnit(field.unit, strVal);
      const num = Number(normalized);
      if (isNaN(num) || num < 0) {
        return { error: `phải là số không âm (nhận được: "${strVal}")` };
      }
      return { value: num };
    }
    case 'boolean': {
      const v = strVal.toLowerCase();
      if (['true', 'yes', '1', 'có'].includes(v)) return { value: true };
      if (['false', 'no', '0', 'không'].includes(v)) return { value: false };
      return { error: `phải là Có/Không (nhận được: "${strVal}")` };
    }
    case 'select': {
      if (field.options && field.options.length > 0 && !field.options.includes(strVal)) {
        return { error: `giá trị "${strVal}" không hợp lệ. Cho phép: ${field.options.join(', ')}` };
      }
      return { value: strVal };
    }
    case 'multi_select': {
      const parts = strVal.split(',').map((p) => p.trim()).filter(Boolean);
      if (field.options && field.options.length > 0) {
        const bad = parts.filter((p) => !field.options!.includes(p));
        if (bad.length > 0) {
          return { error: `giá trị "${bad.join(', ')}" không hợp lệ. Cho phép: ${field.options.join(', ')}` };
        }
      }
      return { value: parts.join(', ') };
    }
    default:
      return { value: strVal };
  }
}

/**
 * Builds the normalized specs JSONB for a row. Template-driven fields are parsed/normalized via
 * parseSpecValue; for template-less rows, arbitrary keys are copied as-is (skipping
 * prototype-polluting keys). The active template code is tagged as `_template`.
 */
export function normalizeRowSpecs(
  template: { fields: SpecField[] } | undefined,
  specs: Record<string, unknown> | null | undefined,
  templateCode: string,
): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  if (template && specs) {
    for (const field of template.fields) {
      const parsed = parseSpecValue(field, specs[field.key]);
      if (parsed.value !== undefined && parsed.value !== null) {
        normalized[field.key] = parsed.value;
      }
    }
  } else if (specs) {
    for (const [k, v] of Object.entries(specs)) {
      // Skip prototype-polluting keys when copying arbitrary (template-less) spec keys.
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
      if (v !== null && v !== undefined && String(v).trim() !== '') normalized[k] = v;
    }
  }
  if (templateCode) normalized._template = templateCode;
  return normalized;
}
