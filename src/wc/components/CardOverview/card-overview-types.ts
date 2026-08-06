import type { MetricTrend } from '../../utils/metric-change';

export type CardOverviewVariant = 'default' | 'compact';
export type CardOverviewLayout = 'auto' | 'stacked';
export type SafetyScoreLevel = 'fair' | 'good' | 'excellent';

/**
 * Leading summary block — the headline figure the rest of the bar contextualises.
 *
 * Derive `trend` with `resolveMetricTrend` so whether a rise reads well stays a
 * product decision rather than a design-system one.
 */
export interface OverviewScore {
  /** Display-ready headline figure. */
  value: string | number;
  /** Change against the comparison period. Omit when there is nothing to report. */
  trend?: MetricTrend;
  /**
   * Safety score color level. Numeric values from 0–100 infer fair (0–50),
   * good (51–80), or excellent (81–100) when this is omitted.
   */
  level?: SafetyScoreLevel;
  /** @deprecated Ignored. The redesigned score cell no longer renders a band. */
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
