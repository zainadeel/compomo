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
  SHELL_GRADIENT_OPACITY,
  buildShellRadialGradient,
  shellGradientImage,
  shellGradientSize,
  shellGradientPositionPanel,
  shellGradientPositionBar,
  shellChromeSurfacePosition,
} from './shell-gradient';
export type { ShellGradientLayout } from './shell-gradient';
export type { ChromeTransitionDetail, ChromeTransitionSource } from './chrome-transition';
export {
  CHROME_TRANSITION_END,
  CHROME_TRANSITION_START,
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
