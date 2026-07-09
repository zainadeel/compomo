/** Tool ids for the `ds-panel-tools` rail and drawer views. */
export type PanelToolsToolId = 'search' | 'agents' | 'messages' | 'stacks' | 'activity';

export const PANEL_TOOLS_TOOL_IDS: PanelToolsToolId[] = [
  'search',
  'agents',
  'messages',
  'stacks',
  'activity',
];

/** Rail header slot — mirrors panel-nav M logo row. */
export const PANEL_TOOLS_PRIMARY_TOOL_ID: PanelToolsToolId = 'search';

export const PANEL_TOOLS_LABELS: Record<PanelToolsToolId, string> = {
  search: 'Search',
  messages: 'Messages',
  stacks: 'Stacks',
  activity: 'Activity',
  agents: 'Agents',
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
