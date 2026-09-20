import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import {
  isIsoCalendarDate,
  shiftIsoCalendarDate,
  formatIsoCalendarDateLabel,
  parseLooseCalendarDate,
  resolveDateFilterRange,
} from '../src/wc/utils/date-filter-value';
import {
  calendarDays,
  shiftCalendarMonth,
  calendarMonthLabel,
} from '../src/wc/components/Calendar/calendar-grid';
import {
  clockMinutes,
  isClockTime,
  joinClockTime,
  parseLooseClockTime,
} from '../src/wc/utils/clock-time';

test('calendar dates preserve early years and Gregorian leap rules', () => {
  for (const value of [
    '0001-01-01',
    '0096-02-29',
    '0099-12-31',
    '0100-01-01',
    '2000-02-29',
    '9999-12-31',
  ]) {
    assert.equal(isIsoCalendarDate(value), true, value);
    assert.equal(parseLooseCalendarDate(formatIsoCalendarDateLabel(value)), value);
    assert.equal(shiftIsoCalendarDate(value, 0), value);
  }
  for (const value of ['0000-01-01', '0100-02-29', '1900-02-29', '2026-13-01', '2026-02-30'])
    assert.equal(isIsoCalendarDate(value), false, value);
  assert.equal(shiftIsoCalendarDate('0099-12-31', 1), '0100-01-01');
  assert.equal(shiftCalendarMonth('0099-12', 1), '0100-01');
});

test('calendar arithmetic fails closed at representable boundaries and malformed input', () => {
  assert.equal(shiftIsoCalendarDate('0001-01-01', -1), '');
  assert.equal(shiftIsoCalendarDate('9999-12-31', 1), '');
  assert.equal(shiftCalendarMonth('0001-01', -1), '');
  assert.equal(shiftCalendarMonth('9999-12', 1), '');
  for (const offset of [NaN, Infinity, -Infinity, 0.5, Number.MAX_SAFE_INTEGER]) {
    assert.equal(shiftIsoCalendarDate('2026-09-10', offset), '');
    assert.equal(shiftCalendarMonth('2026-09', offset), '');
  }
  assert.equal(resolveDateFilterRange('relative:last-7-days', '0001-01-01'), null);
  for (const value of [null, undefined, {}, 42] as unknown as string[]) {
    assert.equal(isIsoCalendarDate(value), false);
    assert.equal(parseLooseCalendarDate(value), '');
    assert.equal(isClockTime(value), false);
    assert.equal(parseLooseClockTime(value), '');
  }
  assert.equal(calendarMonthLabel('2026-13'), '');
  assert.deepEqual(calendarDays('invalid'), []);
});

test('boundary month grids retain six weeks and mark unsupported dates unavailable', () => {
  for (const month of ['0001-01', '0099-12', '9999-12']) {
    const days = calendarDays(month);
    assert.equal(days.length, 42);
    assert.equal(days.filter(day => day.inMonth).length, 31);
    for (const day of days) {
      assert.ok(Number.isInteger(day.day) && day.day > 0 && day.day <= 31);
      if (day.value) assert.equal(isIsoCalendarDate(day.value), true);
      else {
        assert.equal(day.inMonth, false);
        assert.equal(day.label, 'Unavailable date');
      }
    }
  }
});

test('calendar arithmetic ignores host timezone and DST transitions', () => {
  for (const TZ of ['America/Los_Angeles', 'Pacific/Kiritimati']) {
    const child = spawnSync(
      process.execPath,
      [
        '--import',
        'tsx/esm',
        '--input-type=module',
        '-e',
        `
      import {shiftIsoCalendarDate, formatIsoCalendarDateLabel} from './src/wc/utils/date-filter-value.ts';
      console.log(JSON.stringify([shiftIsoCalendarDate('2026-03-08', 1),shiftIsoCalendarDate('2026-11-01', 1),formatIsoCalendarDateLabel('0099-01-01')]));
    `,
      ],
      { env: { ...process.env, TZ }, encoding: 'utf8', timeout: 10000 }
    );
    assert.equal(child.status, 0, child.stderr);
    assert.deepEqual(JSON.parse(child.stdout), ['2026-03-09', '2026-11-02', 'Jan 1, 0099']);
  }
});

test('fractional minute strides terminate and invalid clock parts fail closed', () => {
  // Isolate the historical zero-stride infinite loop so a regression times out this child.
  const child = spawnSync(
    process.execPath,
    [
      '--import',
      'tsx/esm',
      '--input-type=module',
      '-e',
      `
    import {clockMinutes} from './src/wc/utils/clock-time.ts';
    console.log(JSON.stringify(clockMinutes(0.5)));
  `,
    ],
    { encoding: 'utf8', timeout: 10000 }
  );
  assert.equal(child.status, 0, child.stderr);
  assert.deepEqual(
    JSON.parse(child.stdout),
    Array.from({ length: 60 }, (_, i) => i)
  );
  for (const base of [NaN, Infinity, -Infinity])
    assert.deepEqual(clockMinutes(15, base), [0, 15, 30, 45]);
  assert.equal(joinClockTime({ hour12: 13, minute: 0, period: 'AM' }), '');
  assert.equal(joinClockTime({ hour12: 1, minute: NaN, period: 'AM' }), '');
  assert.equal(joinClockTime({ hour12: 1, minute: 30, period: 'XX' as 'AM' }), '');
});
