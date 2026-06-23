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

/** Stable `id` on the footer user button — use with `ds-menu` `anchor-id`. */
export const PANEL_NAV_USER_MENU_ANCHOR_ID = 'ds-panel-nav-user-menu-anchor';

/** Detail for `dsNavUserAction` — anchor element for an external `ds-menu`. */
export interface PanelNavUserActionDetail {
  anchor: HTMLElement;
}
