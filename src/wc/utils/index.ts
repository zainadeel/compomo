export { registerIcons } from '../components/Icon/icon-cache';
export { clearCssLengthPxCache, resolveCssLengthPx } from './resolve-css-length-px';
export { formatCompactNumber } from './format-compact-number';
export { truncateSvgTextToWidth } from './truncate-svg-text';
export {
  parseCssTimeMs,
  prefersReducedMotion,
  resolveCssTimeMs,
  resolveMotionTimeMs,
} from './resolve-css-time-ms';
export {
  SCROLL_EDGE_FADE_DEFAULT_SIZE,
  SCROLL_EDGE_FADE_SIZE_VAR,
  isScrollAtEdge,
  resolveScrollEdgeFadeSize,
  scrollEdgeFadeClassMap,
  scrollEdgeFadeMaskImage,
  scrollEdgeFadeMaskStyle,
  scrollEdgeFadeSizeStyle,
} from './scroll-edge-fade';
export type {
  ScrollEdgeFadeEdge,
  ScrollEdgeFadeOptions,
  ScrollEdgeFadeSize,
  ScrollEdgeFadeSizeToken,
} from './scroll-edge-fade';
export { TOKEN_DEFAULTS, TOKEN_CSS_LENGTHS } from './token-defaults';
export type { TokenDefaultKey } from './token-defaults';
export { controlWidthClass } from './control-width';
export type { ControlWidth } from './control-width';
export { CONTROL_TEXT_VARIANT } from './control-text';
export type { ControlSize } from './control-text';
