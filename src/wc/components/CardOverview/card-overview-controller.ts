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
 * Choose the densest column count that fits without leaving an incomplete row
 * for even cell totals. Odd totals retain the densest fitting layout and may
 * therefore leave an orphan in the final row.
 */
export function resolveOverviewGridColumns(options: {
  cellCount: number;
  availableWidth: number;
  minCellWidth: number;
  maxColumns?: number;
}): number {
  const cellCount = Math.max(1, Math.floor(options.cellCount));
  const minCellWidth = Math.max(1, options.minCellWidth);
  const maxColumns = Math.max(1, Math.floor(options.maxColumns ?? 4));
  const fittingColumns = Math.max(
    1,
    Math.min(cellCount, maxColumns, Math.floor(Math.max(0, options.availableWidth) / minCellWidth))
  );

  if (cellCount % 2 !== 0) return fittingColumns;

  for (let columns = fittingColumns; columns >= 1; columns -= 1) {
    if (cellCount % columns === 0) return columns;
  }

  return 1;
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
