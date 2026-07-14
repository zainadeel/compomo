import { parseJsonArrayProp } from '../BarNav/bar-nav-utils';
import { parseCssTimeMs } from '../../utils/resolve-css-time-ms';
import {
  PANEL_TOOLS_TOOL_IDS,
  type PanelToolsItem,
  type PanelToolsToolId,
} from './panel-tools-types';

export function parsePanelToolsItems(
  items: PanelToolsItem[],
  itemsJson: string,
): PanelToolsItem[] {
  if (itemsJson) {
    return parseJsonArrayProp<PanelToolsItem>(itemsJson, []);
  }
  return items ?? [];
}

export function orderPanelToolsItems(items: PanelToolsItem[]): PanelToolsItem[] {
  const firstById = new Map<PanelToolsToolId, PanelToolsItem>();
  for (const item of items) {
    if (!firstById.has(item.id)) firstById.set(item.id, item);
  }
  return PANEL_TOOLS_TOOL_IDS.flatMap(id => {
    const item = firstById.get(id);
    return item ? [item] : [];
  });
}

export function isPanelToolsToolId(value: string | null): value is PanelToolsToolId {
  return value !== null && PANEL_TOOLS_TOOL_IDS.includes(value as PanelToolsToolId);
}

export function reconcilePanelToolsAvailability(
  items: PanelToolsItem[],
  open: boolean,
  activeTool: PanelToolsToolId | '',
): { open: boolean; activeTool: PanelToolsToolId | ''; removedTool: PanelToolsToolId | '' } {
  if (!activeTool || items.some(item => item.id === activeTool)) {
    return { open, activeTool, removedTool: '' };
  }
  return { open: false, activeTool: '', removedTool: activeTool };
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
      prior.isInactive !== item.isInactive ||
      prior.ariaLabel !== item.ariaLabel
    );
  });
}

export type PanelToolsMotion = 'opening' | 'closing' | 'idle';

export interface PanelToolsTransitionStyle {
  transitionProperty: string;
  transitionDuration: string;
  transitionDelay: string;
}

/** Maximum computed time for the drawer's max-width transition, including delay. */
export function panelToolsDrawerTransitionMs(style: PanelToolsTransitionStyle): number {
  const properties = style.transitionProperty.split(',').map(item => item.trim());
  const durations = style.transitionDuration.split(',').map(item => parseCssTimeMs(item.trim(), 0));
  const delays = style.transitionDelay.split(',').map(item => parseCssTimeMs(item.trim(), 0));

  return properties.reduce((max, property, index) => {
    if (property !== 'all' && property !== 'max-width') return max;
    const duration = durations[index % durations.length] ?? 0;
    const delay = delays[index % delays.length] ?? 0;
    return Math.max(max, duration + delay, 0);
  }, 0);
}

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
