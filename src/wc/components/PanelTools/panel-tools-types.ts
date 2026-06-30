/** Bar-nav tool ids that map to `ds-panel-tools` views. */
export type PanelToolsToolId = 'search' | 'messages' | 'stacks' | 'activity' | 'agents';

export const PANEL_TOOLS_TOOL_IDS: PanelToolsToolId[] = [
  'search',
  'messages',
  'stacks',
  'activity',
  'agents',
];

export const PANEL_TOOLS_LABELS: Record<PanelToolsToolId, string> = {
  search: 'Search',
  messages: 'Messages',
  stacks: 'Stacks',
  activity: 'Activity',
  agents: 'Agents',
};
