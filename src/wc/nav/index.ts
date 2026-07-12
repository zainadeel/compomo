export type { NavChromeStyle } from './nav-chrome';
export {
  NAV_STYLE_HINT_ATTR,
  readNavStyleAttr,
  setNavStyleHint,
  clearNavStyleHint,
  resolveNavChromeStyle,
  shouldResyncNavChromeStyle,
} from './nav-chrome';
export {
  SHELL_BAR_NAV_VT_NAME,
  SHELL_NAV_REVEAL_DURATION_VAR,
  SHELL_NAV_REVEAL_EASING_VAR,
  parseCssTimeMs,
  ensureShellNavVtStyle,
  resolveShellNavRevealOrigin,
  setShellNavRevealOriginVars,
  animateShellNavRadialReveal,
  runShellNavStyleRevealOnReady,
} from './shell-view-transition';
export type { ShellNavRevealOrigin } from './shell-view-transition';
export {
  SHELL_GRADIENT_IMAGE_VAR,
  SHELL_GRADIENT_SIZE_VAR,
  SHELL_GRADIENT_POSITION_PANEL_VAR,
  SHELL_GRADIENT_POSITION_BAR_VAR,
  SHELL_GRADIENT_OPACITY_VAR,
  SHELL_CHROME_SURFACE_POSITION_VAR,
  buildShellRadialGradient,
  shellGradientImage,
  shellGradientSize,
  shellGradientPositionPanel,
  shellGradientPositionBar,
  shellChromeSurfacePosition,
  shellChromeLayerActive,
  readShellViewportDimensions,
} from './shell-gradient';
export type { ShellGradientLayout, ShellViewportDimensions } from './shell-gradient';
export type { MenuPlacement } from '../components/Menu/menu-placement';
export {
  PANEL_NAV_USER_MENU_PLACEMENT,
} from '../components/Menu/menu-placement';
export type { ShellGradientPreset } from './shell-gradient-presets';
export {
  DEFAULT_SHELL_GRADIENT_PRESET,
  SHELL_GRADIENT_PRESETS,
  SHELL_GRADIENT_PRESET_LABELS,
  buildShellRadialGradientForPreset,
  isShellGradientPreset,
  normalizeShellGradientPreset,
  shellGradientPresetStopToken,
} from './shell-gradient-presets';
export type { ChromeTransitionDetail, ChromeTransitionSource } from './chrome-transition';
export {
  CHROME_TRANSITION_END,
  CHROME_TRANSITION_START,
  ChromeTransitionDepth,
  createRafCoalescer,
  readChromeTransitionSource,
  readChromeTransitionPhase,
} from './chrome-transition';
export {
  barGradientPositionFromPanelWidth,
  isPanelNavCollapsed,
  panelWidthPxFromTokens,
  readCssVarWidthPx,
  readPanelNavWidthTokens,
} from './shell-chrome-metrics';
export type { PanelNavWidthTokens } from './shell-chrome-metrics';
export {
  BADGE_GRADIENT_POSITION_VAR,
  badgeGradientPosition,
  findGradientSurface,
  isShellGradientActive,
  parseCssBackgroundPosition,
  readShellGradientPosition,
  syncBadgeGradientPosition,
} from './badge-gradient-ring';
export type { GradientSurface } from './badge-gradient-ring';
