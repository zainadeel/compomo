/** Nav chrome style slot — dashboard vs settings. Colors unified for now; texture hooks use the class. */
export type NavChromeStyle = 'dashboard' | 'settings';

/** Document hint for first paint before framework props land. */
export const NAV_STYLE_HINT_ATTR = 'data-nav-style';

export function readNavStyleAttr(attr: string | null): NavChromeStyle | undefined {
  if (attr === 'dashboard' || attr === 'settings') return attr;
  return undefined;
}

export function setNavStyleHint(style: NavChromeStyle): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute(NAV_STYLE_HINT_ATTR, style);
}

export function clearNavStyleHint(): void {
  if (typeof document === 'undefined') return;
  document.documentElement.removeAttribute(NAV_STYLE_HINT_ATTR);
}

export function resolveNavChromeStyle(
  styleProp: NavChromeStyle,
  hostAttr: string | null,
  docHint?: string | null,
): NavChromeStyle {
  const fromHost = readNavStyleAttr(hostAttr);
  if (fromHost) return fromHost;

  const hint =
    docHint !== undefined
      ? docHint
      : typeof document !== 'undefined'
        ? document.documentElement.getAttribute(NAV_STYLE_HINT_ATTR)
        : null;
  const fromHint = readNavStyleAttr(hint);
  if (fromHint) return fromHint;

  return styleProp;
}

export function shouldResyncNavChromeStyle(
  renderedStyle: NavChromeStyle,
  style: NavChromeStyle,
): boolean {
  return renderedStyle !== style;
}
