import { getSelectableTabs } from '../TabGroup/tab-item-utils';
import type { BarNavTab } from './bar-nav-types';

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
  tabs: BarNavTab[]
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

/** True when host array props have data but resolved internal state is still empty. */
export function shouldResyncBarNavProps(resolvedTabs: BarNavTab[], tabs: BarNavTab[]): boolean {
  return resolvedTabs.length === 0 && (tabs?.length ?? 0) > 0;
}
