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

export function isIsoCalendarDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export function shiftIsoCalendarDate(value: string, days: number): string {
  if (!isIsoCalendarDate(value)) return '';
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
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
  return { start: shiftIsoCalendarDate(end, -(preset.days - 1)), end };
}
