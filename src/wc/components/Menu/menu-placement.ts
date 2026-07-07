import { TOKEN_CSS_LENGTHS } from '../../utils/token-defaults';
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
 * `align: 'end'` bottom-aligns on the anchor; offsets nudge into the content area:
 * - `sideOffset` space-100 + space-050 (12px): 4px past the panel-nav outer edge (anchor is ~8px inset).
 * - `alignOffset` space-050 (4px): 4px below the footer user row.
 */
export const PANEL_NAV_USER_MENU_PLACEMENT = {
  side: 'right',
  align: 'end',
  sideOffset: 'calc(var(--dimension-space-100) + var(--dimension-space-050))',
  alignOffset: TOKEN_CSS_LENGTHS.space050,
} as const satisfies MenuPlacement;
