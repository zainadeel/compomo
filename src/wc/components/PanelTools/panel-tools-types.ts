/** Bar-nav tool ids that map to `ds-panel-tools` views. */
export type PanelToolsToolId = 'search' | 'inbox' | 'agents';

export const PANEL_TOOLS_TOOL_IDS: PanelToolsToolId[] = ['search', 'inbox', 'agents'];

export const PANEL_TOOLS_LABELS: Record<PanelToolsToolId, string> = {
  search: 'Search',
  inbox: 'Inbox',
  agents: 'Agents',
};
