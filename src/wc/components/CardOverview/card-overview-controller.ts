import type { CardOverviewVariant, OverviewMetric } from './card-overview-types';

export interface CardOverviewCollapseGeometry {
  active: boolean;
  expandedHeight: number;
  offset: number;
  visibleHeight: number;
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
