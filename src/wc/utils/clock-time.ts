export type ClockPeriod = 'AM' | 'PM';

export interface ClockTimeParts {
  hour12: number;
  minute: number;
  period: ClockPeriod;
}

export const CLOCK_HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export const CLOCK_PERIODS: readonly ClockPeriod[] = ['AM', 'PM'];

const CLOCK_TIME_PATTERN = /^\d{2}:\d{2}$/;

export function isClockTime(value: string): boolean {
  if (!CLOCK_TIME_PATTERN.test(value)) return false;
  const [hour, minute] = value.split(':').map(Number);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

export function clockMinuteStep(step: string | number = 60): number {
  const seconds = typeof step === 'number' ? step : Number(step);
  if (!Number.isFinite(seconds) || seconds <= 0) return 1;
  if (seconds < 60) return 1;
  return Math.min(30, Math.max(1, Math.round(seconds / 60)));
}

export function clockMinutes(step: number = 1): number[] {
  const stride = Number.isFinite(step) && step > 0 ? Math.min(30, Math.floor(step)) : 1;
  const minutes: number[] = [];
  for (let minute = 0; minute < 60; minute += stride) minutes.push(minute);
  return minutes;
}

export function splitClockTime(value: string): ClockTimeParts | null {
  if (!isClockTime(value)) return null;
  const [hour24, minute] = value.split(':').map(Number);
  const period: ClockPeriod = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { hour12, minute, period };
}

export function joinClockTime(parts: ClockTimeParts): string {
  const hour24 =
    parts.period === 'AM'
      ? parts.hour12 === 12
        ? 0
        : parts.hour12
      : parts.hour12 === 12
        ? 12
        : parts.hour12 + 12;
  return `${String(hour24).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
}

/** Readable 12-hour label for filled clock values such as `09:00` → `9:00 AM`. */
export function formatClockTimeLabel(value: string): string {
  const parts = splitClockTime(value);
  if (!parts) return '';
  return `${parts.hour12}:${String(parts.minute).padStart(2, '0')} ${parts.period}`;
}

/** Parse a typed clock time: `HH:MM`, `H:MM`, or a 12-hour label such as `9:00 AM`. */
export function parseLooseClockTime(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (isClockTime(trimmed)) return trimmed;

  const twentyFour = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFour) {
    const hour = Number(twentyFour[1]);
    const minute = Number(twentyFour[2]);
    if (hour > 23 || minute > 59) return '';
    return `${String(hour).padStart(2, '0')}:${twentyFour[2]}`;
  }

  const meridiem = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*([AaPp])\.?[Mm]\.?$/);
  if (!meridiem) return '';
  const hour12 = Number(meridiem[1]);
  const minute = meridiem[2] ? Number(meridiem[2]) : 0;
  if (hour12 < 1 || hour12 > 12 || minute > 59) return '';
  const period: ClockPeriod = meridiem[3].toUpperCase() === 'P' ? 'PM' : 'AM';
  return joinClockTime({ hour12, minute, period });
}

export function isClockTimeOutOfRange(value: string, min?: string, max?: string): boolean {
  if (!isClockTime(value)) return true;
  if (min && isClockTime(min) && value < min) return true;
  if (max && isClockTime(max) && value > max) return true;
  return false;
}

/** Move within a finite list without wrapping past the first or last item. */
export function stepBoundedIndex(index: number, offset: number, length: number): number {
  if (length <= 0) return 0;
  return Math.min(length - 1, Math.max(0, index + offset));
}
