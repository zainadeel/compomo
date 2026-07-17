export type PercentageDecimals = 1 | 2;

/** Format a ratio as a locale-aware percentage with an exact, supported precision. */
export function formatPercentage(
  ratio: number,
  decimals: PercentageDecimals = 1,
  locale?: string,
): string {
  const precision = decimals === 2 ? 2 : 1;
  const value = Number.isFinite(ratio) ? ratio : 0;

  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(value);
}
