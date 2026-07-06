import { Component, Prop, Element, Watch, Listen, h, Host } from '@stencil/core';
import type { NavChromeStyle } from '../../nav/nav-chrome';
import {
  isEditableShortcutTarget,
  resolveShellShortcut,
} from '../../nav/shell-shortcuts';
import type { PanelToolsToolId } from '../PanelTools/panel-tools-types';
import {
  CHROME_TRANSITION_END,
  CHROME_TRANSITION_START,
  ChromeTransitionDepth,
  createRafCoalescer,
  readChromeTransitionSource,
} from '../../nav/chrome-transition';
import {
  isPanelNavCollapsed,
  panelWidthPxFromTokens,
  readPanelNavWidthTokens,
  type PanelNavWidthTokens,
} from '../../nav/shell-chrome-metrics';
import {
  SHELL_GRADIENT_IMAGE_VAR,
  SHELL_GRADIENT_OPACITY,
  SHELL_GRADIENT_OPACITY_VAR,
  SHELL_GRADIENT_POSITION_BAR_VAR,
  SHELL_GRADIENT_POSITION_PANEL_VAR,
  SHELL_GRADIENT_SIZE_VAR,
  buildShellRadialGradient,
  readShellViewportDimensions,
  shellGradientPositionBar,
  shellGradientPositionPanel,
  shellGradientSize,
} from '../../nav/shell-gradient';

@Component({
  tag: 'ds-app-shell',
  styleUrl: 'AppShell.css',
  scoped: true,
})
export class AppShell {
  /** Chrome style propagated to slotted `ds-panel-nav` and `ds-bar-nav`. */
  @Prop({ attribute: 'nav-style', reflect: true }) navStyle: NavChromeStyle = 'dashboard';

  /** When `true`, paints the radial wash behind panel, bar, and tools (synced to shell layout). */
  @Prop({ reflect: true }) gradient: boolean = false;

  /** When `true`, paints the diagonal grid overlay on the shared chrome layer. Independent of `gradient`. */
  @Prop({ reflect: true }) grid: boolean = false;

  /**
   * Optional custom gradient for `background-image` (e.g. SVG URL).
   * When set, overrides the built-in radial wash.
   */
  @Prop() gradientSrc: string = '';

  /** When `true` (default), registers global shell keyboard shortcuts. Tool chords (⌘/Ctrl+K/A/S/M/N) toggle their drawer open and closed; ⌘/Ctrl+[ toggles panel nav; ⌘/Ctrl+] closes any open tool drawer. */
  @Prop({ attribute: 'shortcuts-enabled' }) shortcutsEnabled: boolean = true;

  @Element() el!: HTMLElement;

  private resizeObserver: ResizeObserver | null = null;
  private readonly panelNavTransition = new ChromeTransitionDepth();
  private readonly chromeSyncCoalescer = createRafCoalescer(() => this.syncChrome());
  private panelWidthTokens: PanelNavWidthTokens = { expandedPx: 0, collapsedPx: 0 };
  private cachedViewportWidth = 0;
  private cachedViewportHeight = 0;
  private onWindowResize = () => {
    if (this.panelNavTransition.isActive) return;
    this.scheduleChromeSync();
  };
  private onVisualViewportChange = () => {
    if (this.panelNavTransition.isActive) return;
    this.scheduleChromeSync();
  };

  componentDidLoad() {
    this.syncSlottedNavStyle();
    this.connectMetricsObserver();
    this.connectViewportListeners();
    this.el.addEventListener(CHROME_TRANSITION_START, this.onChromeTransitionStart);
    this.el.addEventListener(CHROME_TRANSITION_END, this.onChromeTransitionEnd);
    requestAnimationFrame(() => {
      this.cachePanelWidthTokens();
      this.scheduleChromeSync();
    });
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.disconnectViewportListeners();
    this.chromeSyncCoalescer.cancel();
    this.el.removeEventListener(CHROME_TRANSITION_START, this.onChromeTransitionStart);
    this.el.removeEventListener(CHROME_TRANSITION_END, this.onChromeTransitionEnd);
  }

  @Watch('navStyle')
  @Watch('gradient')
  @Watch('grid')
  @Watch('gradientSrc')
  onShellPropsChange() {
    this.syncSlottedNavStyle();
    this.scheduleChromeSync();
  }

  private onChromeTransitionStart = (event: Event) => {
    if (readChromeTransitionSource(event) !== 'panel-nav') return;

    this.panelNavTransition.enter();
    const viewport = readShellViewportDimensions();
    this.cachedViewportWidth = viewport.width;
    this.cachedViewportHeight = viewport.height;
    this.syncChrome();
  };

