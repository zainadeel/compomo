import type { PanelToolsToolId } from '../components/PanelTools/panel-tools-types';

export type ShellResponsiveMode = 'desktop' | 'tablet' | 'mobile';
export type ShellMobileDestination = 'area' | 'search' | 'agents' | 'inbox';
export type ShellInboxToolId = Extract<PanelToolsToolId, 'messages' | 'stacks' | 'activity'>;

export const SHELL_DESKTOP_BREAKPOINT = 1200;
export const SHELL_MOBILE_BREAKPOINT = 768;
export const SHELL_DEFAULT_INBOX_TOOL: ShellInboxToolId = 'messages';

export function resolveShellResponsiveMode(width: number): ShellResponsiveMode {
  if (width >= SHELL_DESKTOP_BREAKPOINT) return 'desktop';
  if (width >= SHELL_MOBILE_BREAKPOINT) return 'tablet';
  return 'mobile';
}

export function shellMobileDestinationForTool(
  open: boolean,
  tool: PanelToolsToolId | ''
): ShellMobileDestination {
  if (!open || !tool || tool === 'help') return 'area';
  if (tool === 'search') return 'search';
  if (tool === 'agents') return 'agents';
  return 'inbox';
}

export function isShellInboxTool(tool: string): tool is ShellInboxToolId {
  return tool === 'messages' || tool === 'stacks' || tool === 'activity';
}

export function resolveAvailableInboxTool(
  preferred: string,
  available: readonly PanelToolsToolId[]
): ShellInboxToolId | '' {
  const inbox = available.filter(isShellInboxTool);
  if (isShellInboxTool(preferred) && inbox.includes(preferred)) return preferred;
  if (inbox.includes(SHELL_DEFAULT_INBOX_TOOL)) return SHELL_DEFAULT_INBOX_TOOL;
  return inbox[0] ?? '';
}

/** Active-destination reselects are inert unless they also dismiss the Menu pane. */
export function shouldEmitMobileDestinationChange(
  active: ShellMobileDestination,
  next: ShellMobileDestination,
  navigationOpen: boolean
): boolean {
  return navigationOpen || active !== next;
}
