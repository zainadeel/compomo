import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeMetricChange,
  resolveMetricTrend,
  type MetricTrendTone,
} from '../src/wc/utils/metric-change';

describe('computeMetricChange', () => {
  it('reports a rise as an up direction with signed delta', () => {
    assert.deepEqual(computeMetricChange(120, 100), {
      delta: 20,
      absolute: 20,
      ratio: 0.2,
      direction: 'up',
    });
  });

  it('reports a fall as a down direction and keeps the magnitude positive', () => {
    assert.deepEqual(computeMetricChange(6, 15), {
      delta: -9,
      absolute: 9,
      ratio: 0.6,
      direction: 'down',
    });
  });

  it('reports no direction when the values match', () => {
    assert.equal(computeMetricChange(42, 42).direction, null);
  });

  it('reports no direction when either side is missing', () => {
    for (const [current, previous] of [
      [10, null],
      [10, undefined],
      [null, 10],
      [undefined, 10],
      [null, null],
    ] as [number | null | undefined, number | null | undefined][]) {
      assert.equal(computeMetricChange(current, previous).direction, null);
    }
  });

  it('reports no direction for non-finite input', () => {
    assert.equal(computeMetricChange(Number.NaN, 10).direction, null);
    assert.equal(computeMetricChange(10, Number.POSITIVE_INFINITY).direction, null);
  });

  it('reports a zero ratio when the previous value is zero', () => {
    // An increase from nothing has no base to measure against.
    const change = computeMetricChange(25, 0);
    assert.equal(change.direction, 'up');
    assert.equal(change.absolute, 25);
    assert.equal(change.ratio, 0);
  });

  it('trims floating point noise rather than reporting a phantom change', () => {
    assert.equal(computeMetricChange(0.3, 0.1).delta, 0.2);
    assert.equal(computeMetricChange(0.1 + 0.2, 0.3).direction, null);
  });
});

describe('resolveMetricTrend', () => {
  it('returns null when there is nothing to report', () => {
    assert.equal(resolveMetricTrend(42, 42), null);
    assert.equal(resolveMetricTrend(42, null), null);
  });

  it('reads a rise as negative when lower is better', () => {
    const trend = resolveMetricTrend(91.6, 69.4, { inverted: true, display: 'percentage' });
    assert.equal(trend?.direction, 'up');
    assert.equal(trend?.tone, 'negative');
    assert.equal(trend?.value, '32%');
  });

  it('reads a fall as positive when lower is better', () => {
    const trend = resolveMetricTrend(6, 15, { inverted: true });
    assert.deepEqual(trend, { direction: 'down', value: '9', tone: 'positive' });
  });

  it('reads a fall as negative by default', () => {
    assert.equal(resolveMetricTrend(55, 59)?.tone, 'negative');
  });

  it('reads a rise as positive by default', () => {
    assert.equal(resolveMetricTrend(59, 55)?.tone, 'positive');
  });

  it('keeps the arrow but drops the sentiment when neutral', () => {
    const trend = resolveMetricTrend(55, 59, { neutral: true });
    assert.equal(trend?.direction, 'down');
    assert.equal(trend?.tone, 'neutral');
  });

  it('ignores inverted when neutral is set', () => {
    for (const inverted of [true, false]) {
      assert.equal(resolveMetricTrend(10, 5, { neutral: true, inverted })?.tone, 'neutral');
    }
  });

  it('covers every direction and tone combination', () => {
    const cases: [
      number,
      number,
      { inverted?: boolean; neutral?: boolean },
      string,
      MetricTrendTone,
    ][] = [
      [10, 5, {}, 'up', 'positive'],
      [5, 10, {}, 'down', 'negative'],
      [10, 5, { inverted: true }, 'up', 'negative'],
      [5, 10, { inverted: true }, 'down', 'positive'],
      [10, 5, { neutral: true }, 'up', 'neutral'],
      [5, 10, { neutral: true }, 'down', 'neutral'],
    ];

    for (const [current, previous, options, direction, tone] of cases) {
      const trend = resolveMetricTrend(current, previous, options);
      assert.equal(trend?.direction, direction, `${current} vs ${previous}`);
      assert.equal(trend?.tone, tone, `${current} vs ${previous}`);
    }
  });

  it('formats percentages without decimals', () => {
    assert.equal(resolveMetricTrend(102, 100, { display: 'percentage' })?.value, '2%');
    assert.equal(resolveMetricTrend(150, 100, { display: 'percentage' })?.value, '50%');
  });

  it('compacts large absolute changes', () => {
    assert.equal(resolveMetricTrend(84_800, 83_600)?.value, '1.2k');
    assert.equal(resolveMetricTrend(9, 4)?.value, '5');
  });

  it('reports a zero percentage when the previous value is zero', () => {
    assert.equal(resolveMetricTrend(25, 0, { display: 'percentage' })?.value, '0%');
  });
});
