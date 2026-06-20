import { describe, it, expect } from 'vitest';
import {
  extractMl,
  extractMm,
  extractGrams,
  extractGramsFlexible,
  extractCm,
  normalizeNumberField,
  normalizeNumericByUnit,
} from '@/lib/utils/import-normalizers';

describe('measurement extractors (Phase 6 normalization)', () => {
  it('parses millilitres in any spacing/casing', () => {
    expect(extractMl('100ml')).toBe(100);
    expect(extractMl('100 ml')).toBe(100);
    expect(extractMl('100ML')).toBe(100);
    expect(extractMl('100 mL')).toBe(100);
    expect(extractMl('100')).toBe(100);
  });

  it('parses "Phi 53" diameter notation', () => {
    expect(extractMm('Phi 53')).toBe(53);
    expect(extractMm('phi53')).toBe(53);
    expect(extractMm('53mm')).toBe(53);
    expect(extractMm('53')).toBe(53);
  });

  it('parses grams and converts kg → g', () => {
    expect(extractGrams('100 gram')).toBe(100);
    expect(extractGrams('100g')).toBe(100);
    expect(extractGramsFlexible('5kg')).toBe(5000);
    expect(extractCm('5.5cm')).toBe(5.5);
  });

  it('returns null for non-numeric input', () => {
    expect(extractMl('abc')).toBeNull();
    expect(extractMm('')).toBeNull();
  });
});

describe('normalizeNumericByUnit (schema-driven by field.unit)', () => {
  it('routes by declared unit', () => {
    expect(normalizeNumericByUnit('ml', '100 ml')).toBe('100');
    expect(normalizeNumericByUnit('mm', 'Phi 53')).toBe('53');
    expect(normalizeNumericByUnit('g', '5kg')).toBe('5000');
    expect(normalizeNumericByUnit('cm', '12 cm')).toBe('12');
  });

  it('falls back to bare-number extraction for unknown units', () => {
    expect(normalizeNumericByUnit('gsm', '80')).toBe('80');
    expect(normalizeNumericByUnit(undefined, '42')).toBe('42');
  });

  it('returns the original string when unparseable (lets validation flag it)', () => {
    expect(normalizeNumericByUnit('ml', 'two hundred')).toBe('two hundred');
  });
});

describe('normalizeNumberField (legacy field-key routing)', () => {
  it('normalizes by known field key', () => {
    expect(normalizeNumberField('capacity_ml', '250ml')).toBe('250');
    expect(normalizeNumberField('neck_diameter_mm', 'Phi 48')).toBe('48');
    expect(normalizeNumberField('weight_g', '2kg')).toBe('2000');
  });
});
