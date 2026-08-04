import type { ChartDataIntent } from './chart-grammar';
import { resolveCssLengthPx } from './resolve-css-length-px';
import { TOKEN_DEFAULTS } from './token-defaults';

/** Private, renderer-neutral visual defaults resolved by the chart compiler. */
export interface ChartTheme {
  seriesStrokeWidth: string;
  ruleStrokeWidth: string;
  gridStrokeWidth: string;
  barRadius: string;
  polarCornerRadius: number;
  polarLabelGap: number;
  dotRadius: number | string;
  dotHaloWidth: number | string;
  focusRadius: number;
  areaOpacity: number;
  heatmapMinimumOpacity: number;
  heatmapMaximumOpacity: number;
  cellGap: number;
  stackGap: number;
  donutGap: number;
  annotationFillOpacity: number;
}

export const defaultChartTheme: ChartTheme = {
  seriesStrokeWidth: 'var(--dimension-stroke-width-025)',
  ruleStrokeWidth: 'var(--dimension-stroke-width-012)',
  gridStrokeWidth: 'var(--dimension-stroke-width-012)',
  barRadius: 'var(--dimension-radius-025)',
  polarCornerRadius: 2,
  polarLabelGap: 16,
  dotRadius: 'var(--dimension-stroke-width-025)',
  dotHaloWidth: 'var(--dimension-stroke-width-012)',
  focusRadius: 6,
  areaOpacity: 0.25,
  heatmapMinimumOpacity: 0.25,
  heatmapMaximumOpacity: 1,
  cellGap: 1,
  stackGap: 1,
  donutGap: 1,
  annotationFillOpacity: 0.25,
};

/** Resolve chart geometry and opacity recipes from the current TokoMo theme. */
export function resolveChartTheme(element?: Element): ChartTheme {
  const style = element && typeof getComputedStyle === 'function'
    ? getComputedStyle(element)
    : undefined;
  const lowOpacity = Number.parseFloat(
    style?.getPropertyValue('--effect-opacity-low') ?? '',
  );
  const resolvedLowOpacity = Number.isFinite(lowOpacity)
    ? lowOpacity
    : defaultChartTheme.heatmapMinimumOpacity;
  return {
    ...defaultChartTheme,
    polarCornerRadius: resolveCssLengthPx(TOKEN_DEFAULTS.radius025, 2),
    polarLabelGap: resolveCssLengthPx(TOKEN_DEFAULTS.space200, 16),
    dotRadius: resolveCssLengthPx(TOKEN_DEFAULTS.strokeWidth025, 2),
    dotHaloWidth: resolveCssLengthPx(TOKEN_DEFAULTS.strokeWidth012, 1),
    stackGap: resolveCssLengthPx(TOKEN_DEFAULTS.strokeWidth012, 1),
    donutGap: resolveCssLengthPx(TOKEN_DEFAULTS.strokeWidth012, 1),
    areaOpacity: resolvedLowOpacity,
    heatmapMinimumOpacity: resolvedLowOpacity,
  };
}

export function chartIntentColor(intent: ChartDataIntent = 'brand'): string {
  return `var(--color-data-intent-${intent})`;
}
