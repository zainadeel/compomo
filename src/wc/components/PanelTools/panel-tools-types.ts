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

export interface PanelToolsItem {
  id: PanelToolsToolId;
  /** Icon name for <ds-icon>. */
  icon: string;
  /** Visible and accessible fallback label for custom tool ids. */
  label?: string;
  /** Explicit rail region; canonical Agents/Help placement is the fallback. */
  railPlacement?: 'header' | 'body' | 'footer';
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
