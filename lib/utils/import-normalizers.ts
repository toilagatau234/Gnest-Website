/**
 * Pure normalization functions for Excel import.
 * Each function accepts a raw user-typed string and returns a normalized number
 * or null if the value cannot be parsed.
 *
 * Used before type-checking in validateImportRow() so that common formats like
 * "100ml", "Phi 53", "100 gram" are accepted without strict formatting.
 */

// Generic: extract a leading number followed by an optional unit suffix.
// Returns null if no number is found.
function extractNumberWithUnit(
  raw: string,
  ...acceptedUnits: string[]
): number | null {
  const cleaned = raw.trim();
  if (!cleaned) return null;

  // Pattern: optional leading text, then digits, optional decimal, optional spaces, optional unit
  const unitPattern = acceptedUnits.length
    ? `(?:${acceptedUnits.map((u) => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})?`
    : '';
  const re = new RegExp(`^(\\d+(?:\\.\\d+)?)\\s*${unitPattern}$`, 'i');
  const m = cleaned.match(re);
  if (m) {
    const n = parseFloat(m[1]);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }
  return null;
}

/** "100ml" | "100 ML" | "100 mL" | "100" → 100 */
export function extractMl(raw: string): number | null {
  return extractNumberWithUnit(raw, 'ml');
}

/** "53mm" | "53 mm" | "53" → 53 ; also handles "Phi 53" | "phi53" → 53 */
export function extractMm(raw: string): number | null {
  const cleaned = raw.trim();
  if (!cleaned) return null;

  // "Phi 53" pattern
  const phiMatch = cleaned.match(/^phi\s*(\d+(?:\.\d+)?)\s*(?:mm)?$/i);
  if (phiMatch) {
    const n = parseFloat(phiMatch[1]);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  return extractNumberWithUnit(raw, 'mm');
}

/** "100g" | "100 g" | "100 gram" | "100 grams" | "100" → 100 */
export function extractGrams(raw: string): number | null {
  const cleaned = raw.trim();
  if (!cleaned) return null;

  // "100 gram(s)" pattern
  const gramMatch = cleaned.match(/^(\d+(?:\.\d+)?)\s*grams?$/i);
  if (gramMatch) {
    const n = parseFloat(gramMatch[1]);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  return extractNumberWithUnit(raw, 'g', 'gram');
}

/** "5.5cm" | "5.5 cm" | "5.5" → 5.5 */
export function extractCm(raw: string): number | null {
  return extractNumberWithUnit(raw, 'cm');
}

/** "2m" | "2 m" | "2" → 2 */
export function extractM(raw: string): number | null {
  return extractNumberWithUnit(raw, 'm');
}

/** "500g" | "5kg" → returns grams value (converts kg to g) */
export function extractGramsFlexible(raw: string): number | null {
  const cleaned = raw.trim();
  if (!cleaned) return null;

  // kg → g conversion
  const kgMatch = cleaned.match(/^(\d+(?:\.\d+)?)\s*kg$/i);
  if (kgMatch) {
    const n = parseFloat(kgMatch[1]);
    return Number.isFinite(n) && n >= 0 ? n * 1000 : null;
  }

  return extractGrams(raw);
}

/**
 * Tries to normalize a raw string value for a number spec field.
 * Applies field-key-specific normalization logic.
 * Returns the normalized number as a string, or the original string if
 * no normalization applies (allowing downstream type-checking to catch errors).
 */
export function normalizeNumberField(fieldKey: string, raw: string): string {
  const cleaned = raw.trim();

  let result: number | null = null;

  switch (fieldKey) {
    case 'capacity_ml':
      result = extractMl(cleaned);
      break;
    case 'neck_diameter_mm':
    case 'size_mm':
    case 'height_mm':
    case 'diameter_mm':
    case 'neck_size':
    case 'neck_size_mm':
      result = extractMm(cleaned);
      break;
    case 'weight_g':
    case 'weight':
      result = extractGramsFlexible(cleaned);
      break;
    case 'length_cm':
    case 'width_cm':
      result = extractCm(cleaned);
      break;
    case 'length_m':
      result = extractM(cleaned);
      break;
    default:
      // Try generic number extraction (digits only)
      result = extractNumberWithUnit(cleaned);
  }

  return result !== null ? String(result) : raw;
}

/**
 * Schema-driven numeric normalization.
 * Picks the extractor purely from the field's declared `unit`
 * (from product_spec_fields.unit), so brand-new numeric fields work
 * without touching code. Falls back to bare-number extraction.
 *
 *   unit 'ml'        → extractMl   ("100ml" → "100")
 *   unit 'mm'        → extractMm   ("Phi 53" → "53")
 *   unit 'g'/'gram'  → extractGramsFlexible ("5kg" → "5000")
 *   unit 'cm'        → extractCm
 *   unit 'm'         → extractM
 */
export function normalizeNumericByUnit(unit: string | null | undefined, raw: string): string {
  const cleaned = raw.trim();
  if (!cleaned) return raw;

  let result: number | null = null;
  switch ((unit ?? '').trim().toLowerCase()) {
    case 'ml':
      result = extractMl(cleaned);
      break;
    case 'mm':
      result = extractMm(cleaned);
      break;
    case 'g':
    case 'gram':
    case 'grams':
      result = extractGramsFlexible(cleaned);
      break;
    case 'cm':
      result = extractCm(cleaned);
      break;
    case 'm':
      result = extractM(cleaned);
      break;
    default:
      result = extractNumberWithUnit(cleaned);
  }

  return result !== null ? String(result) : raw;
}
