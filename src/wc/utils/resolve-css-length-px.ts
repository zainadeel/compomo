// Only literals are independent of theme, viewport, font, and component scope.
const lengthPxCache = new Map<string, number>();
const probes = new WeakMap<Document, HTMLElement>();
const CACHE_LIMIT = 256;

function literalPixels(value: string): number | undefined {
  const cached = lengthPxCache.get(value);
  if (cached !== undefined) return cached;
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?(?:px)?$/i.test(value)) return undefined;
  const pixels = Number(value.replace(/px$/i, ''));
  if (!Number.isFinite(pixels)) return undefined;
  if (lengthPxCache.size >= CACHE_LIMIT) lengthPxCache.clear();
  lengthPxCache.set(value, pixels);
  return pixels;
}

function getProbeElement(ownerDocument: Document): HTMLElement {
  let probe = probes.get(ownerDocument);
  if (!probe) {
    probe = ownerDocument.createElement('div');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText =
      'all:initial;position:fixed;visibility:hidden;pointer-events:none;top:0;left:0;width:0;height:0;margin:0;padding:0;border:0;overflow:hidden;';
    probes.set(ownerDocument, probe);
  }
  if (!probe.isConnected) ownerDocument.documentElement.appendChild(probe);
  return probe;
}

/** Clear the bounded cache of context-independent numeric and pixel literals. */
export function clearCssLengthPxCache(): void {
  lengthPxCache.clear();
}

/**
 * Resolve a CSS length to pixels for layout math. Dynamic expressions are read
 * from the current document and optional component scope on every call. Relative
 * font units use that scope; percentage lengths use the viewport's inline size.
 */
export function resolveCssLengthPx(
  value: number | string | undefined,
  fallback: number | string,
  context?: Element
): number {
  const resolved = value === undefined || value === null || value === '' ? fallback : value;
  if (typeof resolved === 'number') return Number.isFinite(resolved) ? resolved : 0;

  const trimmed = resolved.trim();
  if (!trimmed) return resolveCssLengthPx(fallback, 0, context);
  const literal = literalPixels(trimmed);
  if (literal !== undefined) return literal;

  const fallbackPixels = typeof fallback === 'number' ? fallback : literalPixels(fallback.trim());
  const safeFallback = Number.isFinite(fallbackPixels) ? (fallbackPixels as number) : 0;
  const ownerDocument =
    context?.ownerDocument ?? (typeof document === 'undefined' ? null : document);
  const view = ownerDocument?.defaultView;
  if (!ownerDocument?.documentElement || !view) return safeFallback;

  const cssLength = /^--[\w-]+$/.test(trimmed) ? `var(${trimmed})` : trimmed;
  if (!view.CSS.supports('left', cssLength)) return safeFallback;
  const scopeStyle = view.getComputedStyle(context ?? ownerDocument.documentElement);
  const directProperty = cssLength.match(/^var\(\s*(--[\w-]+)\s*\)$/)?.[1];
  if (directProperty) {
    const scopedValue = scopeStyle.getPropertyValue(directProperty).trim();
    if (!scopedValue) return safeFallback;
    // Most design tokens are pixel literals; avoid a layout probe on that path.
    const scopedPixels = literalPixels(scopedValue);
    if (scopedPixels !== undefined) return scopedPixels;
  }

  const probe = getProbeElement(ownerDocument);
  const variables = new Set([...cssLength.matchAll(/var\(\s*(--[\w-]+)/g)].map(match => match[1]));
  // Computed custom properties already have their nested var() references
  // substituted. Explicitly unset missing values so root tokens cannot leak
  // into a scope that invalidates them and supplies its own var() fallback.
  for (const name of variables) {
    probe.style.setProperty(name, scopeStyle.getPropertyValue(name).trim() || 'initial');
  }
  probe.style.font = scopeStyle.font;
  probe.style.fontSize = scopeStyle.fontSize;
  probe.style.lineHeight = scopeStyle.lineHeight;
  // An offset accepts negative lengths too, unlike width which clamps them.
  probe.style.left = '';
  probe.style.left = cssLength;
  try {
    if (!probe.style.left) return safeFallback;
    const pixels = parseFloat(view.getComputedStyle(probe).left);
    return Number.isFinite(pixels) ? pixels : safeFallback;
  } finally {
    probe.style.left = '0px';
    for (const name of variables) probe.style.removeProperty(name);
  }
}
