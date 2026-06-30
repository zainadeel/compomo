import type { NavChromeStyle } from './nav-chrome';

/** CSS var names consumed by `ds-panel-nav` / `ds-bar-nav` inside `ds-app-shell`. */
export const SHELL_GRADIENT_IMAGE_VAR = '--ds-shell-gradient-image';
export const SHELL_GRADIENT_SIZE_VAR = '--ds-shell-gradient-size';
export const SHELL_GRADIENT_POSITION_PANEL_VAR = '--ds-shell-gradient-position-panel';
export const SHELL_GRADIENT_POSITION_BAR_VAR = '--ds-shell-gradient-position-bar';
export const SHELL_GRADIENT_OPACITY_VAR = '--ds-shell-gradient-opacity';

/** Layer opacity for the nav gradient wash. */
export const SHELL_GRADIENT_OPACITY = '0.1';

const GRADIENT_GEOMETRY = '100% 100% at 0% 0%';

/**
 * Unified shell radial — same wash for all nav chrome styles.
 * Tokens follow `data-theme` (light/dark blue intent).
 */
export function buildShellRadialGradient(): string {
  return `radial-gradient(${GRADIENT_GEOMETRY}, var(--color-background-transparent) 0%, var(--color-color-intent-blue-strong-background) 100%)`;
}

/** Built-in radial image (optional `gradientSrc` on shell overrides). */
export function shellGradientImageForStyle(_style: NavChromeStyle): string {
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
