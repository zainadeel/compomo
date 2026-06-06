import type { PanelNavGroup, PanelNavItem, PanelNavVariant } from './PanelNav';

/** Whether `path` matches `href` at a segment boundary (exact or child path). */
export function hrefMatchesPath(path: string, href: string): boolean {
  return path === href || path.startsWith(`${href}/`);
}

/** Derive the active nav item id from a URL using longest segment-boundary prefix match. */
export function deriveActiveIdFromUrl(path: string, items: PanelNavItem[]): string {
  if (!path) return '';

  let bestId = '';
  let bestLen = 0;

  for (const item of items) {
    if (!item.href) continue;
    if (hrefMatchesPath(path, item.href) && item.href.length > bestLen) {
      bestId = item.id;
      bestLen = item.href.length;
    }
  }

  return bestId;
}

/** Total nav item count across all groups. */
export function countPanelNavItems(groups: PanelNavGroup[]): number {
  return groups.reduce((sum, g) => sum + g.items.length, 0);
}

/** Parse `groups` from either a JSON attribute string or a JS property array. */
export function parsePanelNavGroups(groups: string | unknown): PanelNavGroup[] {
  if (Array.isArray(groups)) return groups;
  if (typeof groups === 'string') {
    try {
      const parsed = JSON.parse(groups);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** `document.documentElement` attribute for pre-bootstrap variant hints (SPA hard reload). */
export const PANEL_NAV_VARIANT_HINT_ATTR = 'data-panel-nav-variant';

/** Parse `variant` from a host attribute value. */
export function readPanelNavVariantAttr(attr: string | null): PanelNavVariant | undefined {
  if (attr === 'settings' || attr === 'dashboard') return attr;
  return undefined;
}

/** Set a document-level variant hint before the custom element upgrades (hard reload). */
export function setPanelNavVariantHint(variant: PanelNavVariant): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute(PANEL_NAV_VARIANT_HINT_ATTR, variant);
}

export function clearPanelNavVariantHint(): void {
  if (typeof document === 'undefined') return;
  document.documentElement.removeAttribute(PANEL_NAV_VARIANT_HINT_ATTR);
}

/** Resolve initial variant — host attr, then document hint, then prop default. */
export function resolvePanelNavVariant(
  variantProp: PanelNavVariant,
  variantAttr: string | null,
  documentVariantAttr: string | null = typeof document !== 'undefined'
    ? document.documentElement.getAttribute(PANEL_NAV_VARIANT_HINT_ATTR)
    : null,
): PanelNavVariant {
  return (
    readPanelNavVariantAttr(variantAttr) ??
    readPanelNavVariantAttr(documentVariantAttr) ??
    variantProp
  );
}

/** Resolve whether VT is disabled from prop and/or host attribute. */
export function resolvePanelNavDisableVt(prop: boolean, attr: string | null): boolean {
  if (prop) return true;
  if (attr === null) return false;
  return attr !== 'false';
}

/** True when internal rendered surface lags the host `variant` prop. */
export function shouldResyncPanelNavVariant(
  renderedVariant: PanelNavVariant,
  variant: PanelNavVariant,
): boolean {
  return renderedVariant !== variant;
}

/** True when host `groups` has items but internal parsed state is still empty. */
export function shouldResyncPanelNavGroups(
  parsedGroups: PanelNavGroup[],
  groups: string | unknown,
): boolean {
  return (
    countPanelNavItems(parsedGroups) === 0 &&
    countPanelNavItems(parsePanelNavGroups(groups)) > 0
  );
}

let vtStyleInjected = false;

/** Inject view-transition suppress styles once per document (shared by PanelNav + hosts). */
export function ensurePanelNavVtStyle(): void {
  if (vtStyleInjected) return;
  const id = 'ds-panel-nav-vt-style';
  if (document.getElementById(id)) {
    vtStyleInjected = true;
    return;
  }
  const style = document.createElement('style');
  style.id = id;
  style.textContent = [
    '::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal}',
    '::view-transition-new(root){clip-path:circle(0px at var(--vt-x,50%) var(--vt-y,50%))}',
  ].join('\n');
  document.head.appendChild(style);
  vtStyleInjected = true;
}
