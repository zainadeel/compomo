import {
  dimensionIconographyMd,
  dimensionIconographySm,
  dimensionIconographyXs,
  dimensionMenuWidthXs,
  dimensionPanelWidth2xs,
  dimensionPanelWidthLg,
  dimensionPanelWidthMd,
  dimensionSize300,
  dimensionSize600,
  dimensionSize800,
  dimensionSpace050,
  dimensionSpace200,
  effectAnimationDelayLong2,
  effectAnimationDelayMedium1,
  effectAnimationDelayShort2,
  effectAnimationDurationMedium1,
  effectAnimationDurationShort3,
  effectMotionShort3,
} from '@ds-mo/tokens/ts';

/** TokoMo CSS custom-property names for shared component defaults (runtime resolution). */
export const TOKEN_DEFAULTS = {
  space050: dimensionSpace050,
  space200: dimensionSpace200,
  size300: dimensionSize300,
  size600: dimensionSize600,
  size800: dimensionSize800,
  iconographyMd: dimensionIconographyMd,
  iconographySm: dimensionIconographySm,
  iconographyXs: dimensionIconographyXs,
  panelWidth2xs: dimensionPanelWidth2xs,
  panelWidthMd: dimensionPanelWidthMd,
  panelWidthLg: dimensionPanelWidthLg,
  menuWidthXs: dimensionMenuWidthXs,
  motionShort3: effectMotionShort3,
  animationDurationShort3: effectAnimationDurationShort3,
  animationDurationMedium1: effectAnimationDurationMedium1,
  animationDelayMedium1: effectAnimationDelayMedium1,
  animationDelayShort2: effectAnimationDelayShort2,
  animationDelayLong2: effectAnimationDelayLong2,
  /** Unmeasured menu height fallback: 20× base (160px at default scale). */
  menuFallbackHeight: 'calc(var(--dimension-size-base) * 20)',
  /** Unmeasured tooltip width fallback: size-800 + size-200 (80px). */
  tooltipFallbackWidth: 'calc(var(--dimension-size-800) + var(--dimension-size-200))',
} as const;

export type TokenDefaultKey = keyof typeof TOKEN_DEFAULTS;

/** Valid CSS length strings for overlay offset props — bind on `sideOffset` / `alignOffset` in hosts. */
export const TOKEN_CSS_LENGTHS = {
  space050: `var(${dimensionSpace050})`,
  space200: `var(${dimensionSpace200})`,
  menuWidthXs: `var(${dimensionMenuWidthXs})`,
} as const;
