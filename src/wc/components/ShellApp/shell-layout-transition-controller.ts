import type { ChromeTransitionDetail, ChromeTransitionSource } from '../../shell/chrome-transition';
import {
  isPanelNavCollapsed,
  panelWidthPxFromTokens,
  readPanelNavWidthTokens,
  type PanelNavWidthTokens,
} from '../../shell/shell-chrome-metrics';
import { parseCssTimeMs, prefersReducedMotion } from '../../utils/resolve-css-time-ms';

interface ShellLayoutSnapshot {
  element: HTMLElement;
  rect: DOMRect;
}

interface ShellLayoutTiming {
  delay: number;
  duration: number;
  easing: string;
}

interface ShellToolsVisualRestore {
  element: HTMLElement;
  backgroundColor: string;
  blockSize: string;
  inlineSize: string;
  insetInlineEnd: string;
  position: string;
}

function splitCssList(value: string): string[] {
  const items: string[] = [];
  let start = 0;
  let depth = 0;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character === '(') depth += 1;
    else if (character === ')') depth = Math.max(0, depth - 1);
    else if (character === ',' && depth === 0) {
      items.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }
  items.push(value.slice(start).trim());
  return items;
}

function transitionTimingForProperty(
  style: CSSStyleDeclaration,
  property: string
): ShellLayoutTiming {
  const properties = splitCssList(style.transitionProperty);
  const durations = splitCssList(style.transitionDuration).map(value => parseCssTimeMs(value, 0));
  const delays = splitCssList(style.transitionDelay).map(value => parseCssTimeMs(value, 0));
  const easings = splitCssList(style.transitionTimingFunction);
  const index = Math.max(
    0,
    properties.findIndex(value => value === 'all' || value === property)
  );

  return {
    duration: durations[index % Math.max(1, durations.length)] ?? 0,
    delay: delays[index % Math.max(1, delays.length)] ?? 0,
    easing: easings[index % Math.max(1, easings.length)] || 'ease-in-out',
  };
}

/**
 * Commits terminal shell lane widths once, then translates routed content when
 * its origin moves. Width changes are never approximated with scale: text,
 * spacing, cards, and other page pixels paint at their final geometry while the
 * surrounding chrome completes its own motion.
 */
export class ShellLayoutTransitionController {
  private readonly activeSources = new Set<ChromeTransitionSource>();
  private frame: number | null = null;
  private generation = 0;
  private animations: Animation[] = [];
  private panelNavClassObserver: MutationObserver | null = null;
  private panelWidthTokens: PanelNavWidthTokens = { expandedPx: 0, collapsedPx: 0 };
  private panelLaneInlineSize = '';
  private toolsLaneInlineSize = '';
  private toolsVisualRestore: ShellToolsVisualRestore | null = null;

  constructor(
    private readonly shell: HTMLElement,
    private readonly disabled: () => boolean
  ) {}

  start(
    source: ChromeTransitionSource,
    phase: ChromeTransitionDetail['phase'],
    event: Event
  ): void {
    if (this.disabled()) return;

    const before = this.captureLayout();
    let motionElement: HTMLElement | null;
    let property = 'width';

    if (source === 'panel-nav') {
      if (!this.applyPanelLaneWidth()) return;
      motionElement = this.panelNavMotionRoot();
      this.connectPanelNavClassObserver();
    } else {
      motionElement = this.applyToolsLaneWidth(phase, event);
      property = 'max-width';
      if (!motionElement) return;
    }

    this.activeSources.add(source);
    this.syncHostState();
    this.animateLayoutFrom(before, motionElement, property);
  }

