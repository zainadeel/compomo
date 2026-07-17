import assert from 'node:assert/strict';
import test from 'node:test';
import { formatCompactNumber } from '../src/wc/utils/format-compact-number';
import { formatPercentage } from '../src/wc/utils/format-percentage';

test('compact values keep the shared one-decimal unit behavior', () => {
  assert.equal(formatCompactNumber(1_000), '1k');
  assert.equal(formatCompactNumber(1_500), '1.5k');
  assert.equal(formatCompactNumber(110_100), '110.1k');
  assert.equal(formatCompactNumber(1_000_000), '1m');
});

test('percentages render exactly one or two decimal places', () => {
  assert.equal(formatPercentage(0.890709896, 1, 'en-US'), '89.1%');
  assert.equal(formatPercentage(0.890709896, 2, 'en-US'), '89.07%');
  assert.equal(formatPercentage(0, 2, 'en-US'), '0.00%');
});

test('unsupported percentage precision safely falls back to one decimal', () => {
  assert.equal(formatPercentage(0.125, 3 as 1, 'en-US'), '12.5%');
  assert.equal(formatPercentage(Number.NaN, 1, 'en-US'), '0.0%');
});
