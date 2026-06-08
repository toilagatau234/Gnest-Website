export function formatCurrencyInput(value: string) {
  const clean = value.replace(/[^0-9]/g, '');
  if (!clean) {
    return '';
  }

  return Number(clean).toLocaleString('vi-VN');
}

export function parseCurrencyInput(value: string) {
  return Number(value.replace(/[^0-9]/g, '') || 0);
}

export function parseNullableCurrencyInput(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  if (!str) return null;
  const clean = str.replace(/\D/g, '');
  if (!clean) return null;
  return Number(clean);
}

