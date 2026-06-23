const lengthPxCache = new Map<string, number>();

let probeEl: HTMLElement | null = null;

function getProbeElement(): HTMLElement | null {
  if (typeof document === 'undefined') return null;

  if (!probeEl) {
    probeEl = document.createElement('div');
    probeEl.setAttribute('aria-hidden', 'true');
    probeEl.style.cssText =
      'position:absolute;visibility:hidden;pointer-events:none;top:0;left:0;width:0;height:0;overflow:hidden;';
    document.documentElement.appendChild(probeEl);
  }

  return probeEl;
}

/** Clear session cache (tests only). */
export function clearCssLengthPxCache(): void {
  lengthPxCache.clear();
}

/**
 * Resolve a CSS length to pixels for layout math.
 * Numbers pass through; `var(--dimension-*)`, `calc(...)`, and `16px` resolve via a hidden probe.
 */
export function resolveCssLengthPx(
  value: number | string | undefined,
  fallback: number | string,
): number {
  const resolved = value === undefined || value === null || value === '' ? fallback : value;
  if (typeof resolved === 'number') return resolved;

  const trimmed = resolved.trim();
  if (!trimmed) return resolveCssLengthPx(fallback, 0);

  const cached = lengthPxCache.get(trimmed);
  if (cached !== undefined) return cached;

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    const n = Number(trimmed);
    lengthPxCache.set(trimmed, n);
    return n;
  }

  const pxMatch = trimmed.match(/^(-?\d+(\.\d+)?)px$/);
  if (pxMatch) {
    const px = parseFloat(pxMatch[1]);
    lengthPxCache.set(trimmed, px);
    return px;
  }

  const probe = getProbeElement();
  if (!probe) {
    return typeof fallback === 'number' ? fallback : 0;
  }

  probe.style.width = trimmed;
  const px = probe.getBoundingClientRect().width;
  probe.style.width = '';
  lengthPxCache.set(trimmed, px);
  return px;
}
