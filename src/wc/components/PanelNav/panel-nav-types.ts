import type { MenuPlacement } from '../Menu/menu-placement';
import { PANEL_NAV_USER_MENU_PLACEMENT } from '../Menu/menu-placement';
import type { NavChromeStyle } from '../../shell/nav-chrome';

export type { NavChromeStyle };
export type PanelNavRouterMode = 'anchor' | 'event';

export interface PanelNavItem {
  id: string;
  icon: string;
  label: string;
  /** Show a notification dot badge on the item */
  dot?: boolean;
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
  /** Recommended `ds-menu` placement — spread onto external user menu instance. */
  menuPlacement: MenuPlacement;
}

export { PANEL_NAV_USER_MENU_PLACEMENT };
