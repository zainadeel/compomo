import type {
  CardOverviewVariant,
  OverviewMetric,
  SafetyScoreLevel,
} from './card-overview-types';

export interface CardOverviewCollapseGeometry {
  active: boolean;
  expandedHeight: number;
  offset: number;
  visibleHeight: number;
}

/**
 * Choose the column count for the metric grid.
 *
 * Cells that all fit across one row stay on one row: a full row is already
 * balanced, so there is nothing to distribute. Only once the width forces a
 * wrap does balancing apply — take the fewest rows that fit and spread cells
 * evenly over them, which leaves at most one short final row.
 *
 * Width is the only ceiling. There is deliberately no column cap: a wide card
 * showing six cells that each clear `minCellWidth` renders all six across.
 */
export function resolveOverviewGridColumns(options: {
  cellCount: number;
  availableWidth: number;
  minCellWidth: number;
}): number {
  const cellCount = Math.max(1, Math.floor(options.cellCount));
  const minCellWidth = Math.max(1, options.minCellWidth);
  const fittingColumns = Math.max(
    1,
    Math.floor(Math.max(0, options.availableWidth) / minCellWidth)
  );

  if (fittingColumns >= cellCount) return cellCount;

  const rows = Math.ceil(cellCount / fittingColumns);
  return Math.ceil(cellCount / rows);
}

export function resolveCardOverviewCollapseGeometry(options: {
  variant: CardOverviewVariant;
  progress: number;
  expandedHeight: number;
  compactHeight: number;
}): CardOverviewCollapseGeometry {
  const compactHeight = Math.max(0, options.compactHeight);
  const expandedHeight = Math.max(options.expandedHeight, compactHeight);
  const progress =
    options.variant === 'compact' || !Number.isFinite(options.progress)
      ? 0
      : Math.min(1, Math.max(0, options.progress));
  const distance = Math.max(0, expandedHeight - compactHeight);
  const offset = distance * progress;

  return {
    active: progress > 0 && distance > 0,
    expandedHeight,
    offset,
    visibleHeight: expandedHeight - offset,
  };
}

export function resolveSafetyScoreLevel(value: string | number): SafetyScoreLevel | undefined {
  const numericValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0 || numericValue > 100) return undefined;
  if (numericValue <= 50) return 'fair';
  if (numericValue <= 80) return 'good';
  return 'excellent';
}

export function resolveOverviewRovingIndex(
  metrics: readonly OverviewMetric[],
  focusedIndex: number
): number {
  const first = metrics.findIndex(metric => !metric.isInactive);
  if (first < 0) return -1;
  return metrics[focusedIndex] && !metrics[focusedIndex].isInactive
    ? focusedIndex
    : first;
}

export function findNextOverviewMetricIndex(
  metrics: readonly OverviewMetric[],
  from: number,
  step: -1 | 1
): number {
  for (let offset = 1; offset <= metrics.length; offset += 1) {
    const next = (((from + step * offset) % metrics.length) + metrics.length) % metrics.length;
    if (!metrics[next]?.isInactive) return next;
  }
  return -1;
}
