/** Visual chrome family for primary/secondary navigation surfaces. */
export type NavChromeStyle = 'navigation' | 'default';

/** `document.documentElement` attribute for pre-bootstrap style hints (SPA hard reload). */
export const NAV_STYLE_HINT_ATTR = 'data-nav-style';

/** Parse `nav-style` from a host or document hint attribute value. */
export function readNavStyleAttr(attr: string | null): NavChromeStyle | undefined {
  if (attr === 'navigation' || attr === 'default') return attr;
  return undefined;
}

/** Set a document-level style hint before nav custom elements upgrade (hard reload). */
export function setNavStyleHint(style: NavChromeStyle): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute(NAV_STYLE_HINT_ATTR, style);
}

export function clearNavStyleHint(): void {
  if (typeof document === 'undefined') return;
  document.documentElement.removeAttribute(NAV_STYLE_HINT_ATTR);
}

/** Resolve initial nav chrome style — host attr, then document hint, then prop default. */
export function resolveNavChromeStyle(
  styleProp: NavChromeStyle,
  styleAttr: string | null,
  documentStyleAttr: string | null = typeof document !== 'undefined'
    ? document.documentElement.getAttribute(NAV_STYLE_HINT_ATTR)
    : null,
): NavChromeStyle {
  return (
    readNavStyleAttr(styleAttr) ??
    readNavStyleAttr(documentStyleAttr) ??
    styleProp
  );
}

/** True when internal rendered surface lags the host `style` prop. */
export function shouldResyncNavChromeStyle(
  renderedStyle: NavChromeStyle,
  style: NavChromeStyle,
): boolean {
  return renderedStyle !== style;
}
