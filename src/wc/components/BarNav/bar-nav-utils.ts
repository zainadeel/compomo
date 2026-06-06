import type { BarNavTab } from './BarNav';

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

  if (!seg) {
    return { value: tabs[0]?.id ?? '', hideTabs: false };
  }

  const tab = tabs.find(t => t.id === seg);
  if (tab) {
    return { value: tab.id, hideTabs: false };
  }

  return { value: '', hideTabs: true };
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
