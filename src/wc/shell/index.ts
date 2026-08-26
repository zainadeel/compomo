export type { NavChromeStyle } from './nav-chrome';
export type { PanelNavGroup, PanelNavItem } from '../components/PanelNav/panel-nav-types';
export type { BarNavTab } from '../components/BarNav/bar-nav-types';
export type {
  ShellPageContentInset,
  ShellPageContentSurface,
} from '../components/ShellPage/shell-page-types';
export type {
  ShellAppComposition,
  ShellNavigationConfig,
  ShellNavigationSelectDetail,
  ShellPageChromeConfig,
  ShellToolsConfig,
} from '../components/ShellApp/shell-app-types';
export type {
  PanelToolsHeaderAction,
  PanelToolsHeaderActionDetail,
  PanelToolHeaderActionDetail,
  PanelToolsHeaderConfig,
  PanelToolsHeaders,
  PanelToolsItem,
  PanelToolsToolId,
} from '../components/PanelTools/panel-tools-types';
export { PANEL_TOOLS_DEFAULT_ITEMS } from '../components/PanelTools/panel-tools-types';
export {
  NAV_STYLE_HINT_ATTR,
  readNavStyleAttr,
  setNavStyleHint,
  clearNavStyleHint,
} from './nav-chrome';
export type { MenuPlacement } from '../components/Menu/menu-placement';
export {
  PANEL_NAV_USER_MENU_PLACEMENT,
  PANEL_TOOLS_HEADER_MENU_PLACEMENT,
} from '../components/Menu/menu-placement';
export type {
  ShellGradientPickerOption,
  ShellGradientPickerPreview,
  ShellGradientPickerSection,
  ShellGradientPreset,
} from './shell-gradient-presets';
export {
  DEFAULT_SHELL_GRADIENT_PRESET,
  SHELL_GRADIENT_PRESETS,
  SHELL_GRADIENT_PRESET_LABELS,
  isShellGradientPreset,
  normalizeShellGradientPreset,
  shellGradientPickerSections,
} from './shell-gradient-presets';
export {
  SHELL_DEFAULT_INBOX_TOOL,
  isShellInboxTool,
  resolveAvailableInboxTool,
  resolveShellResponsiveMode,
  shellMobileDestinationForTool,
  shouldEmitMobileDestinationChange,
} from './shell-responsive';
export type { ShellInboxToolId, MobileDestination, ShellResponsiveMode } from './shell-responsive';
