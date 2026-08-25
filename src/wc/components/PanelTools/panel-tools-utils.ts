import { parseCssTimeMs } from '../../utils/resolve-css-time-ms';
import {
  PANEL_TOOLS_PRIMARY_TOOL_ID,
  PANEL_TOOLS_TOOL_IDS,
  type PanelToolsItem,
  type PanelToolsToolId,
} from './panel-tools-types';

export function orderPanelToolsItems(items: PanelToolsItem[]): PanelToolsItem[] {
  const firstById = new Map<PanelToolsToolId, PanelToolsItem>();
  for (const item of items) {
    if (item.id.trim() && !firstById.has(item.id)) firstById.set(item.id, item);
  }
  const regionOrder = { header: 0, body: 1, footer: 2 } as const;
  return Array.from(firstById.values()).sort((left, right) => {
    const leftRegion = panelToolsRailPlacement(left);
    const rightRegion = panelToolsRailPlacement(right);
    const regionDelta = regionOrder[leftRegion] - regionOrder[rightRegion];
    if (regionDelta !== 0) return regionDelta;

    const leftCanonical = PANEL_TOOLS_TOOL_IDS.findIndex(id => id === left.id);
    const rightCanonical = PANEL_TOOLS_TOOL_IDS.findIndex(id => id === right.id);
    const leftOrder = left.order ?? (leftCanonical < 0 ? Number.MAX_SAFE_INTEGER : leftCanonical);
    const rightOrder =
      right.order ?? (rightCanonical < 0 ? Number.MAX_SAFE_INTEGER : rightCanonical);
    return leftOrder - rightOrder;
  });
}

export function isPanelToolsToolId(value: string | null): value is PanelToolsToolId {
  return typeof value === 'string' && value.trim().length > 0;
}

export function panelToolsRailPlacement(
  item: PanelToolsItem
): 'header' | 'body' | 'footer' {
  if (item.railPlacement) return item.railPlacement;
  if (item.id === PANEL_TOOLS_PRIMARY_TOOL_ID) return 'header';
  if (item.id === 'help') return 'footer';
  return 'body';
}

export function reconcilePanelToolsAvailability(
  items: PanelToolsItem[],
  open: boolean,
  activeTool: PanelToolsToolId | ''
): { open: boolean; activeTool: PanelToolsToolId | ''; removedTool: PanelToolsToolId | '' } {
  if (!activeTool || items.some(item => item.id === activeTool)) {
    return { open, activeTool, removedTool: '' };
  }
  return { open: false, activeTool: '', removedTool: activeTool };
}

export function shouldResyncPanelToolsItems(
  prev: PanelToolsItem[],
  next: PanelToolsItem[]
): boolean {
  if (prev.length !== next.length) return true;
  return next.some((item, index) => {
    const prior = prev[index];
    if (!prior) return true;
    return (
      prior.id !== item.id ||
      prior.icon !== item.icon ||
      prior.label !== item.label ||
      prior.railPlacement !== item.railPlacement ||
      prior.order !== item.order ||
      prior.shortcutKey !== item.shortcutKey ||
      prior.mobileDestination !== item.mobileDestination ||
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

/** True only when the animated clip has reached the terminal width for its motion phase. */
export function panelToolsDrawerAtTerminal(
  width: number,
  targetWidth: number,
  motion: PanelToolsMotion
): boolean {
  if (motion === 'closing') return width <= 0.5;
  if (motion === 'opening') return targetWidth > 0 && width >= targetWidth - 0.5;
  return true;
}

/** Toggle or switch rail tool selection — repeat activation closes the active tool. */
export function resolvePanelToolActivation(
  open: boolean,
  activeTool: PanelToolsToolId | '',
  id: PanelToolsToolId
): { open: boolean; activeTool: PanelToolsToolId; selected: boolean } {
  if (open && activeTool === id) {
    return { open: false, activeTool: id, selected: false };
  }
  return { open: true, activeTool: id, selected: true };
}
