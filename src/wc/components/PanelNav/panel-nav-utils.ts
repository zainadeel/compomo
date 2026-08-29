import type { PanelNavChildItem, PanelNavGroup, PanelNavItem } from './panel-nav-types';
import { parseCssTimeMs } from '../../utils/resolve-css-time-ms';
import {
  NAV_STYLE_HINT_ATTR,
  clearNavStyleHint,
  readNavStyleAttr,
  resolveNavChromeStyle,
  setNavStyleHint,
  shouldResyncNavChromeStyle,
} from '../../shell/nav-chrome';

export type { NavChromeStyle } from '../../shell/nav-chrome';
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

export interface PanelNavSelection {
  parentId: string;
  childId: string;
}

/** First child that can receive navigation intent. */
export function firstEnabledPanelNavChild(
  children: PanelNavChildItem[] | undefined
): PanelNavChildItem | undefined {
  return children?.find(child => !child.isInactive);
}

/** Derive active parent and child ids using longest segment-boundary URL matching. */
export function derivePanelNavSelectionFromUrl(
  path: string,
  items: PanelNavItem[]
): PanelNavSelection {
  if (!path) return { parentId: '', childId: '' };

  let bestParentId = '';
  let bestChildId = '';
  let bestLen = 0;

  for (const item of items) {
    const children = item.children ?? [];
    for (const child of children) {
      if (!child.href) continue;
      if (hrefMatchesPath(path, child.href) && child.href.length > bestLen) {
        bestParentId = item.id;
        bestChildId = child.id;
        bestLen = child.href.length;
      }
    }

    if (children.length === 0 && item.href) {
      if (hrefMatchesPath(path, item.href) && item.href.length > bestLen) {
        bestParentId = item.id;
        bestChildId = '';
        bestLen = item.href.length;
      }
    }
  }

  return { parentId: bestParentId, childId: bestChildId };
}

/** Derive the active top-level nav item id from a URL. */
export function deriveActiveIdFromUrl(path: string, items: PanelNavItem[]): string {
  return derivePanelNavSelectionFromUrl(path, items).parentId;
}

/** Total nav item count across all groups. */
export function countPanelNavItems(groups: PanelNavGroup[]): number {
  return groups.reduce((sum, g) => sum + g.items.length, 0);
}

/** Resolve a user toggle without mutating the persisted desktop preference while breakpoint-locked. */
export function resolvePanelNavToggle(collapsed: boolean, viewportNarrow: boolean): boolean | null {
  return viewportNarrow ? null : !collapsed;
}

export interface PanelNavTransitionStyle {
  transitionProperty: string;
  transitionDuration: string;
  transitionDelay: string;
}

function parseCssTimeList(value: string): number[] {
  return value.split(',').map(item => parseCssTimeMs(item.trim(), 0));
}

/**
 * Maximum computed time for PanelNav's width transition. CSS repeats shorter
 * duration/delay lists to match the property list, so mirror that behavior.
 */
export function panelNavWidthTransitionMs(style: PanelNavTransitionStyle): number {
  const properties = style.transitionProperty.split(',').map(item => item.trim());
  const durations = parseCssTimeList(style.transitionDuration);
  const delays = parseCssTimeList(style.transitionDelay);

  return properties.reduce((max, property, index) => {
    if (property !== 'all' && property !== 'width' && property !== 'min-width') return max;
    const duration = durations[index % durations.length] ?? 0;
    const delay = delays[index % delays.length] ?? 0;
    return Math.max(max, duration + delay, 0);
  }, 0);
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
  groups: string | unknown
): boolean {
  return (
    countPanelNavItems(parsedGroups) === 0 && countPanelNavItems(parsePanelNavGroups(groups)) > 0
  );
}
