import { shellGradientPositionBar } from './shell-gradient';

/** Read a `var(--token)` width in px using a hidden probe (works with calc() tokens). */
export function readCssVarWidthPx(context: HTMLElement, cssVarName: string): number {
  if (typeof document === 'undefined') return 0;

  const probe = document.createElement('div');
  probe.style.cssText =
    'position:absolute;visibility:hidden;pointer-events:none;height:0;width:var(' +
    cssVarName +
    ');';
  context.appendChild(probe);
  const width = probe.getBoundingClientRect().width;
  context.removeChild(probe);
  return width;
}

export interface PanelNavWidthTokens {
  expandedPx: number;
  collapsedPx: number;
}

/** Resolve panel-nav expanded/collapsed widths from scoped CSS vars on `.panel-nav`. */
export function readPanelNavWidthTokens(navRoot: HTMLElement): PanelNavWidthTokens {
  return {
    expandedPx: readCssVarWidthPx(navRoot, '--_nav-width'),
    collapsedPx: readCssVarWidthPx(navRoot, '--_nav-width-collapsed'),
  };
}

export function isPanelNavCollapsed(
  panelNavHost: HTMLElement | null,
  navRoot: HTMLElement | null,
): boolean {
  if (navRoot?.classList.contains('panel-nav--collapsed')) return true;
  const collapsedProp = (panelNavHost as (HTMLElement & { collapsed?: boolean }) | null)?.collapsed;
  return collapsedProp === true;
}

export function panelWidthPxFromTokens(
  tokens: PanelNavWidthTokens,
  collapsed: boolean,
): number {
  return collapsed ? tokens.collapsedPx : tokens.expandedPx;
}

export function barGradientPositionFromPanelWidth(panelWidthPx: number): string {
  return shellGradientPositionBar(panelWidthPx);
}
