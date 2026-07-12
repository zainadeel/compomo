/** CSS var names consumed by `ds-panel-nav` / `ds-bar-nav` inside `ds-app-shell`. */
import type { ShellGradientPreset } from './shell-gradient-presets';
import {
  DEFAULT_SHELL_GRADIENT_PRESET,
  buildShellRadialGradientForPreset,
  normalizeShellGradientPreset,
} from './shell-gradient-presets';

export type { ShellGradientPreset } from './shell-gradient-presets';
export {
  DEFAULT_SHELL_GRADIENT_PRESET,
  SHELL_GRADIENT_PRESETS,
  SHELL_GRADIENT_PRESET_LABELS,
  buildShellRadialGradientForPreset,
  isShellGradientPreset,
  shellGradientPresetStopToken,
} from './shell-gradient-presets';

export const SHELL_GRADIENT_IMAGE_VAR = '--ds-shell-gradient-image';
export const SHELL_GRADIENT_SIZE_VAR = '--ds-shell-gradient-size';
export const SHELL_GRADIENT_POSITION_PANEL_VAR = '--ds-shell-gradient-position-panel';
export const SHELL_GRADIENT_POSITION_BAR_VAR = '--ds-shell-gradient-position-bar';
export const SHELL_GRADIENT_OPACITY_VAR = '--ds-shell-gradient-opacity';
/** Per chrome-surface background-position — offsets wash + grid to shell row origin. */
export const SHELL_CHROME_SURFACE_POSITION_VAR = '--ds-shell-chrome-surface-position';

/** Layer opacity for the nav gradient wash. */
export const SHELL_GRADIENT_OPACITY = '0.1';

/** Whether the shared chrome layer (secondary bg + optional wash) should mount. */
export function shellChromeLayerActive(preset: ShellGradientPreset): boolean {
  return normalizeShellGradientPreset(preset) !== 'none';
}

/**
 * Shell radial wash — same for panel and bar nav.
 * Tokens follow `data-theme` (light/dark intent stops).
 */
export function buildShellRadialGradient(
  preset: ShellGradientPreset = DEFAULT_SHELL_GRADIENT_PRESET,
): string {
  return buildShellRadialGradientForPreset(preset);
}

/** Built-in radial image for the selected shell preset. */
export function shellGradientImage(
  preset: ShellGradientPreset = DEFAULT_SHELL_GRADIENT_PRESET,
): string {
  return buildShellRadialGradient(preset);
}

export interface ShellViewportDimensions {
  width: number;
  height: number;
}

/**
 * Viewport size for shell chrome with `background-attachment: fixed`.
 * Must not use the `ds-app-shell` element box — the shell can be shorter or
 * taller than the viewport when host height chains break or content overflows.
 */
export function readShellViewportDimensions(win?: Window): ShellViewportDimensions {
  const w = win ?? (typeof globalThis.window !== 'undefined' ? globalThis.window : undefined);
  if (!w) return { width: 0, height: 0 };

  const visual = w.visualViewport;
  return {
    width: Math.round(visual?.width ?? w.innerWidth),
    height: Math.round(visual?.height ?? w.innerHeight),
  };
}

export interface ShellGradientLayout {
  width: number;
  height: number;
  panelWidth: number;
}

/** Pixel `background-size` for the fixed-attachment radial wash. */
export function shellGradientSize(layout: Pick<ShellGradientLayout, 'width' | 'height'>): string {
  return `${Math.round(layout.width)}px ${Math.round(layout.height)}px`;
}

export function shellGradientPositionPanel(): string {
  return '0 0';
}

export function shellGradientPositionBar(panelWidth: number): string {
  return `${-Math.round(panelWidth)}px 0`;
}

/** Phase-lock a chrome rect to the shell row coordinate system (wash + grid). */
export function shellChromeSurfacePosition(leftPx: number, topPx: number): string {
  return `${-Math.round(leftPx)}px ${-Math.round(topPx)}px`;
}
