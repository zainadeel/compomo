import { parseJsonArrayProp } from '../BarNav/bar-nav-utils';
import type { PanelToolsItem, PanelToolsToolId } from './panel-tools-types';

export function parsePanelToolsItems(
  items: PanelToolsItem[],
  itemsJson: string,
): PanelToolsItem[] {
  if (itemsJson) {
    return parseJsonArrayProp<PanelToolsItem>(itemsJson, []);
  }
  return items ?? [];
}

export function shouldResyncPanelToolsItems(
  prev: PanelToolsItem[],
  next: PanelToolsItem[],
): boolean {
  if (prev.length !== next.length) return true;
  return next.some((item, index) => {
    const prior = prev[index];
    if (!prior) return true;
    return (
      prior.id !== item.id ||
      prior.icon !== item.icon ||
      prior.selected !== item.selected ||
      prior.dot !== item.dot ||
      prior.inactive !== item.inactive ||
      prior.ariaLabel !== item.ariaLabel
    );
  });
}

export type PanelToolsMotion = 'opening' | 'closing' | 'idle';

/** True when the drawer clip is fully closed — safe to skip painting slot content. */
export function panelToolsDrawerResting(open: boolean, motion: PanelToolsMotion): boolean {
  return !open && motion === 'idle';
}

/** Toggle or switch rail tool selection — repeat activation closes the active tool. */
export function resolvePanelToolActivation(
  open: boolean,
  activeTool: PanelToolsToolId | '',
  id: PanelToolsToolId,
): { open: boolean; activeTool: PanelToolsToolId; selected: boolean } {
  if (open && activeTool === id) {
    return { open: false, activeTool: id, selected: false };
  }
  return { open: true, activeTool: id, selected: true };
}
