import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  findNextOverviewMetricIndex,
  resolveCardOverviewCollapseGeometry,
  resolveOverviewGridColumns,
  resolveOverviewRovingIndex,
  resolveSafetyScoreLevel,
} from '../src/wc/components/CardOverview/card-overview-controller';
import type { OverviewMetric } from '../src/wc/components/CardOverview/card-overview-types';

const metrics: OverviewMetric[] = [
  { id: 'one', label: 'One', value: '1' },
  { id: 'two', label: 'Two', value: '2', isInactive: true },
  { id: 'three', label: 'Three', value: '3' },
];

describe('CardOverview controller', () => {
  it('shrinks the elevated surface without changing its expanded flow height', () => {
    assert.deepEqual(
      resolveCardOverviewCollapseGeometry({
        variant: 'default',
        progress: 0.5,
        expandedHeight: 240,
        compactHeight: 48,
      }),
      {
        active: true,
        expandedHeight: 240,
        offset: 96,
        visibleHeight: 144,
      }
    );
  });

  it('disables progressive collapse for the compact handoff', () => {
    assert.deepEqual(
      resolveCardOverviewCollapseGeometry({
        variant: 'compact',
        progress: 1,
        expandedHeight: 240,
        compactHeight: 48,
      }),
      {
        active: false,
        expandedHeight: 240,
        offset: 0,
        visibleHeight: 240,
      }
    );
  });

  it('keeps roving focus on active metrics and wraps past inactive metrics', () => {
    assert.equal(resolveOverviewRovingIndex(metrics, 1), 0);
    assert.equal(findNextOverviewMetricIndex(metrics, 0, 1), 2);
    assert.equal(findNextOverviewMetricIndex(metrics, 0, -1), 2);
  });

  it('maps Safety Score boundaries to their semantic levels', () => {
    assert.equal(resolveSafetyScoreLevel(0), 'fair');
    assert.equal(resolveSafetyScoreLevel(50), 'fair');
    assert.equal(resolveSafetyScoreLevel(51), 'good');
    assert.equal(resolveSafetyScoreLevel(80), 'good');
    assert.equal(resolveSafetyScoreLevel(81), 'excellent');
    assert.equal(resolveSafetyScoreLevel(100), 'excellent');
    assert.equal(resolveSafetyScoreLevel('87'), 'excellent');
    assert.equal(resolveSafetyScoreLevel('unavailable'), undefined);
    assert.equal(resolveSafetyScoreLevel(101), undefined);
  });

  it('keeps every cell on one row when the width fits them all', () => {
    const columns = (cellCount: number, capacity: number) =>
      resolveOverviewGridColumns({
        cellCount,
        availableWidth: capacity * 180,
        minCellWidth: 180,
      });

    // A full row needs no balancing, and no column cap may override the fit.
    assert.equal(columns(4, 4), 4);
    assert.equal(columns(5, 5), 5);
    assert.equal(columns(6, 6), 6);
    assert.equal(columns(8, 8), 8);
    // Spare capacity beyond the cell count changes nothing.
    assert.equal(columns(6, 9), 6);
  });

  it('spreads cells evenly over the fewest rows once the width forces a wrap', () => {
    const columns = (cellCount: number, capacity: number) =>
      resolveOverviewGridColumns({
        cellCount,
        availableWidth: capacity * 180,
        minCellWidth: 180,
      });

    assert.equal(columns(4, 3), 2); // 2+2 beats 3+1
    assert.equal(columns(6, 5), 3); // 3+3
    assert.equal(columns(6, 4), 3); // 3+3
    assert.equal(columns(6, 2), 2); // 2+2+2
    assert.equal(columns(8, 4), 4); // 4+4
    assert.equal(columns(8, 3), 3); // 3+3+2 — fewer rows than 2+2+2+2
  });

  it('leaves a short final row where the total cannot divide evenly', () => {
    const columns = (cellCount: number, capacity: number) =>
      resolveOverviewGridColumns({
        cellCount,
        availableWidth: capacity * 180,
        minCellWidth: 180,
      });

    assert.equal(columns(5, 4), 3); // 3+2, not 4+1
    assert.equal(columns(7, 4), 4); // 4+3
    assert.equal(columns(7, 3), 3); // 3+3+1
    assert.equal(columns(3, 2), 2); // 2+1
  });

  it('falls back to a single column when nothing fits', () => {
    assert.equal(
      resolveOverviewGridColumns({ cellCount: 6, availableWidth: 0, minCellWidth: 180 }),
      1
    );
    assert.equal(
      resolveOverviewGridColumns({ cellCount: 6, availableWidth: 100, minCellWidth: 180 }),
      1
    );
  });
});
