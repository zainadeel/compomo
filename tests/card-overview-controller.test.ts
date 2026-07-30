import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  findNextOverviewMetricIndex,
  resolveCardOverviewCollapseGeometry,
  resolveOverviewRovingIndex,
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
});
