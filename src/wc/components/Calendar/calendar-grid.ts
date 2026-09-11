import { isIsoCalendarDate, shiftIsoCalendarDate } from '../../utils';

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
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calendarMonth(value: string): string {
  return isIsoCalendarDate(value) ? value.slice(0, 7) : calendarToday().slice(0, 7);
}

export function shiftCalendarMonth(value: string, offset: number): string {
  const [year, month] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function calendarMonthLabel(value: string): string {
  const [year, month] = value.split('-').map(Number);
  return MONTH_FORMATTER.format(new Date(Date.UTC(year, month - 1, 1)));
}

export function calendarDays(value: string): CalendarDay[] {
  const [year, month] = value.split('-').map(Number);
  const firstOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
  const firstWeekday = new Date(`${firstOfMonth}T00:00:00Z`).getUTCDay();
  const gridStart = shiftIsoCalendarDate(firstOfMonth, -firstWeekday);
  return Array.from({ length: 42 }, (_, index) => {
    const dateValue = shiftIsoCalendarDate(gridStart, index);
    const date = new Date(`${dateValue}T00:00:00Z`);
    return {
      value: dateValue,
      day: date.getUTCDate(),
      inMonth: dateValue.startsWith(`${value}-`),
      label: DATE_FORMATTER.format(date),
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
