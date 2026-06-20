import type { ImportRow } from '@/lib/services/admin/product-import';

/**
 * Standard string normalization helper to slugify values.
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Separate `spec.*` prefixed keys from a flat row object into a nested
 * `specs` object, returning the cleaned row alongside the grouped specs.
 */
export function groupSpecAttributes(flatRow: Record<string, unknown>): {
  cleanRow: Record<string, unknown>;
  specs: Record<string, unknown>;
} {
  const cleanRow: Record<string, unknown> = {};
  const specs: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(flatRow)) {
    if (key.startsWith('spec.') && key.length > 5) {
      const specKey = key.slice(5);
      if (specKey && value !== null && value !== undefined && String(value).trim() !== '') {
        specs[specKey] = value;
      }
    } else {
      cleanRow[key] = value;
    }
  }

  return { cleanRow, specs };
}

/**
 * Parse an Excel worksheet that has a 2-row header:
 *   Row 0 = Vietnamese display headers (ignored)
 *   Row 1 = Technical keys used as object keys
 *   Row 2+ = Data rows
 *
 * Returns a flat `Record<string, unknown>[]` where spec columns remain as
 * `spec.fieldKey` strings (grouping happens separately).
 */
export async function parseExcelWithTechKeys(
  worksheet: any,
): Promise<Record<string, unknown>[]> {
  const XLSX = await import('xlsx');
  const tempRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: null,
    blankrows: false,
  });
  if (tempRows.length < 3) return [];
  const techHeaders = (tempRows[1] as (string | null)[]).map((k) =>
    typeof k === 'string' ? k.trim() : '',
  );

  const parsed = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    header: techHeaders,
    range: 2,
    defval: null,
    blankrows: false,
  });

  return parsed.flatMap((row, i) => {
    const obj: Record<string, unknown> = { row: i + 3 };
    techHeaders.forEach((key) => {
      if (key && row[key] !== undefined) {
        obj[key] = row[key];
      }
    });
    const hasData = techHeaders.some((k) => k && obj[k] !== null && obj[k] !== '');
    return hasData ? [obj] : [];
  });
}
