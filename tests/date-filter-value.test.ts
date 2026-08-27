import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  dateFilterRangeValue,
  normalizeDateFilterValue,
  parseDateFilterValue,
  resolveDateFilterRange,
} from '../src/wc/utils/date-filter-value';

describe('date filter values', () => {
  it('normalizes ordered ranges and the legacy single-date value', () => {
    assert.equal(dateFilterRangeValue('2026-08-26', '2026-08-20'), 'range:2026-08-20/2026-08-26');
    assert.equal(normalizeDateFilterValue('2026-08-26'), 'range:2026-08-26/2026-08-26');
  });

  it('rejects invalid dates and unsupported relative presets', () => {
    assert.equal(parseDateFilterValue('range:2026-02-30/2026-03-01'), null);
    assert.equal(parseDateFilterValue('relative:last-8-days'), null);
  });

  for (const [value, expected] of [
    ['relative:today', { start: '2026-08-26', end: '2026-08-26' }],
    ['relative:yesterday', { start: '2026-08-25', end: '2026-08-25' }],
    ['relative:last-7-days', { start: '2026-08-20', end: '2026-08-26' }],
    ['relative:last-90-days', { start: '2026-05-29', end: '2026-08-26' }],
  ] as const) {
    it(`resolves ${value} from the supplied current date`, () => {
      assert.deepEqual(resolveDateFilterRange(value, '2026-08-26'), expected);
    });
  }
});