  private onChromeTransitionEnd = (event: Event) => {
    if (readChromeTransitionSource(event) !== 'panel-nav') return;

    this.panelNavTransition.exit();
    if (!this.panelNavTransition.isActive) {
      this.scheduleChromeSync();
    }
  };

  /** Coalesce ResizeObserver bursts to one layout read per frame. */
  private scheduleChromeSync() {
    this.chromeSyncCoalescer.schedule();
  }

  private syncSlottedNavStyle() {
    const panel = this.el.querySelector('ds-panel-nav') as (HTMLElement & { navStyle: NavChromeStyle }) | null;
    const bar = this.el.querySelector('ds-bar-nav') as (HTMLElement & { navStyle: NavChromeStyle }) | null;
    if (panel) {
      panel.setAttribute('nav-style', this.navStyle);
      panel.navStyle = this.navStyle;
    }
    if (bar) {
      bar.setAttribute('nav-style', this.navStyle);
      bar.navStyle = this.navStyle;
    }
  }

  private connectMetricsObserver() {
    this.resizeObserver = new ResizeObserver(() => {
      if (this.panelNavTransition.isActive) return;
      this.scheduleChromeSync();
    });
    this.resizeObserver.observe(this.el);
    const panelWrap = this.el.querySelector('.app-shell__panel');
    if (panelWrap) this.resizeObserver.observe(panelWrap);
  }

  private connectViewportListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('resize', this.onWindowResize, { passive: true });

