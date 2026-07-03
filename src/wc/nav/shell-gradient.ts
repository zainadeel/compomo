/** CSS var names consumed by `ds-panel-nav` / `ds-bar-nav` inside `ds-app-shell`. */
export const SHELL_GRADIENT_IMAGE_VAR = '--ds-shell-gradient-image';
export const SHELL_GRADIENT_SIZE_VAR = '--ds-shell-gradient-size';
export const SHELL_GRADIENT_POSITION_PANEL_VAR = '--ds-shell-gradient-position-panel';
export const SHELL_GRADIENT_POSITION_BAR_VAR = '--ds-shell-gradient-position-bar';
export const SHELL_GRADIENT_OPACITY_VAR = '--ds-shell-gradient-opacity';
/** Per chrome-surface background-position — offsets wash + grid to shell row origin. */
export const SHELL_CHROME_SURFACE_POSITION_VAR = '--ds-shell-chrome-surface-position';

/** Layer opacity for the nav gradient wash. */
export const SHELL_GRADIENT_OPACITY = '0.1';

/** Whether the shared chrome layer (bg + optional wash/grid) should mount. */
export function shellChromeLayerActive(gradient: boolean, grid: boolean): boolean {
  return gradient || grid;
}

const GRADIENT_GEOMETRY = '100% 100% at 0% 0%';

/**
 * Shell radial wash — same for panel and bar nav.
 * Tokens follow `data-theme` (light/dark blue intent).
 */
export function buildShellRadialGradient(): string {
  return `radial-gradient(${GRADIENT_GEOMETRY}, var(--color-background-transparent) 0%, var(--color-color-intent-blue-strong-background) 100%)`;
}

/** Built-in radial image (optional `gradientSrc` on shell overrides). */
export function shellGradientImage(): string {
  return buildShellRadialGradient();
}

export interface ShellGradientLayout {
  width: number;
  height: number;
  panelWidth: number;
}

export function shellGradientSize(layout: ShellGradientLayout): string {
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
