import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import {
  normalizeString,
  groupSpecAttributes,
  parseExcelWithTechKeys,
} from '@/lib/utils/product-import-utils';

describe('normalizeString (slugify, Vietnamese-aware)', () => {
  it('strips diacritics and đ', () => {
    expect(normalizeString('Hủ Thủy Tinh Tròn')).toBe('hu-thuy-tinh-tron');
    expect(normalizeString('Đá lạnh')).toBe('da-lanh');
    expect(normalizeString('  Mixed CASE 123 ')).toBe('mixed-case-123');
  });
});

describe('groupSpecAttributes (Phase 5 spec grouping)', () => {
  it('moves spec.* keys into specs and keeps core keys flat', () => {
    const { cleanRow, specs } = groupSpecAttributes({
      sku: 'HTT100',
      name: 'Hu',
      'spec.cap_type': 'Nắp thiếc',
      'spec.capacity_ml': 100,
      'spec.neck_diameter_mm': 53,
    });
    expect(cleanRow).toEqual({ sku: 'HTT100', name: 'Hu' });
    expect(specs).toEqual({ cap_type: 'Nắp thiếc', capacity_ml: 100, neck_diameter_mm: 53 });
  });

  it('drops empty spec values', () => {
    const { specs } = groupSpecAttributes({ 'spec.material': '', 'spec.color': '   ', 'spec.size': 'M' });
    expect(specs).toEqual({ size: 'M' });
  });
});

describe('parseExcelWithTechKeys (Phase 3 two-row header parser)', () => {
  it('uses row 2 technical keys (not row 1 labels) and starts data at row 3', async () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Mã sản phẩm', 'Loại nắp', 'Dung tích'],   // row 1: VI labels (ignored)
      ['sku', 'spec.cap_type', 'spec.capacity_ml'], // row 2: tech keys
      ['HTT100', 'Nắp thiếc', '100ml'],             // row 3: data
      ['HTT200', 'Nắp vặn', '200ml'],
    ]);

    const rows = await parseExcelWithTechKeys(ws);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ row: 3, sku: 'HTT100', 'spec.cap_type': 'Nắp thiếc', 'spec.capacity_ml': '100ml' });
    expect(rows[1]).toMatchObject({ row: 4, sku: 'HTT200' });
    // The Vietnamese label row must NOT become a data key.
    expect(rows[0]).not.toHaveProperty('Mã sản phẩm');
  });

  it('returns [] when fewer than 3 rows', async () => {
    const ws = XLSX.utils.aoa_to_sheet([['a'], ['b']]);
    expect(await parseExcelWithTechKeys(ws)).toEqual([]);
  });
});
