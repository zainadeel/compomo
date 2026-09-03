import type { CardOverviewVariant, OverviewMetric } from './card-overview-types';

export { resolveSafetyScoreLevel } from '../Score/score-model';

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
 * balanced, so there is nothing to distribute.
 *
 * Once the width forces a wrap, prefer equal rows — the widest column count
 * that divides the total exactly. Eight cells therefore step 8 → 4+4 → 2+2+2+2
 * as the width narrows, never trading an equal split for a shorter grid.
 *
 * Totals with no equal split available fall back to the fewest rows that fit,
 * spread as evenly as possible, which leaves one short final row: five cells at
 * a four-cell width are 3+2, seven are 4+3.
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

  for (let columns = fittingColumns; columns >= 2; columns -= 1) {
    if (cellCount % columns === 0) return columns;
  }

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

export function resolveOverviewRovingIndex(
  metrics: readonly OverviewMetric[],
  focusedIndex: number
): number {
  const first = metrics.findIndex(metric => !metric.isInactive);
  if (first < 0) return -1;
  return metrics[focusedIndex] && !metrics[focusedIndex].isInactive ? focusedIndex : first;
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
