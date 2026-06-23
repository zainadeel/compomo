/** Parse a CSS <time> value (or motion shorthand's first token) to milliseconds. */
export function parseCssTimeMs(value: string, fallback: number): number {
  const firstToken = value.trim().split(/\s+/)[0] ?? '';
  const num = parseFloat(firstToken);
  if (Number.isNaN(num)) return fallback;
  if (/ms\s*$/.test(firstToken)) return num;
  if (/s\s*$/.test(firstToken)) return num * 1000;
  return num;
}

function extractCssCustomProp(ref: string): string | null {
  const varMatch = ref.match(/^var\(\s*(--[^),]+)/);
  if (varMatch) return varMatch[1].trim();
  if (ref.startsWith('--')) return ref.trim();
  return null;
}

function readTokenTimeMs(token: string, fallback: number): number {
  if (typeof document === 'undefined') return fallback;

  const prop = extractCssCustomProp(token);
  if (!prop) return parseCssTimeMs(token, fallback);

  const raw = getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
  return parseCssTimeMs(raw, fallback);
}

/**
 * Resolve a duration to milliseconds for JS timers aligned with CSS motion tokens.
 * Accepts numbers (ms), raw times (`200ms`, `0.75s`), or `var(--effect-*)` references.
 */
export function resolveCssTimeMs(
  value: number | string | undefined,
  fallbackToken: string,
): number {
  if (typeof value === 'number') return value;

  const token = typeof value === 'string' && value.trim() ? value.trim() : fallbackToken;
  const prop = extractCssCustomProp(token);

  if (prop) {
    return readTokenTimeMs(token, readTokenTimeMs(fallbackToken, 200));
  }

  return parseCssTimeMs(token, readTokenTimeMs(fallbackToken, 200));
}
