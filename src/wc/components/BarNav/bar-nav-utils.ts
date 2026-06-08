import { getSelectableTabs } from '../TabGroup/tab-item-utils';
import type { BarNavActionItem, BarNavTab } from './BarNav';

export interface BarNavUrlState {
  /** Tab id derived from the URL, or empty when none applies. */
  value: string;
  /** When true, tabs should be hidden (e.g. non-tab child routes like detail pages). */
  hideTabs: boolean;
}

/** Derive BarNav tab selection from `currentUrl` relative to `basePath`.
 *  Mirrors motive-webapp-lab `resolveBarNavState` tab-selection semantics. */
export function deriveBarNavValueFromUrl(
  path: string,
  basePath: string,
  tabs: BarNavTab[],
): BarNavUrlState {
  if (!path || !basePath) {
    return { value: '', hideTabs: false };
  }

  if (path !== basePath && !path.startsWith(`${basePath}/`)) {
    return { value: '', hideTabs: false };
  }

  const remainder = path.slice(basePath.length);
  const seg = remainder.startsWith('/') ? remainder.slice(1).split('/')[0] : '';
  const selectableTabs = getSelectableTabs(tabs);

  if (!seg) {
    return { value: selectableTabs[0]?.id ?? '', hideTabs: false };
  }

  const tab = selectableTabs.find(t => t.id === seg);
  if (tab) {
    return { value: tab.id, hideTabs: false };
  }

  return { value: '', hideTabs: true };
}

/** True when host array/json props have data but resolved internal state is still empty. */
export function shouldResyncBarNavProps(
  resolvedTabs: BarNavTab[],
  tabs: BarNavTab[],
  tabsJson: string,
  resolvedActions: BarNavActionItem[],
  actions: BarNavActionItem[],
  actionsJson: string,
): boolean {
  const tabsIncoming = tabsJson
    ? parseJsonArrayProp(tabsJson, [])
    : (tabs ?? []);
  const actionsIncoming = actionsJson
    ? parseJsonArrayProp(actionsJson, [])
    : (actions ?? []);

  return (
    (resolvedTabs.length === 0 && tabsIncoming.length > 0) ||
    (resolvedActions.length === 0 && actionsIncoming.length > 0)
  );
}

/** Parse tabs/actions from either a JSON attribute string or a JS property array. */
export function parseJsonArrayProp<T>(value: string | T[] | undefined, fallback: T[]): T[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value !== '') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}
