export { registerIcons } from '../components/Icon/icon-cache';
export { clearCssLengthPxCache, resolveCssLengthPx } from './resolve-css-length-px';
export { formatCompactNumber } from './format-compact-number';
export { formatPercentage } from './format-percentage';
export type { PercentageDecimals } from './format-percentage';
export { computeMetricChange, resolveMetricTrend } from './metric-change';
export type {
  MetricChange,
  MetricTrend,
  MetricTrendDirection,
  MetricTrendTone,
  ResolveMetricTrendOptions,
} from './metric-change';
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
export { DEFAULT_REQUIRED_MESSAGE, setRequiredValidity } from './required-validity';
export {
  restoreNumberArrayFormState,
  restoreStringArrayFormState,
  restoreStringFormState,
  setFormControlValue,
  setRepeatedFormControlValue,
} from './form-association';
export type {
  FormControlState,
  SetFormControlValueOptions,
  SetRepeatedFormControlValueOptions,
} from './form-association';
export { resolveSafeUrl } from './safe-url';
export type { ResolveSafeUrlOptions, SafeUrlProtocol } from './safe-url';
export { controlWidthClass } from './control-width';
export type { ControlWidth } from './control-width';
export {
  arcMark,
  areaY,
  bandX,
  bandY,
  barX,
  barY,
  binX,
  boxStatistics,
  boxY,
  cell,
  cumulativeBins,
  densityX,
  defineChart,
  dot,
  lineY,
  normalizeStack,
  pieLayout,
  polar,
  radialArea,
  radialDot,
  radialLine,
  rect,
  ruleX,
  ruleY,
  textMark,
} from './chart-grammar';
export type {
  ChartArcOptions,
  ChartAreaYOptions,
  ChartAxisOptions,
  ChartAxisPresentation,
  ChartBarLayout,
  ChartBarOptions,
  ChartBandOptions,
  ChartBinDatum,
  ChartBinOptions,
  ChartBoxYOptions,
  ChartBuildContext,
  ChartCartesianCoordinate,
  ChartCellOptions,
  ChartCenterContent,
  ChartCenterOptions,
  ChartChannel,
  ChartColorOptions,
  ChartCoordinate,
  ChartDataIntent,
  ChartDefinition,
  ChartDensityDatum,
  ChartDensityOptions,
  ChartDotOptions,
  ChartFocusMode,
  ChartKey,
  ChartLineYOptions,
  ChartMargin,
  ChartMark,
  ChartMarkKind,
  ChartPieDatum,
  ChartPieOptions,
  ChartPoint,
  ChartPolarAxisOptions,
  ChartPolarContainerOptions,
  ChartPolarCoordinate,
  ChartRadialOptions,
  ChartRectOptions,
  ChartRuleOptions,
  ChartScale,
  ChartScaleSource,
  ChartSpec,
  ChartSpecBuilder,
  ChartTextOptions,
  ChartTickOptions,
  ChartTooltip,
  ChartTooltipContext,
  ChartTooltipItem,
  ChartTooltipOptions,
  ChartValue,
  ChartVisual,
  NormalizedStackDatum,
  NormalizeStackOptions,
} from './chart-grammar';
export { CONTROL_SUPPORTING_TEXT_VARIANT, CONTROL_TEXT_VARIANT } from './control-text';
export type { ControlInsetDepth, ControlSize } from './control-text';
export {
  choicePopupMinWidth,
  resolveChoicePopupAlignOffset,
} from './choice-popup-alignment';
export type { ChoicePopupAnchorAlignment } from './choice-popup-alignment';
