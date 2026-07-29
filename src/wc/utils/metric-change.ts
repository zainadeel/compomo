import { formatCompactNumber } from './format-compact-number';

export type MetricTrendDirection = 'up' | 'down';

/**
 * How a change should read to the user. Deliberately separate from direction:
 * a metric can fall and read positive, or move and read neutral, so the arrow
 * and the sentiment are independent.
 */
export type MetricTrendTone = 'positive' | 'negative' | 'neutral';

/** Display-ready trend for an overview score or metric. */
export interface MetricTrend {
  direction: MetricTrendDirection;
  /** Formatted change, for example `9` or `32%`. */
  value: string;
  tone: MetricTrendTone;
}

export interface MetricChange {
  /** Signed difference, current minus previous. */
  delta: number;
  /** Magnitude of the difference. */
  absolute: number;
  /**
   * Magnitude as a share of the previous value, so `0.32` means 32 percent.
   * Zero when the previous value is zero, because the change has no base to
   * measure against and an infinite increase is not reportable.
   */
  ratio: number;
  /** `null` when the values match or either side is missing. */
  direction: MetricTrendDirection | null;
}

export interface ResolveMetricTrendOptions {
  /** Lower is better, so a decrease reads positive. Collisions, costs, defects. */
  inverted?: boolean;
  /** Report the change without a positive or negative reading. */
  neutral?: boolean;
  /** Report the change as a share of the previous value rather than a magnitude. */
  display?: 'absolute' | 'percentage';
  locale?: string;
}

const NO_CHANGE: MetricChange = { delta: 0, absolute: 0, ratio: 0, direction: null };

function isUsable(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Compare a metric against its previous period.
 *
 * Reports magnitudes only — whether a rise is good news is a product decision,
 * so callers pair this with `resolveMetricTrend` or map `direction` themselves.
 */
export function computeMetricChange(
  current: number | null | undefined,
  previous: number | null | undefined,
): MetricChange {
  if (!isUsable(current) || !isUsable(previous)) return NO_CHANGE;

  // Trim floating-point noise so 0.3 - 0.1 does not report a change of 0.199…
  const delta = Number.parseFloat((current - previous).toFixed(10));
  if (delta === 0) return NO_CHANGE;

  const absolute = Math.abs(delta);
  const ratio = previous === 0 ? 0 : Math.abs(delta / previous);

  return { delta, absolute, ratio, direction: delta > 0 ? 'up' : 'down' };
}

/**
 * Build a display-ready trend, or `null` when there is nothing to report so the
 * caller can omit the trend entirely rather than render a zero.
 *
 * Percentages are formatted without decimals to match the product's overview
 * bar; `formatPercentage` is not used because it requires one or two decimals.
 */
export function resolveMetricTrend(
  current: number | null | undefined,
  previous: number | null | undefined,
  options: ResolveMetricTrendOptions = {},
): MetricTrend | null {
  const { inverted = false, neutral = false, display = 'absolute', locale } = options;
  const change = computeMetricChange(current, previous);
  if (!change.direction) return null;

  // A rise reads positive by default and negative when lower is better.
  const rose = change.direction === 'up';
  const tone: MetricTrendTone = neutral
    ? 'neutral'
    : rose !== inverted
      ? 'positive'
      : 'negative';

  const value = display === 'percentage'
    ? new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(change.ratio)
    : formatCompactNumber(change.absolute, locale);

  return { direction: change.direction, value, tone };
}
