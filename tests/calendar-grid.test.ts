import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  calendarDays,
  calendarMonth,
  calendarMonthLabel,
  calendarPaintedRange,
  shiftCalendarMonth,
} from '../src/wc/components/Calendar/calendar-grid';

describe('calendar grid', () => {
  it('builds a six-week month grid anchored to the first weekday', () => {
    const days = calendarDays('2026-09');
    assert.equal(days.length, 42);
    assert.equal(days[0]?.value, '2026-08-30');
    assert.equal(days[0]?.inMonth, false);
    assert.equal(days[2]?.value, '2026-09-01');
    assert.equal(days[2]?.inMonth, true);
    assert.equal(days[31]?.value, '2026-09-30');
    assert.equal(days[32]?.value, '2026-10-01');
    assert.equal(days[32]?.inMonth, false);
  });

  it('shifts months and labels the visible month', () => {
    assert.equal(calendarMonth('2026-09-10'), '2026-09');
    assert.equal(shiftCalendarMonth('2026-01', -1), '2025-12');
    assert.equal(calendarMonthLabel('2026-09'), 'September 2026');
  });

  it('keeps the previous committed range visible while a replacement is pending', () => {
    const previous = { start: '2026-09-08', end: '2026-09-16' };
    const nextStart = { start: '2026-09-18', end: '2026-09-18' };
    assert.deepEqual(calendarPaintedRange('2026-09-18', previous, nextStart), previous);
    assert.equal(calendarPaintedRange('2026-09-18', null, nextStart), null);
    assert.deepEqual(calendarPaintedRange('', previous, nextStart), nextStart);
  });
});
