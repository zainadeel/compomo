import {
  SHELL_GRADIENT_POSITION_BAR_VAR,
  SHELL_GRADIENT_POSITION_PANEL_VAR,
} from './shell-gradient';

/** Per-badge background-position for shell gradient ring sampling. */
export const BADGE_GRADIENT_POSITION_VAR = '--_badge-gradient-position';

export interface GradientSurface {
  element: HTMLElement;
  chromeHost: HTMLElement;
  positionVar: string;
}

/** Whether the badge sits under a shell with an active wash preset. */
export function isShellGradientActive(from: HTMLElement): boolean {
  // Explicit <HTMLElement>: the inferred HTMLDsShellAppElement type only
  // resolves where @stencil/core types are installed — consumers importing
  // `@ds-mo/ui/shell` (raw TS) compile this without them.
  const shell = from.closest<HTMLElement>('ds-shell-app');
  return shell !== null && shell.getAttribute('gradient-preset') !== 'none';
}

/** Bar or panel chrome surface that owns the shell gradient stack. */
export function findGradientSurface(from: HTMLElement): GradientSurface | null {
  const barHost = from.closest('ds-bar-nav') as HTMLElement | null;
  if (barHost) {
    const root = barHost.shadowRoot ?? barHost;
    const element = root.querySelector('.bar-nav');
    if (element) {
      return {
        element: element as HTMLElement,
        chromeHost: barHost,
        positionVar: SHELL_GRADIENT_POSITION_BAR_VAR,
      };
    }
  }

  const panelHost = from.closest('ds-panel-nav') as HTMLElement | null;
  if (panelHost) {
    const root = panelHost.shadowRoot ?? panelHost;
    const element = root.querySelector('.panel-nav');
    if (element) {
      return {
        element: element as HTMLElement,
        chromeHost: panelHost,
        positionVar: SHELL_GRADIENT_POSITION_PANEL_VAR,
      };
    }
  }

  return null;
}

interface ParsedPosition {
  x: number;
  y: number;
}

/** Parse a two-value CSS background-position (e.g. `-200px 0`). */
export function parseCssBackgroundPosition(value: string): ParsedPosition {
  const trimmed = value.trim();
  if (!trimmed) return { x: 0, y: 0 };

  const parts = trimmed.split(/\s+/);
  const x = parseLength(parts[0] ?? '0');
  const y = parseLength(parts[1] ?? '0');
  return { x, y };
}

function parseLength(token: string): number {
  const px = token.match(/^(-?[\d.]+)px$/);
  if (px) return Number(px[1]);
  return 0;
}

/**
 * Background position for a badge ring so the shell gradient aligns with nav chrome.
 * Uses badge center relative to the painted chrome surface.
 */
export function badgeGradientPosition(
  badgeHost: HTMLElement,
  surface: GradientSurface,
  shellPosition: string,
): string {
  const badgeRect = badgeHost.getBoundingClientRect();
  const surfaceRect = surface.element.getBoundingClientRect();
  const anchorX = badgeRect.left + badgeRect.width / 2 - surfaceRect.left;
  const anchorY = badgeRect.top + badgeRect.height / 2 - surfaceRect.top;
  const { x, y } = parseCssBackgroundPosition(shellPosition);

  return `${Math.round(x - anchorX)}px ${Math.round(y - anchorY)}px`;
}

/** Resolve shell gradient position from chrome host custom properties. */
export function readShellGradientPosition(surface: GradientSurface): string {
  const styles = getComputedStyle(surface.chromeHost);
  return styles.getPropertyValue(surface.positionVar).trim() || '0 0';
}

/** Stamp `--_badge-gradient-position` on the badge host (fixed viewport chrome). */
export function syncBadgeGradientPosition(badgeHost: HTMLElement): void {
  if (!isShellGradientActive(badgeHost)) {
    badgeHost.style.removeProperty(BADGE_GRADIENT_POSITION_VAR);
    return;
  }

  badgeHost.style.setProperty(BADGE_GRADIENT_POSITION_VAR, '0 0');
}