  finish(source: ChromeTransitionSource): void {
    this.activeSources.delete(source);
    if (source === 'panel-nav') {
      this.panelNavClassObserver?.disconnect();
      this.panelNavClassObserver = null;
      const panelLane = this.shell.querySelector<HTMLElement>('.shell-app__panel');
      if (panelLane) panelLane.style.inlineSize = this.panelLaneInlineSize;
    } else {
      const toolsLane = this.shell.querySelector<HTMLElement>('.shell-app__tools');
      if (toolsLane) toolsLane.style.inlineSize = this.toolsLaneInlineSize;
      this.restoreToolsVisual();
      this.shell.removeAttribute('data-shell-tools-transition');
    }

    if (this.activeSources.size === 0) this.cancelAnimation();
    this.syncHostState();
  }

  disconnect(): void {
    this.cancelAnimation();
    this.panelNavClassObserver?.disconnect();
    this.panelNavClassObserver = null;
    const panelLane = this.shell.querySelector<HTMLElement>('.shell-app__panel');
    const toolsLane = this.shell.querySelector<HTMLElement>('.shell-app__tools');
    if (panelLane) panelLane.style.inlineSize = this.panelLaneInlineSize;
    if (toolsLane) toolsLane.style.inlineSize = this.toolsLaneInlineSize;
    this.restoreToolsVisual();
    this.activeSources.clear();
    this.syncHostState();
    this.shell.removeAttribute('data-shell-tools-transition');
  }

  private syncHostState() {
    if (this.activeSources.size === 0) {
      this.shell.removeAttribute('data-shell-layout-transition');
      return;
    }
    this.shell.setAttribute('data-shell-layout-transition', [...this.activeSources].join(' '));
  }

  private layoutTargets(): HTMLElement[] {
    const content = this.shell.querySelector<HTMLElement>('.shell-app__content');
    return content ? [content] : [];
  }

  private captureLayout(): ShellLayoutSnapshot[] {
    return this.layoutTargets().map(element => ({
      element,
      rect: element.getBoundingClientRect(),
    }));
  }

  private cancelAnimation() {
    this.generation += 1;
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
    for (const animation of this.animations) animation.cancel();
    this.animations = [];
  }

