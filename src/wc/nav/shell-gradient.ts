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
