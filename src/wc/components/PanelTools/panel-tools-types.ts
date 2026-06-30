/** Bar-nav tool ids that map to `ds-panel-tools` views. */
export type PanelToolsToolId = 'search' | 'activity' | 'messages' | 'agents';

export const PANEL_TOOLS_TOOL_IDS: PanelToolsToolId[] = [
  'search',
  'activity',
  'messages',
  'agents',
];

export const PANEL_TOOLS_LABELS: Record<PanelToolsToolId, string> = {
  search: 'Search',
  activity: 'Activity',
  messages: 'Messages',
  agents: 'Agents',
};
