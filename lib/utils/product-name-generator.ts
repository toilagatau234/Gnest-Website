/**
 * Generates a product name from a template string and a specs object.
 *
 * Template syntax: uses {field_key} placeholders that are replaced by the
 * corresponding value in specs. Missing or empty values are replaced with
 * an empty string and then extra spaces are collapsed.
 *
 * Example:
 *   nameTemplate = "{container_type} {capacity_ml}ml Phi {neck_diameter_mm}"
 *   specs = { container_type: "Hũ Lục Giác", capacity_ml: 100, neck_diameter_mm: 53 }
 *   result = "Hũ Lục Giác 100ml Phi 53"
 *
 * Returns null when the result is empty (e.g., all placeholders were missing).
 */
export function generateProductName(
  nameTemplate: string | null | undefined,
  specs: Record<string, unknown>,
): string | null {
  if (!nameTemplate) return null;

  const result = nameTemplate.replace(/\{(\w+)\}/g, (_, key: string) => {
    const val = specs[key];
    if (val === null || val === undefined || val === '') return '';
    return String(val);
  });

  // Collapse multiple spaces and trim leading/trailing whitespace
  const cleaned = result.replace(/\s+/g, ' ').trim();
  return cleaned || null;
}
