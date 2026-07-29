import type { MetricTrend } from '../../utils/metric-change';

/**
 * Leading summary block — the headline figure the rest of the bar contextualises.
 *
 * Derive `trend` with `resolveMetricTrend` so whether a rise reads well stays a
 * product decision rather than a design-system one.
 */
export interface OverviewScore {
  /** Category above the figure, for example `Safety score`. */
  label: string;
  /** Display-ready headline figure. */
  value: string | number;
  /** Change against the comparison period. Omit when there is nothing to report. */
  trend?: MetricTrend;
  /** Qualitative band beneath the figure, for example `Good (67–83)`. */
  band?: string;
}

/** One measure in the overview grid. */
export interface OverviewMetric {
  /** Stable identity for keyed rendering and selection events. */
  id: string;
  label: string;
  /** Display-ready value; format compactly before passing it in. */
  value: string | number;
  /** Change against the comparison period. Omit when there is nothing to report. */
  trend?: MetricTrend;
  /** Present the measure without making it selectable. */
  isInactive?: boolean;
  /** Supplementary explanation for the label. */
  labelTooltip?: string;
}