  private animateLayoutFrom(
    before: ShellLayoutSnapshot[],
    motionElement: HTMLElement | null,
    property: string
  ) {
    this.cancelAnimation();
    if (prefersReducedMotion() || !motionElement) return;

    const generation = this.generation;
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      if (generation !== this.generation) return;

      const timing = transitionTimingForProperty(getComputedStyle(motionElement), property);
      if (timing.duration <= 0) return;

      this.animations = before.flatMap(({ element, rect: oldRect }) => {
        if (!element.isConnected) return [];
        const newRect = element.getBoundingClientRect();
        if (newRect.width <= 0 || newRect.height <= 0) return [];

        const deltaX = oldRect.left - newRect.left;
        const deltaY = oldRect.top - newRect.top;
        if (Math.abs(deltaX) < 0.01 && Math.abs(deltaY) < 0.01) {
          return [];
        }

        return [
          element.animate(
            [
              {
                transform: `translate3d(${deltaX}px, ${deltaY}px, 0)`,
              },
              { transform: 'none' },
            ],
            {
              delay: timing.delay,
              duration: timing.duration,
              easing: timing.easing,
              fill: 'both',
            }
          ),
        ];
      });
    });
  }

  private panelNavMotionRoot(): HTMLElement | null {
    return this.shell.querySelector<HTMLElement>('ds-panel-nav .panel-nav');
  }

  private resolvePanelLaneWidth(): number {
    const panelNav = this.shell.querySelector<HTMLElement>('ds-panel-nav');
    const navRoot = this.panelNavMotionRoot();
    if (!panelNav || !navRoot) return 0;
    if (this.panelWidthTokens.expandedPx <= 0) {
      this.panelWidthTokens = readPanelNavWidthTokens(navRoot);
    }
    return panelWidthPxFromTokens(this.panelWidthTokens, isPanelNavCollapsed(panelNav, navRoot));
  }

  private applyPanelLaneWidth(): boolean {
    const panelLane = this.shell.querySelector<HTMLElement>('.shell-app__panel');
    const width = this.resolvePanelLaneWidth();
    if (!panelLane || width <= 0) return false;
    if (!this.activeSources.has('panel-nav')) {
      this.panelLaneInlineSize = panelLane.style.inlineSize;
    }
    panelLane.style.inlineSize = `${width}px`;
    return true;
  }

  private connectPanelNavClassObserver() {
    const navRoot = this.panelNavMotionRoot();
    if (!navRoot) return;
    this.panelNavClassObserver?.disconnect();
    this.panelNavClassObserver = new MutationObserver(() => {
      if (!this.activeSources.has('panel-nav')) return;
      const panelLane = this.shell.querySelector<HTMLElement>('.shell-app__panel');
      const width = this.resolvePanelLaneWidth();
      if (!panelLane || width <= 0 || Math.abs(panelLane.clientWidth - width) < 0.5) return;
      const before = this.captureLayout();
      panelLane.style.inlineSize = `${width}px`;
      this.animateLayoutFrom(before, navRoot, 'width');
    });
    this.panelNavClassObserver.observe(navRoot, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  private elementFromEvent(event: Event, localName: string): HTMLElement | null {
    return (
      (event
        .composedPath()
        .find(node => node instanceof HTMLElement && node.localName === localName) as
        | HTMLElement
        | undefined) ?? null
    );
  }

  private applyToolsLaneWidth(
    phase: ChromeTransitionDetail['phase'],
    event: Event
  ): HTMLElement | null {
    const toolsLane = this.shell.querySelector<HTMLElement>('.shell-app__tools');
    const panelTools = this.elementFromEvent(event, 'ds-panel-tools');
    const drawer = panelTools?.shadowRoot?.querySelector<HTMLElement>('.panel-tools__drawer');
    const surface = panelTools?.shadowRoot?.querySelector<HTMLElement>(
      '.panel-tools__drawer-surface'
    );
    const rail = panelTools?.shadowRoot?.querySelector<HTMLElement>('.panel-tools__rail');
    if (!toolsLane || !panelTools || !drawer || !surface || !rail) return null;

    const railWidth = rail.getBoundingClientRect().width;
    const drawerWidth = surface.getBoundingClientRect().width;
    const targetWidth = railWidth + (phase === 'closing' ? 0 : drawerWidth);
    if (targetWidth <= 0) return null;

    if (!this.activeSources.has('panel-tools')) {
      this.toolsLaneInlineSize = toolsLane.style.inlineSize;
    }
    toolsLane.style.inlineSize = `${targetWidth}px`;

    const visual = this.elementFromEvent(event, 'ds-shell-tools') ?? panelTools;
    if (!this.toolsVisualRestore || this.toolsVisualRestore.element !== visual) {
      this.restoreToolsVisual();
      this.toolsVisualRestore = {
        element: visual,
        backgroundColor: visual.style.backgroundColor,
        position: visual.style.position,
        insetInlineEnd: visual.style.insetInlineEnd,
        inlineSize: visual.style.inlineSize,
        blockSize: visual.style.blockSize,
      };
    }
    visual.style.position = 'absolute';
    visual.style.backgroundColor = 'var(--_shell-chrome-bg)';
    visual.style.insetInlineEnd = '0';
    visual.style.inlineSize = `${railWidth + drawerWidth}px`;
    visual.style.blockSize = '100%';
    this.shell.toggleAttribute('data-shell-tools-transition', true);
    return drawer;
  }

  private restoreToolsVisual() {
    const restore = this.toolsVisualRestore;
    if (!restore) return;
    restore.element.style.backgroundColor = restore.backgroundColor;
    restore.element.style.position = restore.position;
    restore.element.style.insetInlineEnd = restore.insetInlineEnd;
    restore.element.style.inlineSize = restore.inlineSize;
    restore.element.style.blockSize = restore.blockSize;
    this.toolsVisualRestore = null;
  }
}
