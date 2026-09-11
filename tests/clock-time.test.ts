import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  clockMinuteStep,
  clockMinutes,
  formatClockTimeLabel,
  isClockTime,
  isClockTimeOutOfRange,
  joinClockTime,
  parseLooseClockTime,
  splitClockTime,
  stepBoundedIndex,
} from '../src/wc/utils/clock-time';

describe('clock time values', () => {
  it('splits and joins 12-hour parts without wrapping the clock', () => {
    assert.deepEqual(splitClockTime('00:00'), { hour12: 12, minute: 0, period: 'AM' });
    assert.deepEqual(splitClockTime('09:05'), { hour12: 9, minute: 5, period: 'AM' });
    assert.deepEqual(splitClockTime('12:00'), { hour12: 12, minute: 0, period: 'PM' });
    assert.deepEqual(splitClockTime('13:59'), { hour12: 1, minute: 59, period: 'PM' });
    assert.equal(joinClockTime({ hour12: 12, minute: 0, period: 'AM' }), '00:00');
    assert.equal(joinClockTime({ hour12: 9, minute: 0, period: 'AM' }), '09:00');
    assert.equal(joinClockTime({ hour12: 12, minute: 0, period: 'PM' }), '12:00');
    assert.equal(joinClockTime({ hour12: 1, minute: 5, period: 'PM' }), '13:05');
  });

  it('formats valid clock times as 12-hour labels', () => {
    assert.equal(formatClockTimeLabel('09:00'), '9:00 AM');
    assert.equal(formatClockTimeLabel('00:00'), '12:00 AM');
    assert.equal(formatClockTimeLabel('12:30'), '12:30 PM');
    assert.equal(formatClockTimeLabel('13:05'), '1:05 PM');
    assert.equal(formatClockTimeLabel('24:00'), '');
    assert.equal(formatClockTimeLabel(''), '');
  });

  it('parses typed 24-hour and 12-hour clock times', () => {
    assert.equal(parseLooseClockTime('09:00'), '09:00');
    assert.equal(parseLooseClockTime('9:00'), '09:00');
    assert.equal(parseLooseClockTime('9:00 AM'), '09:00');
    assert.equal(parseLooseClockTime('9 AM'), '09:00');
    assert.equal(parseLooseClockTime('12:00 pm'), '12:00');
    assert.equal(parseLooseClockTime('12:00 AM'), '00:00');
    assert.equal(parseLooseClockTime('1:05 PM'), '13:05');
    assert.equal(parseLooseClockTime('25:00'), '');
    assert.equal(parseLooseClockTime('not a time'), '');
    assert.equal(isClockTime('09:00'), true);
    assert.equal(isClockTime('9:00'), false);
  });

  it('keeps minute lists and keyboard movement inside inclusive bounds', () => {
    assert.deepEqual(clockMinutes(clockMinuteStep(60)).slice(0, 3), [0, 1, 2]);
    assert.deepEqual(
      clockMinutes(clockMinuteStep(300)),
      [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
    );
    assert.equal(stepBoundedIndex(0, -1, 12), 0);
    assert.equal(stepBoundedIndex(11, 1, 12), 11);
    assert.equal(stepBoundedIndex(0, 1, 12), 1);
    assert.equal(isClockTimeOutOfRange('09:00', '09:00', '17:00'), false);
    assert.equal(isClockTimeOutOfRange('08:59', '09:00', '17:00'), true);
    assert.equal(isClockTimeOutOfRange('17:01', '09:00', '17:00'), true);
  });
});
