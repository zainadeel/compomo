import type { ChoicePopupAnchorAlignment } from '../../utils/choice-popup-alignment';
import type { MenuAlign, MenuSide } from './menu-position';

/** Placement props bindable on `ds-menu` (side, align, offsets). */
export interface MenuPlacement {
  side: MenuSide;
  align: MenuAlign;
  anchorAlignment: ChoicePopupAnchorAlignment;
  sideOffset: number | string;
  alignOffset: number | string;
}

/**
 * Canonical `ds-menu` placement for the **panel-nav footer user menu**.
 * Anchor from `dsNavUserAction` detail `{ anchor }` (id `ds-panel-nav-user-menu-anchor`).
 *
 * Not for BarNav overflow menus — those use `side="bottom"` / `align="end"` internally.
 * `align: 'end'` bottom-aligns the last choice cell on the anchor; the side offset nudges into the content area:
 * - `sideOffset` space-100 + space-050 (12px): 4px past the panel-nav outer edge (anchor is ~8px inset).
 * - `anchorAlignment: 'choice-cell'`: the shared section inset puts the last row edge on the footer user row.
 */
export const PANEL_NAV_USER_MENU_PLACEMENT = {
  side: 'right',
  align: 'end',
  anchorAlignment: 'choice-cell',
  sideOffset: 'calc(var(--dimension-space-100) + var(--dimension-space-050))',
  alignOffset: 0,
} as const satisfies MenuPlacement;
