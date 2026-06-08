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