    const visual = window.visualViewport;
    if (visual) {
      visual.addEventListener('resize', this.onVisualViewportChange, { passive: true });
      visual.addEventListener('scroll', this.onVisualViewportChange, { passive: true });
    }
  }

  private disconnectViewportListeners() {
    if (typeof window === 'undefined') return;

    window.removeEventListener('resize', this.onWindowResize);

    const visual = window.visualViewport;
    if (visual) {
      visual.removeEventListener('resize', this.onVisualViewportChange);
      visual.removeEventListener('scroll', this.onVisualViewportChange);
    }
  }

  private cachePanelWidthTokens() {
    const navRoot = this.el.querySelector('ds-panel-nav .panel-nav') as HTMLElement | null;
    if (!navRoot) return;
    this.panelWidthTokens = readPanelNavWidthTokens(navRoot);
  }

  private applyGradientVars(target: HTMLElement, vars: Record<string, string | null>) {
    const style = target.style;
    for (const [name, value] of Object.entries(vars)) {
      if (value === null) style.removeProperty(name);
      else style.setProperty(name, value);
    }
  }

  private clearGradientPaintVars(targets: HTMLElement[]) {
    const keys = [
      SHELL_GRADIENT_IMAGE_VAR,
      SHELL_GRADIENT_SIZE_VAR,
      SHELL_GRADIENT_OPACITY_VAR,
    ];
    for (const target of targets) {
      for (const key of keys) target.style.removeProperty(key);
    }
  }

  /** Panel/bar wash offsets for scroll fades and badge rings. */
  private syncChromeLayoutVars(
    panel: HTMLElement | null,
    bar: HTMLElement | null,
    panelPosition: string,
    barPosition: string,
  ) {
    if (panel) {
      panel.style.setProperty(SHELL_GRADIENT_POSITION_PANEL_VAR, panelPosition);
    }
    if (bar) {
      bar.style.setProperty(SHELL_GRADIENT_POSITION_BAR_VAR, barPosition);
    }
  }

  private resolvePanelWidthPx(panelNav: HTMLElement | null): number {
    const navRoot = panelNav?.querySelector('.panel-nav') as HTMLElement | null;

    if (this.panelNavTransition.isActive && this.panelWidthTokens.expandedPx > 0) {
      const collapsed = isPanelNavCollapsed(panelNav, navRoot);
      return panelWidthPxFromTokens(this.panelWidthTokens, collapsed);
    }

    const panelWrap = this.el.querySelector('.app-shell__panel') as HTMLElement | null;
    const measured = panelWrap?.getBoundingClientRect().width ?? 0;
    if (measured > 0) return measured;

    if (this.panelWidthTokens.expandedPx > 0) {
      const collapsed = isPanelNavCollapsed(panelNav, navRoot);
      return panelWidthPxFromTokens(this.panelWidthTokens, collapsed);
    }

    return 0;
  }

  /** Fixed-attachment wash/grid size — always the viewport, never the shell element box. */
  private resolveViewportDimensions(): { width: number; height: number } {
    if (this.panelNavTransition.isActive && this.cachedViewportWidth > 0) {
      return {
        width: this.cachedViewportWidth,
        height: this.cachedViewportHeight,
      };
    }

    return readShellViewportDimensions();
  }

  private chromeLayerActive(): boolean {
    return this.gradient || this.grid;
  }

  @Listen('keydown', { target: 'window', capture: true })
  handleWindowKeyDown(e: KeyboardEvent) {
    if (!this.shortcutsEnabled) return;
    if (isEditableShortcutTarget(e.target)) return;

    const action = resolveShellShortcut(e);
    if (!action) return;

    e.preventDefault();

    const panel = this.el.querySelector('ds-panel-nav') as HTMLDsPanelNavElement | null;
    const tools = this.el.querySelector('ds-panel-tools') as HTMLDsPanelToolsElement | null;

    if (action === 'toggle-panel-nav') {
      void panel?.toggleCollapsed();
      return;
    }

    if (action === 'close-panel-tools') {
      void tools?.closeDrawer();
      return;
    }

    if (action.startsWith('open-tool:') && tools) {
      const toolId = action.slice('open-tool:'.length) as PanelToolsToolId;
      void tools.activateTool(toolId);
    }
  }

  private syncChrome() {
    const panelNav = this.el.querySelector('ds-panel-nav') as HTMLElement | null;
    const bar = this.el.querySelector('ds-bar-nav') as HTMLElement | null;
    const targets = [this.el, panelNav, bar].filter((el): el is HTMLElement => el !== null);

    const clearLayoutVars = () => {
      if (panelNav) panelNav.style.removeProperty(SHELL_GRADIENT_POSITION_PANEL_VAR);
      if (bar) bar.style.removeProperty(SHELL_GRADIENT_POSITION_BAR_VAR);
    };

    if (!this.chromeLayerActive()) {
      this.clearGradientPaintVars(targets);
      clearLayoutVars();
      return;
    }

    if (!this.gradient) {
      this.clearGradientPaintVars(targets);
      clearLayoutVars();
      return;
    }

    const viewport = this.resolveViewportDimensions();
    const panelWidth = this.resolvePanelWidthPx(panelNav);

    const panelPosition = shellGradientPositionPanel();
    const barPosition = shellGradientPositionBar(panelWidth);

    this.syncChromeLayoutVars(panelNav, bar, panelPosition, barPosition);

    const image = this.gradientSrc.trim()
      ? `url(${this.gradientSrc.trim()})`
      : buildShellRadialGradient();

    const size = shellGradientSize({
      width: viewport.width,
      height: viewport.height,
    });
    const opacity = SHELL_GRADIENT_OPACITY;

    for (const target of targets) {
      if (target === this.el) {
        this.applyGradientVars(target, {
          [SHELL_GRADIENT_IMAGE_VAR]: image,
          [SHELL_GRADIENT_SIZE_VAR]: size,
          [SHELL_GRADIENT_POSITION_PANEL_VAR]: panelPosition,
          [SHELL_GRADIENT_POSITION_BAR_VAR]: barPosition,
          [SHELL_GRADIENT_OPACITY_VAR]: opacity,
        });
        continue;
      }

      const isBar = target.tagName.toLowerCase() === 'ds-bar-nav';
      this.applyGradientVars(target, {
        [SHELL_GRADIENT_IMAGE_VAR]: image,
        [SHELL_GRADIENT_SIZE_VAR]: size,
        [SHELL_GRADIENT_OPACITY_VAR]: opacity,
        [SHELL_GRADIENT_POSITION_PANEL_VAR]: isBar ? null : panelPosition,
        [SHELL_GRADIENT_POSITION_BAR_VAR]: isBar ? barPosition : null,
      });
    }
  }

  render() {
    const chromeActive = this.chromeLayerActive();
    const shellCls: Record<string, boolean> = {
      'app-shell': true,
      'app-shell--gradient': this.gradient,
      'app-shell--grid': this.grid,
      [`app-shell--${this.navStyle}`]: true,
    };

    return (
      <Host class={shellCls}>
        <div class="app-shell__row">
          {chromeActive ? <div class="app-shell__chrome" aria-hidden="true" /> : null}
          <div class="app-shell__panel">
            <slot name="panel" />
          </div>
          <div class="app-shell__main">
            <div class="app-shell__bar">
              <slot name="bar" />
            </div>
            <div class="app-shell__tools">
              <slot name="tools" />
            </div>
            <div class="app-shell__content">
              <slot />
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
