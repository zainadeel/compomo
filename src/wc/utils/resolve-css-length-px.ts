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

  const cssLength = /^--[\w-]+$/.test(trimmed) ? `var(${trimmed})` : trimmed;

  const probe = getProbeElement();
  if (!probe) {
    return typeof fallback === 'number' ? fallback : 0;
  }

  probe.style.width = cssLength;
  const px = probe.getBoundingClientRect().width;
  probe.style.width = '';
  // A stylesheet can finish loading after a custom element's first layout
  // pass (notably in WebKit). Do not permanently cache the probe's temporary
  // zero when the length depends on a custom property; a later call must be
  // able to resolve the now-available token.
  if (px !== 0 || !cssLength.includes('var(')) {
    lengthPxCache.set(trimmed, px);
  }
  return px;
}
