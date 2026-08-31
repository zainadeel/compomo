/** Application-owned tool id for the shell rail and responsive tool views. */
export type PanelToolsToolId = string;

/** Canonical Motive shell recipe used when item metadata is omitted. */
export type CanonicalPanelToolsToolId =
  | 'search'
  | 'messages'
  | 'agents'
  | 'stacks'
  | 'activity'
  | 'help';

export const PANEL_TOOLS_TOOL_IDS: CanonicalPanelToolsToolId[] = [
  'agents',
  'messages',
  'activity',
  'search',
  'stacks',
  'help',
];

/** Rail header slot — mirrors panel-nav M logo row. */
export const PANEL_TOOLS_PRIMARY_TOOL_ID: CanonicalPanelToolsToolId = 'agents';

/** Rail footer slot — flush to the bottom of the tools column. */
export const PANEL_TOOLS_FOOTER_TOOL_ID: CanonicalPanelToolsToolId = 'help';

export const PANEL_TOOLS_LABELS: Record<CanonicalPanelToolsToolId, string> = {
  search: 'Search',
  messages: 'Messages',
  stacks: 'Stacks',
  activity: 'Activity',
  agents: 'Agents',
  help: 'Help & Support',
};

export const PANEL_TOOLS_SHORTCUTS: Partial<Record<CanonicalPanelToolsToolId, string>> = {
  search: 'K',
  agents: 'A',
  messages: 'M',
  stacks: 'S',
  activity: 'N',
  help: '/',
};

export type PanelToolsRailPlacement = 'header' | 'body' | 'footer';

export interface PanelToolsItem {
  id: PanelToolsToolId;
  /** Icon name for <ds-icon>. */
  icon: string;
  /** Visible and accessible fallback label for custom tool ids. */
  label?: string;
  /** Explicit rail region; canonical Agents/Help placement is the fallback. */
  railPlacement?: PanelToolsRailPlacement;
  /** Stable ordering within the selected rail region. */
  order?: number;
  /** Optional shortcut label displayed by the tooltip. */
  shortcutKey?: string;
  /** Mobile destination recipe; canonical ids retain their explicit defaults. */
  mobileDestination?: 'search' | 'inbox' | 'activity' | 'messages' | 'agents' | 'help';
  /** Whether this rail button is currently pressed/active. */
  selected?: boolean;
  /** Show a notification dot. */
  dot?: boolean;
  isInactive?: boolean;
  ariaLabel?: string;
}

export type PanelToolsRailAccessoryVisual =
  | { type: 'icon'; icon: string }
  | { type: 'initial'; initial: string }
  | { type: 'image'; src: string };

export interface PanelToolsRailAccessoryAction {
  /** Stable application-owned action id emitted with the accessory id. */
  id: string;
  /** Overrides the accessory label for the primary action. */
  ariaLabel?: string;
  isInactive?: boolean;
}

export interface PanelToolsRailAccessorySecondaryAction {
  id: string;
  icon: string;
  ariaLabel: string;
  isInactive?: boolean;
}

export type PanelToolsRailTransientTone = 'active' | 'positive';

interface PanelToolsRailAccessoryBase {
  /** Stable application-owned identity. Duplicate or blank ids are omitted. */
  id: string;
  /** Explicit rail region; accessories never infer placement from their id. */
  railPlacement: PanelToolsRailPlacement;
  /** Stable ordering within the selected rail region. */
  order: number;
}

/** Decorative boundary between application-owned rail accessory groups. */
export interface PanelToolsRailDividerAccessory extends PanelToolsRailAccessoryBase {
  type: 'divider';
}

/**
 * A compact one-action shortcut that matches standard tool-button geometry.
 * PanelTools owns its initial orb, notification dot, and transient interaction paint.
 */
export interface PanelToolsRailShortcutAccessory extends PanelToolsRailAccessoryBase {
  type: 'shortcut';
  /** Accessible shortcut name and action-label fallback. */
  ariaLabel: string;
  /** One or two displayed graphemes. Longer values are truncated visually. */
  initials: string;
  /** Supplemental notification dot. Include its meaning in the accessible label when needed. */
  dot?: boolean;
  action: PanelToolsRailAccessoryAction;
}

