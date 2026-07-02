import type { PanelNavGroup, PanelNavItem } from './panel-nav-types';
import {
  NAV_STYLE_HINT_ATTR,
  clearNavStyleHint,
  readNavStyleAttr,
  resolveNavChromeStyle,
  setNavStyleHint,
  shouldResyncNavChromeStyle,
} from '../../nav/nav-chrome';

export type { NavChromeStyle } from '../../nav/nav-chrome';
export {
  NAV_STYLE_HINT_ATTR,
  readNavStyleAttr,
  setNavStyleHint,
  clearNavStyleHint,
  resolveNavChromeStyle as resolvePanelNavStyle,
  shouldResyncNavChromeStyle as shouldResyncPanelNavStyle,
};

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

/** Resolve whether VT is disabled from prop and/or host attribute. */
export function resolvePanelNavDisableVt(prop: boolean, attr: string | null): boolean {
  if (prop) return true;
  if (attr === null) return false;
  return attr !== 'false';
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
