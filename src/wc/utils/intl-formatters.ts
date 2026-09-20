/** Internal, bounded formatter reuse. Omitted/invalid locales use the English product default. */
const DEFAULT_LOCALE = 'en-US';
const CACHE_LIMIT = 32;
const locales = new Map<string, string>();
const numbers = new Map<string, Intl.NumberFormat>();
const dates = new Map<string, Intl.DateTimeFormat>();

function remember<T>(cache: Map<string, T>, key: string, value: T): T {
  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value!);
  cache.set(key, value);
  return value;
}

export function resolveFormatLocale(locale?: string): string {
  if (typeof locale !== 'string' || !locale.trim()) return DEFAULT_LOCALE;
  const key = locale.trim();
  const cached = locales.get(key);
  if (cached) return cached;
  let resolved = DEFAULT_LOCALE;
  try {
    resolved = Intl.NumberFormat.supportedLocalesOf(key)[0] ?? DEFAULT_LOCALE;
  } catch {
    // Invalid application input must not prevent a component from rendering.
  }
  return remember(locales, key, resolved);
}

function keyFor(locale: string, options: object): string {
  return JSON.stringify([locale, Object.entries(options).sort(([a], [b]) => a.localeCompare(b))]);
}

export function numberFormatter(
  locale?: string,
  options: Intl.NumberFormatOptions = {}
): Intl.NumberFormat {
  const resolved = resolveFormatLocale(locale);
  const key = keyFor(resolved, options);
  return numbers.get(key) ?? remember(numbers, key, new Intl.NumberFormat(resolved, options));
}

export function dateFormatter(
  locale?: string,
  options: Intl.DateTimeFormatOptions = {}
): Intl.DateTimeFormat {
  const resolved = resolveFormatLocale(locale);
  const key = keyFor(resolved, options);
  return dates.get(key) ?? remember(dates, key, new Intl.DateTimeFormat(resolved, options));
}