/**
 * A direct application intent that never selects a tool or changes drawer state.
 * PanelTools owns the two-control-height surface and its focus behavior.
 */
export interface PanelToolsRailTransientAccessory extends PanelToolsRailAccessoryBase {
  type: 'transient';
  /** Accessible accessory name and primary-action fallback label. */
  ariaLabel: string;
  visual: PanelToolsRailAccessoryVisual;
  /** State announced with the primary action and shown in its tooltip. */
  statusText: string;
  /** Bold surface treatment. Active uses brand; positive uses positive semantic color. */
  statusTone: PanelToolsRailTransientTone;
  primaryAction: PanelToolsRailAccessoryAction;
  secondaryAction?: PanelToolsRailAccessorySecondaryAction;
}

export type PanelToolsRailAccessory =
  | PanelToolsRailDividerAccessory
  | PanelToolsRailShortcutAccessory
  | PanelToolsRailTransientAccessory;

export interface PanelToolsRailAccessoryActionDetail {
  accessoryId: string;
  actionId: string;
  /** Rendered action control, suitable for anchoring an application-owned overlay. */
  anchor: HTMLElement;
}

/** Canonical shell recipe used by Lab and by managed ShellApp examples. */
export const PANEL_TOOLS_DEFAULT_ITEMS: PanelToolsItem[] = [
  {
    id: 'agents',
    icon: 'AI',
    label: PANEL_TOOLS_LABELS.agents,
    railPlacement: 'header',
    order: 0,
    shortcutKey: PANEL_TOOLS_SHORTCUTS.agents,
    mobileDestination: 'agents',
  },
  {
    id: 'messages',
    icon: 'MessageBubbleStack',
    label: PANEL_TOOLS_LABELS.messages,
    order: 0,
    shortcutKey: PANEL_TOOLS_SHORTCUTS.messages,
    mobileDestination: 'messages',
  },
  {
    id: 'activity',
    icon: 'Bell',
    label: PANEL_TOOLS_LABELS.activity,
    order: 1,
    shortcutKey: PANEL_TOOLS_SHORTCUTS.activity,
    mobileDestination: 'activity',
  },
  {
    id: 'search',
    icon: 'MagnifyingGlass',
    label: PANEL_TOOLS_LABELS.search,
    order: 2,
    shortcutKey: PANEL_TOOLS_SHORTCUTS.search,
    mobileDestination: 'search',
  },
  {
    id: 'help',
    icon: 'CircleQuestion',
    label: PANEL_TOOLS_LABELS.help,
    railPlacement: 'footer',
    order: 0,
    shortcutKey: PANEL_TOOLS_SHORTCUTS.help,
    mobileDestination: 'help',
  },
];

export interface PanelToolsHeaderAction {
  id: string;
  icon: string;
  ariaLabel: string;
  triggerId?: string;
  controls?: string;
  expanded?: boolean;
  haspopup?: 'menu' | 'dialog' | 'listbox' | 'tree' | 'grid';
  pressed?: boolean;
  isInactive?: boolean;
}

export interface PanelToolsHeaderActionDetail {
  tool: PanelToolsToolId;
  id: string;
  /** Rendered header action host. Pass this to an external overlay's element anchor prop. */
  anchor?: HTMLElement;
}

export interface PanelToolHeaderActionDetail {
  id: string;
  originalEvent: MouseEvent;
  /** Rendered action host, suitable for anchoring an external overlay across a shadow boundary. */
  anchor: HTMLElement;
}

export interface PanelToolsHeaderConfig {
  title?: string;
  showBack?: boolean;
  backIcon?: string;
  backAriaLabel?: string;
  actions?: PanelToolsHeaderAction[];
}

/** Per-tool header state. The application replaces the object when a tool changes depth or actions. */
export type PanelToolsHeaders = Partial<Record<PanelToolsToolId, PanelToolsHeaderConfig>>;
