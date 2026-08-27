import { isIsoCalendarDate, shiftIsoCalendarDate } from '../../utils';

export interface FilterMenuCalendarDay {
  value: string;
  day: number;
  inMonth: boolean;
  label: string;
}

export const FILTER_MENU_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

export function filterMenuToday(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function filterMenuCalendarMonth(value: string): string {
  return isIsoCalendarDate(value) ? value.slice(0, 7) : filterMenuToday().slice(0, 7);
}

export function shiftFilterMenuCalendarMonth(value: string, offset: number): string {
  const [year, month] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function filterMenuCalendarMonthLabel(value: string): string {
  const [year, month] = value.split('-').map(Number);
  return MONTH_FORMATTER.format(new Date(Date.UTC(year, month - 1, 1)));
}

export function filterMenuCalendarDays(value: string): FilterMenuCalendarDay[] {
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
