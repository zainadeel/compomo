import type { NavChromeStyle } from '../../nav/nav-chrome';

export type { NavChromeStyle };
export type PanelNavRouterMode = 'anchor' | 'event';

export interface PanelNavItem {
  id: string;
  icon: string;
  label: string;
  /** Show a notification dot badge on the item */
  dot?: boolean;
  flag?: boolean;
  /** Route path used for `currentUrl` matching. In `anchor` mode also sets `<a href>`.
   *  In `event` mode navigation is delegated to the host via `dsNavSelect`. */
  href?: string;
}

export interface PanelNavGroup {
  id?: string;
  label?: string;
  items: PanelNavItem[];
}
