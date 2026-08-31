import { parseCssTimeMs } from '../../utils/resolve-css-time-ms';
import {
  PANEL_TOOLS_PRIMARY_TOOL_ID,
  PANEL_TOOLS_TOOL_IDS,
  type PanelToolsItem,
  type PanelToolsRailAccessory,
  type PanelToolsRailAccessoryActionDetail,
  type PanelToolsRailPlacement,
  type PanelToolsToolId,
} from './panel-tools-types';

const PANEL_TOOLS_REGION_ORDER: Record<PanelToolsRailPlacement, number> = {
  header: 0,
  body: 1,
  footer: 2,
};

function panelToolsItemOrder(item: PanelToolsItem): number {
  const canonical = PANEL_TOOLS_TOOL_IDS.findIndex(id => id === item.id);
  return item.order ?? (canonical < 0 ? Number.MAX_SAFE_INTEGER : canonical);
}

export function orderPanelToolsItems(items: PanelToolsItem[]): PanelToolsItem[] {
  const firstById = new Map<PanelToolsToolId, PanelToolsItem>();
  for (const item of items) {
    if (item.id.trim() && !firstById.has(item.id)) firstById.set(item.id, item);
  }
  return Array.from(firstById.values()).sort((left, right) => {
    const leftRegion = panelToolsRailPlacement(left);
    const rightRegion = panelToolsRailPlacement(right);
    const regionDelta =
      PANEL_TOOLS_REGION_ORDER[leftRegion] - PANEL_TOOLS_REGION_ORDER[rightRegion];
    if (regionDelta !== 0) return regionDelta;

    return panelToolsItemOrder(left) - panelToolsItemOrder(right);
  });
}

export type PanelToolsRailEntry =
  | { type: 'tool'; id: string; item: PanelToolsItem }
  | { type: 'accessory'; id: string; accessory: PanelToolsRailAccessory };

/** Merge tools and governed accessories into one visual and keyboard order. */
export function orderPanelToolsRailEntries(
  items: PanelToolsItem[],
  accessories: PanelToolsRailAccessory[]
): PanelToolsRailEntry[] {
  const toolEntries: PanelToolsRailEntry[] = orderPanelToolsItems(items).map(item => ({
    type: 'tool',
    id: item.id,
    item,
  }));
  const firstAccessoryById = new Map<string, PanelToolsRailAccessory>();
  for (const accessory of accessories) {
    if (accessory.id.trim() && !firstAccessoryById.has(accessory.id)) {
      firstAccessoryById.set(accessory.id, accessory);
    }
  }
  const accessoryEntries: PanelToolsRailEntry[] = Array.from(firstAccessoryById.values()).map(
    accessory => ({
      type: 'accessory',
      id: accessory.id,
      accessory,
    })
  );

  return [...toolEntries, ...accessoryEntries].sort((left, right) => {
    const leftPlacement =
      left.type === 'tool' ? panelToolsRailPlacement(left.item) : left.accessory.railPlacement;
    const rightPlacement =
      right.type === 'tool' ? panelToolsRailPlacement(right.item) : right.accessory.railPlacement;
    const regionDelta =
      PANEL_TOOLS_REGION_ORDER[leftPlacement] - PANEL_TOOLS_REGION_ORDER[rightPlacement];
    if (regionDelta !== 0) return regionDelta;

    const leftOrder = left.type === 'tool' ? panelToolsItemOrder(left.item) : left.accessory.order;
    const rightOrder =
      right.type === 'tool' ? panelToolsItemOrder(right.item) : right.accessory.order;
    return leftOrder - rightOrder;
  });
}

/** Flatten interactive entries while leaving decorative boundaries out of focus order. */
export function panelToolsRailFocusKeys(entries: PanelToolsRailEntry[]): string[] {
  return entries.flatMap(entry => {
    if (entry.type === 'tool') return [`tool:${entry.id}`];
    if (entry.accessory.type === 'divider') return [];
    if (entry.accessory.type === 'shortcut') {
      return entry.accessory.action.isInactive
        ? []
        : [`accessory:${entry.id}:${entry.accessory.action.id}`];
    }
    const keys = entry.accessory.primaryAction.isInactive
      ? []
      : [`accessory:${entry.id}:${entry.accessory.primaryAction.id}`];
    if (entry.accessory.secondaryAction && !entry.accessory.secondaryAction.isInactive) {
      keys.push(`accessory:${entry.id}:${entry.accessory.secondaryAction.id}`);
    }
    return keys;
  });
}

/** Preserve the current target across collection changes, or choose its nearest survivor. */
export function reconcilePanelToolsRovingIndex(
  previousKeys: string[],
  nextKeys: string[],
  currentIndex: number
): number {
  if (!nextKeys.length) return 0;
  const currentKey = previousKeys[currentIndex];
  const preservedIndex = currentKey ? nextKeys.indexOf(currentKey) : -1;
  if (preservedIndex >= 0) return preservedIndex;
  for (let index = currentIndex + 1; index < previousKeys.length; index += 1) {
    const nextIndex = nextKeys.indexOf(previousKeys[index]);
    if (nextIndex >= 0) return nextIndex;
  }
  for (let index = currentIndex - 1; index >= 0; index -= 1) {
    const nextIndex = nextKeys.indexOf(previousKeys[index]);
    if (nextIndex >= 0) return nextIndex;
  }
  return Math.min(Math.max(currentIndex, 0), nextKeys.length - 1);
}

export function panelToolsRailAccessoryActionDetail(
  accessoryId: string,
  actionId: string,
  anchor: HTMLElement
): PanelToolsRailAccessoryActionDetail {
  return { accessoryId, actionId, anchor };
}

export function isPanelToolsToolId(value: string | null): value is PanelToolsToolId {
  return typeof value === 'string' && value.trim().length > 0;
}

export function panelToolsRailPlacement(item: PanelToolsItem): 'header' | 'body' | 'footer' {
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
