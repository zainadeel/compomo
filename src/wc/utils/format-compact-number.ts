const COMPACT_UNITS: { threshold: number; suffix: string }[] = [
  { threshold: 1_000_000_000, suffix: 'b' },
  { threshold: 1_000_000, suffix: 'm' },
  { threshold: 1_000, suffix: 'k' },
];

/** Compact large numbers for display: 1000 -> "1k", 1500 -> "1.5k", 110100 -> "110.1k", 1000000 -> "1m". */
export function formatCompactNumber(value: number, locale?: string): string {
  if (locale) {
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(value);
  }
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs < 1000) return String(value);

  for (let i = 0; i < COMPACT_UNITS.length; i++) {
    const unit = COMPACT_UNITS[i];
    if (abs < unit.threshold) continue;

    let scaled = Math.round((abs / unit.threshold) * 10) / 10;
    // Carry over, e.g. 999.96k rounds to "1000k" — bump to the next unit instead.
    if (scaled >= 1000 && i > 0) {
      const next = COMPACT_UNITS[i - 1];
      scaled = Math.round((abs / next.threshold) * 10) / 10;
      return `${sign}${scaled}${next.suffix}`;
    }
    return `${sign}${scaled}${unit.suffix}`;
  }
  return String(value);
}
