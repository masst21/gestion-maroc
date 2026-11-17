export function formatMad(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? parseFloat(value) : Number(value ?? 0);
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2,
  }).format(isNaN(n) ? 0 : n);
}

export function computeTtc(ht: number, vatRate: number): number {
  return +(ht * (1 + vatRate / 100)).toFixed(2);
}

export function computeHt(ttc: number, vatRate: number): number {
  return +(ttc / (1 + vatRate / 100)).toFixed(2);
}