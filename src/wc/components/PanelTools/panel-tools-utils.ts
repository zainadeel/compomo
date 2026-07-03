import { parseJsonArrayProp } from '../BarNav/bar-nav-utils';
import type { PanelToolsItem } from './panel-tools-types';

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
