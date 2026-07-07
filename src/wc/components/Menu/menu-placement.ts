import { TOKEN_DEFAULTS } from '../../utils';
import type { MenuAlign, MenuSide } from './menu-position';

/** Placement props bindable on `ds-menu` (side, align, offsets). */
export interface MenuPlacement {
  side: MenuSide;
  align: MenuAlign;
  sideOffset: number | string;
  alignOffset: number | string;
}

/**
 * Canonical `ds-menu` placement for the **panel-nav footer user menu**.
 * Anchor from `dsNavUserAction` detail `{ anchor }` (id `ds-panel-nav-user-menu-anchor`).
 *
 * Not for BarNav overflow menus — those use `side="bottom"` / `align="end"` internally.
 */
export const PANEL_NAV_USER_MENU_PLACEMENT = {
  side: 'right',
  align: 'start',
  sideOffset: TOKEN_DEFAULTS.space050,
  alignOffset: 0,
} as const satisfies MenuPlacement;
