export const DATE_FILTER_RELATIVE_PRESETS = [
  { label: 'Today', value: 'today', days: 1, offset: 0 },
  { label: 'Yesterday', value: 'yesterday', days: 1, offset: -1 },
  { label: 'Last 7 days', value: 'last-7-days', days: 7, offset: 0 },
  { label: 'Last 14 days', value: 'last-14-days', days: 14, offset: 0 },
  { label: 'Last 30 days', value: 'last-30-days', days: 30, offset: 0 },
  { label: 'Last 60 days', value: 'last-60-days', days: 60, offset: 0 },
  { label: 'Last 90 days', value: 'last-90-days', days: 90, offset: 0 },
] as const;

export type DateFilterRelativePreset = (typeof DATE_FILTER_RELATIVE_PRESETS)[number]['value'];
export type DateFilterRelativeValue = `relative:${DateFilterRelativePreset}`;
export type DateFilterRangeValue = `range:${string}/${string}`;
export type DateFilterValue = DateFilterRelativeValue | DateFilterRangeValue;

export interface DateFilterRange {
  start: string;
  end: string;
}

export type ParsedDateFilterValue =
  | { kind: 'relative'; preset: DateFilterRelativePreset }
  | ({ kind: 'range' } & DateFilterRange);

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const ISO_CALENDAR_DATE_LABEL = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

/** Validate a timezone-free Gregorian day with a four-digit year from 0001 through 9999. */
export function isIsoCalendarDate(value: string): boolean {
  if (typeof value !== 'string' || !ISO_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/** Readable calendar date for filled ISO values such as `2026-09-10` → `Sep 10, 2026`. */
export function formatIsoCalendarDateLabel(value: string): string {
  if (!isIsoCalendarDate(value)) return '';
  return ISO_CALENDAR_DATE_LABEL.formatToParts(new Date(`${value}T00:00:00Z`))
    .map(part => (part.type === 'year' ? part.value.padStart(4, '0') : part.value))
    .join('');
}

const MONTH_LABELS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
];

/** Parse a typed calendar date: ISO, `M/D/YYYY`, or a short-month label such as `Sep 10, 2026`. */
export function parseLooseCalendarDate(value: string): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (isIsoCalendarDate(trimmed)) return trimmed;

  const numeric = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (numeric) {
    const iso = `${numeric[3]}-${numeric[1].padStart(2, '0')}-${numeric[2].padStart(2, '0')}`;
    return isIsoCalendarDate(iso) ? iso : '';
  }

  const labelled = trimmed.match(/^([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})$/);
  if (!labelled) return '';
  const monthIndex = MONTH_LABELS.indexOf(labelled[1].toLowerCase());
  if (monthIndex < 0) return '';
  const iso = `${labelled[3]}-${String(monthIndex + 1).padStart(2, '0')}-${labelled[2].padStart(2, '0')}`;
  return isIsoCalendarDate(iso) ? iso : '';
}

/** Shift whole calendar days in UTC; return an empty value for invalid input or year overflow. */
export function shiftIsoCalendarDate(value: string, days: number): string {
  if (!isIsoCalendarDate(value) || !Number.isSafeInteger(days)) return '';
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  const year = date.getUTCFullYear();
  return year >= 1 && year <= 9999 ? date.toISOString().slice(0, 10) : '';
}

export function dateFilterRelativeValue(preset: DateFilterRelativePreset): DateFilterRelativeValue {
  return `relative:${preset}`;
}

export function dateFilterRangeValue(start: string, end: string = start): DateFilterRangeValue {
  const ordered = start <= end ? [start, end] : [end, start];
  return `range:${ordered[0]}/${ordered[1]}`;
}

export function parseDateFilterValue(value: unknown): ParsedDateFilterValue | null {
  if (typeof value !== 'string' || !value) return null;

  if (value.startsWith('relative:')) {
    const preset = value.slice('relative:'.length) as DateFilterRelativePreset;
    return DATE_FILTER_RELATIVE_PRESETS.some(candidate => candidate.value === preset)
      ? { kind: 'relative', preset }
      : null;
  }

  if (value.startsWith('range:')) {
    const [start, end, ...rest] = value.slice('range:'.length).split('/');
    if (rest.length || !isIsoCalendarDate(start) || !isIsoCalendarDate(end)) return null;
    return start <= end ? { kind: 'range', start, end } : { kind: 'range', start: end, end: start };
  }

  // Preserve the previous single-date contract as a one-day range.
  return isIsoCalendarDate(value) ? { kind: 'range', start: value, end: value } : null;
}

export function normalizeDateFilterValue(value: unknown): DateFilterValue | '' {
  const parsed = parseDateFilterValue(value);
  if (!parsed) return '';
  return parsed.kind === 'relative'
    ? dateFilterRelativeValue(parsed.preset)
    : dateFilterRangeValue(parsed.start, parsed.end);
}

export function resolveDateFilterRange(
  value: unknown,
  referenceDate: string
): DateFilterRange | null {
  if (!isIsoCalendarDate(referenceDate)) return null;
  const parsed = parseDateFilterValue(value);
  if (!parsed) return null;
  if (parsed.kind === 'range') return { start: parsed.start, end: parsed.end };

  const preset = DATE_FILTER_RELATIVE_PRESETS.find(candidate => candidate.value === parsed.preset);
  if (!preset) return null;
  const end = shiftIsoCalendarDate(referenceDate, preset.offset);
  const start = shiftIsoCalendarDate(end, -(preset.days - 1));
  return start && end ? { start, end } : null;
}
