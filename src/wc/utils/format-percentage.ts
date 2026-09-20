import { numberFormatter } from './intl-formatters';
export type PercentageDecimals = 1 | 2;

/** Format a ratio as a percentage (English by default) with an exact, supported precision. */
export function formatPercentage(
  ratio: number,
  decimals: PercentageDecimals = 1,
  locale?: string
): string {
  const precision = decimals === 2 ? 2 : 1;
  const value = Number.isFinite(ratio) ? ratio : 0;

  return numberFormatter(locale, {
    style: 'percent',
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(value);
}
