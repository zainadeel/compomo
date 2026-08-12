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

function applyContextVariables(
  probe: HTMLElement,
  cssLength: string,
  context: Element,
): Array<{ name: string; value: string; priority: string }> {
  const contextStyle = getComputedStyle(context);
  const pending = [...cssLength.matchAll(/var\(\s*(--[\w-]+)/g)].map(match => match[1]);
  const visited = new Set<string>();
  const previous: Array<{ name: string; value: string; priority: string }> = [];

  while (pending.length > 0) {
    const name = pending.shift();
    if (!name || visited.has(name)) continue;
    visited.add(name);
    const value = contextStyle.getPropertyValue(name).trim();
    if (!value) continue;
    previous.push({
      name,
      value: probe.style.getPropertyValue(name),
      priority: probe.style.getPropertyPriority(name),
    });
    probe.style.setProperty(name, value);
    for (const match of value.matchAll(/var\(\s*(--[\w-]+)/g)) pending.push(match[1]);
  }

  return previous;
}

function restoreProbeVariables(
  probe: HTMLElement,
  previous: Array<{ name: string; value: string; priority: string }>,
): void {
  for (const { name, value, priority } of previous) {
    if (value) probe.style.setProperty(name, value, priority);
    else probe.style.removeProperty(name);
  }
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
  context?: Element,
): number {
  const resolved = value === undefined || value === null || value === '' ? fallback : value;
  if (typeof resolved === 'number') return resolved;

  const trimmed = resolved.trim();
  if (!trimmed) return resolveCssLengthPx(fallback, 0, context);

  // Component-scoped custom properties inherit from their actual composition
  // boundary, not documentElement where the shared measurement probe lives.
  // Resolve a direct var() from that scope first, then measure the resulting
  // token/calc/px value with the normal cached path.
  const scopedProperty = context ? trimmed.match(/^var\(\s*(--[\w-]+)/)?.[1] : undefined;
  if (context && scopedProperty) {
    const scopedValue = getComputedStyle(context).getPropertyValue(scopedProperty).trim();
    if (scopedValue && scopedValue !== trimmed) {
      return resolveCssLengthPx(scopedValue, fallback, context);
    }
  }

  const contextDependent = !!context && trimmed.includes('var(');
  const cached = contextDependent ? undefined : lengthPxCache.get(trimmed);
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

  const previousVariables = context
    ? applyContextVariables(probe, cssLength, context)
    : [];
  probe.style.width = cssLength;
  const px = probe.getBoundingClientRect().width;
  probe.style.width = '';
  restoreProbeVariables(probe, previousVariables);
  // A stylesheet can finish loading after a custom element's first layout
  // pass (notably in WebKit). Do not permanently cache the probe's temporary
  // zero when the length depends on a custom property; a later call must be
  // able to resolve the now-available token.
  if (!contextDependent && (px !== 0 || !cssLength.includes('var('))) {
    lengthPxCache.set(trimmed, px);
  }
  return px;
}
