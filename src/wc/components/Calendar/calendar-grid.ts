import { isIsoCalendarDate } from '../../utils';

export interface CalendarDateRange {
  start: string;
  end: string;
}

export interface CalendarDay {
  value: string;
  day: number;
  inMonth: boolean;
  label: string;
}

export const CALENDAR_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

export function calendarToday(): string {
  const today = new Date();
  const year = String(today.getFullYear()).padStart(4, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calendarMonth(value: string): string {
  return isIsoCalendarDate(value) ? value.slice(0, 7) : calendarToday().slice(0, 7);
}

export function shiftCalendarMonth(value: string, offset: number): string {
  if (!isIsoCalendarDate(`${value}-01`) || !Number.isSafeInteger(offset)) return '';
  const date = new Date(`${value}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  const year = date.getUTCFullYear();
  return year >= 1 && year <= 9999 ? date.toISOString().slice(0, 7) : '';
}

export function calendarMonthLabel(value: string): string {
  if (!isIsoCalendarDate(`${value}-01`)) return '';
  return MONTH_FORMATTER.format(new Date(`${value}-01T00:00:00Z`));
}

export function calendarDays(value: string): CalendarDay[] {
  if (!isIsoCalendarDate(`${value}-01`)) return [];
  const first = new Date(`${value}-01T00:00:00Z`);
  const firstWeekday = first.getUTCDay();
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(first);
    date.setUTCDate(1 - firstWeekday + index);
    const year = date.getUTCFullYear();
    const dateValue = year >= 1 && year <= 9999 ? date.toISOString().slice(0, 10) : '';
    return {
      value: dateValue,
      day: date.getUTCDate(),
      inMonth: dateValue.startsWith(`${value}-`),
      label: dateValue ? DATE_FORMATTER.format(date) : 'Unavailable date',
    };
  });
}

/** Keep the previous committed range visible while a replacement range is being chosen. */
export function calendarPaintedRange(
  pendingStart: string,
  heldRange: CalendarDateRange | null,
  valueRange: CalendarDateRange | null
): CalendarDateRange | null {
  return pendingStart ? heldRange : valueRange;
}
