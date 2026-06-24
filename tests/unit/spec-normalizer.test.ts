import { describe, it, expect } from 'vitest';
import type { SpecField } from '@/lib/product-spec-templates';
import { parseSpecValue, normalizeRowSpecs } from '@/lib/utils/spec-normalizer';

const field = (over: Partial<SpecField>): SpecField => ({
  key: 'f',
  label: 'F',
  type: 'select',
  sortOrder: 0,
  ...over,
});

describe('parseSpecValue', () => {
  it('treats empty/absent input as null (not an error)', () => {
    const f = field({ type: 'select' });
    expect(parseSpecValue(f, undefined)).toEqual({ value: null });
    expect(parseSpecValue(f, null)).toEqual({ value: null });
    expect(parseSpecValue(f, '   ')).toEqual({ value: null });
  });

  it('number: normalizes by unit and rejects negatives / non-numbers', () => {
    const f = field({ type: 'number', unit: 'ml' });
    expect(parseSpecValue(f, '100 ml')).toEqual({ value: 100 });
    expect(parseSpecValue(f, '250')).toEqual({ value: 250 });
    expect(parseSpecValue(f, 'abc').error).toMatch(/số không âm/);
    expect(parseSpecValue(f, '-3').error).toMatch(/số không âm/);
  });

  it('boolean: accepts vi/en truthy & falsy tokens', () => {
    const f = field({ type: 'boolean' });
    expect(parseSpecValue(f, 'Có')).toEqual({ value: true });
    expect(parseSpecValue(f, 'yes')).toEqual({ value: true });
    expect(parseSpecValue(f, '1')).toEqual({ value: true });
    expect(parseSpecValue(f, 'Không')).toEqual({ value: false });
    expect(parseSpecValue(f, 'no')).toEqual({ value: false });
    expect(parseSpecValue(f, 'maybe').error).toMatch(/Có\/Không/);
  });

  it('select: enforces options membership when options exist', () => {
    const f = field({ type: 'select', options: ['Tròn', 'Vuông'] });
    expect(parseSpecValue(f, 'Tròn')).toEqual({ value: 'Tròn' });
    expect(parseSpecValue(f, 'Méo').error).toMatch(/không hợp lệ/);
  });

  it('select: accepts any value when no options are declared', () => {
    const f = field({ type: 'select' });
    expect(parseSpecValue(f, 'Bất kỳ')).toEqual({ value: 'Bất kỳ' });
  });

  it('multi_select: trims parts, validates each, re-joins with ", "', () => {
    const f = field({ type: 'multi_select', options: ['A', 'B', 'C'] });
    expect(parseSpecValue(f, ' A , B ')).toEqual({ value: 'A, B' });
    expect(parseSpecValue(f, 'A, X').error).toMatch(/không hợp lệ/);
  });
});

describe('normalizeRowSpecs', () => {
  const template = {
    fields: [
      field({ key: 'capacity_ml', type: 'number', unit: 'ml' }),
      field({ key: 'shape', type: 'select', options: ['Tròn', 'Vuông'] }),
      field({ key: 'food_safe', type: 'boolean' }),
    ],
  };

  it('keeps only template fields with non-empty parsed values + tags _template', () => {
    const out = normalizeRowSpecs(
      template,
      { capacity_ml: '250 ml', shape: 'Tròn', food_safe: 'Có', stray: 'ignored' },
      'glass_container',
    );
    expect(out).toEqual({
      capacity_ml: 250,
      shape: 'Tròn',
      food_safe: true,
      _template: 'glass_container',
    });
    // a key not in the template is dropped under template-driven mode
    expect(out).not.toHaveProperty('stray');
  });

  it('omits fields whose value is empty/absent', () => {
    const out = normalizeRowSpecs(template, { capacity_ml: '', shape: 'Vuông' }, 'glass_container');
    expect(out).toEqual({ shape: 'Vuông', _template: 'glass_container' });
  });

  it('template-less: copies arbitrary non-empty keys but blocks prototype pollution', () => {
    const out = normalizeRowSpecs(
      undefined,
      { color: 'Đỏ', empty: '   ', __proto__: 'x', constructor: 'y', prototype: 'z' } as Record<string, unknown>,
      'custom',
    );
    expect(out).toEqual({ color: 'Đỏ', _template: 'custom' });
    expect(Object.getPrototypeOf(out)).toBe(Object.prototype);
    expect(out).not.toHaveProperty('empty');
  });

  it('does not tag _template when templateCode is empty', () => {
    const out = normalizeRowSpecs(undefined, { color: 'Đỏ' }, '');
    expect(out).toEqual({ color: 'Đỏ' });
  });
});
