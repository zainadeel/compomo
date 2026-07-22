/** Tool ids for the `ds-panel-tools` rail and drawer views. */
export type PanelToolsToolId = 'search' | 'agents' | 'messages' | 'stacks' | 'activity' | 'help';

export const PANEL_TOOLS_TOOL_IDS: PanelToolsToolId[] = [
  'search',
  'agents',
  'messages',
  'stacks',
  'activity',
  'help',
];

/** Rail header slot — mirrors panel-nav M logo row. */
export const PANEL_TOOLS_PRIMARY_TOOL_ID: PanelToolsToolId = 'search';

/** Rail footer slot — flush to the bottom of the tools column. */
export const PANEL_TOOLS_FOOTER_TOOL_ID: PanelToolsToolId = 'help';

export const PANEL_TOOLS_LABELS: Record<PanelToolsToolId, string> = {
  search: 'Search',
  messages: 'Messages',
  stacks: 'Stacks',
  activity: 'Activity',
  agents: 'Agents',
  help: 'Help & Support',
};

export const PANEL_TOOLS_SHORTCUTS: Partial<Record<PanelToolsToolId, string>> = {
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
  /** Whether this rail button is currently pressed/active. */
  selected?: boolean;
  /** Show a notification dot. */
  dot?: boolean;
  isInactive?: boolean;
  ariaLabel?: string;
}

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

export interface PanelToolsHeaderConfig {
  title?: string;
  showBack?: boolean;
  backIcon?: string;
  backAriaLabel?: string;
  actions?: PanelToolsHeaderAction[];
}

/** Per-tool header state. The application replaces the object when a tool changes depth or actions. */
export type PanelToolsHeaders = Partial<Record<PanelToolsToolId, PanelToolsHeaderConfig>>;
