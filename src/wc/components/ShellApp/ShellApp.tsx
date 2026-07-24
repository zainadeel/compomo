import {
  Component,
  Prop,
  Element,
  Event,
  EventEmitter,
  State,
  Watch,
  Listen,
  h,
  Host,
} from '@stencil/core';
import type { NavChromeStyle } from '../../shell/nav-chrome';
import {
  isEditableShortcutTarget,
  resolveShellShortcut,
} from '../../shell/shell-shortcuts';
import type { PanelToolsToolId } from '../PanelTools/panel-tools-types';
import {
  DEFAULT_SHELL_GRADIENT_PRESET,
  normalizeShellGradientPreset,
  type ShellGradientPreset,
} from '../../shell/shell-gradient-presets';
import {
  CHROME_TRANSITION_END,
  CHROME_TRANSITION_START,
  ChromeTransitionDepth,
  createRafCoalescer,
  readChromeTransitionSource,
} from '../../shell/chrome-transition';
import {
  isPanelNavCollapsed,
  panelWidthPxFromTokens,
  readPanelNavWidthTokens,
  type PanelNavWidthTokens,
} from '../../shell/shell-chrome-metrics';
import {
  SHELL_GRADIENT_IMAGE_VAR,
  SHELL_GRADIENT_OPACITY_VAR,
  SHELL_GRADIENT_POSITION_BAR_VAR,
  SHELL_GRADIENT_POSITION_PANEL_VAR,
  SHELL_GRADIENT_SIZE_VAR,
  buildShellRadialGradient,
  readShellViewportDimensions,
  shellGradientPositionBar,
  shellGradientPositionPanel,
  shellGradientPresetOpacity,
  shellGradientSize,
} from '../../shell/shell-gradient';
import {
  resolveShellResponsiveMode,
  type ShellMobileDestination,
  type ShellResponsiveMode,
} from '../../shell/shell-responsive';

@Component({
  tag: 'ds-shell-app',
  styleUrl: 'ShellApp.css',
  scoped: true,
})
export class ShellApp {
  /** Chrome style propagated to slotted `ds-panel-nav` and `ds-bar-nav`. */
  @Prop({ attribute: 'nav-style', reflect: true }) navStyle: NavChromeStyle = 'dashboard';

  /**
   * Shell chrome wash preset. `none` renders solid chrome; the remaining
   * presets use token-based washes that adapt to the active color theme.
   */
  @Prop({ attribute: 'gradient-preset', reflect: true }) gradientPreset: ShellGradientPreset =
    DEFAULT_SHELL_GRADIENT_PRESET;

  /** When `true` (default), registers global shell keyboard shortcuts. `[` toggles panel nav; `]` closes tools; K, A, S, M, N, and / toggle tool drawers. Modifiers are ignored so browser chords like ⌘N stay native. */
  @Prop({ attribute: 'shortcuts-enabled' }) shortcutsEnabled: boolean = true;

  /** Controlled mobile surface shown above the persistent bottom bar. */
  @Prop({ attribute: 'mobile-destination' })
  mobileDestination: ShellMobileDestination = 'area';

  /** Controlled full-stage mobile navigation-pane state. */
  @Prop({ attribute: 'mobile-navigation-open' })
  mobileNavigationOpen: boolean = false;

  /** Emitted after crossing the fixed 768px or 1200px shell boundaries. */
  @Event() dsResponsiveModeChange!: EventEmitter<{ mode: ShellResponsiveMode }>;

  @Element() el!: HTMLElement;
  @State() private toolsFullscreen = false;
  @State() private resolvedMode: ShellResponsiveMode = 'desktop';

  private resizeObserver: ResizeObserver | null = null;
  private hasLoaded = false;
  private readonly panelNavTransition = new ChromeTransitionDepth();
  private readonly chromeSyncCoalescer = createRafCoalescer(() => this.syncChrome());
  private panelWidthTokens: PanelNavWidthTokens = { expandedPx: 0, collapsedPx: 0 };
  private cachedViewportWidth = 0;
  private cachedViewportHeight = 0;
  private onWindowResize = () => {
    this.updateResponsiveMode();
    if (this.panelNavTransition.isActive) return;
    this.scheduleChromeSync();
  };
  private onVisualViewportChange = () => {
    if (this.panelNavTransition.isActive) return;
    this.scheduleChromeSync();
  };

  componentWillLoad() {
    if (typeof window !== 'undefined') {
      this.resolvedMode = resolveShellResponsiveMode(window.innerWidth);
    }
  }

  componentDidLoad() {
    this.hasLoaded = true;
    this.syncSlottedNavStyle();
    this.syncSlottedMobileState();
    this.connectMetricsObserver();
    this.connectViewportListeners();
    this.el.addEventListener(CHROME_TRANSITION_START, this.onChromeTransitionStart);
    this.el.addEventListener(CHROME_TRANSITION_END, this.onChromeTransitionEnd);
    requestAnimationFrame(() => {
      this.cachePanelWidthTokens();
      this.scheduleChromeSync();
    });
    const tools = this.el.querySelector('ds-shell-tools, ds-panel-tools');
    this.toolsFullscreen = tools?.getAttribute('presentation') === 'fullscreen';
  }

  @Listen('dsPresentationChange')
  handleToolsPresentation(event: CustomEvent<{ presentation?: string }>) {
    this.toolsFullscreen = event.detail?.presentation === 'fullscreen';
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
  @Watch('gradientPreset')
  onShellPropsChange() {
    this.syncSlottedNavStyle();
    this.scheduleChromeSync();
  }

  @Watch('mobileDestination')
  @Watch('mobileNavigationOpen')
  onMobileStateChange(_next: unknown, previous: unknown) {
    this.syncSlottedMobileState();
    if (
      previous === true &&
      !this.mobileNavigationOpen &&
      this.resolvedMode === 'mobile'
    ) {
      requestAnimationFrame(() => {
        const bar = this.el.querySelector('ds-shell-mobile-bar') as
          | (HTMLElement & {
              focusDestination?: (
                destination: ShellMobileDestination | 'navigation'
              ) => Promise<void>;
            })
          | null;
        const activeElement = document.activeElement;
        if (activeElement instanceof HTMLElement && bar?.contains(activeElement)) return;
        void bar?.focusDestination?.('navigation');
      });
    }
  }

  private updateResponsiveMode() {
    if (typeof window === 'undefined') return;
    const next = resolveShellResponsiveMode(window.innerWidth);
    if (next === this.resolvedMode) return;
    this.resolvedMode = next;
    this.syncSlottedMobileState();
    this.scheduleChromeSync();
    if (this.hasLoaded) this.dsResponsiveModeChange.emit({ mode: next });
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

  private syncSlottedMobileState() {
    const tools = this.el.querySelector('ds-shell-tools') as
      | (HTMLElement & { responsiveMode: ShellResponsiveMode })
      | null;
    const bar = this.el.querySelector('ds-shell-mobile-bar') as
      | (HTMLElement & {
          activeDestination: ShellMobileDestination;
          navigationExpanded: boolean;
        })
      | null;
    const navigation = this.el.querySelector('ds-shell-mobile-nav') as
      | (HTMLElement & { open: boolean })
      | null;

    if (tools) {
      tools.setAttribute('responsive-mode', this.resolvedMode);
      tools.responsiveMode = this.resolvedMode;
    }
    if (bar) {
      bar.activeDestination = this.mobileDestination;
      bar.navigationExpanded = this.mobileNavigationOpen;
    }
    if (navigation) {
      navigation.open = this.mobileNavigationOpen;
    }
  }

  private connectMetricsObserver() {
    this.resizeObserver = new ResizeObserver(() => {
      if (this.panelNavTransition.isActive) return;
      this.scheduleChromeSync();
    });
    this.resizeObserver.observe(this.el);
    const panelWrap = this.el.querySelector('.shell-app__panel');
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

    const panelWrap = this.el.querySelector('.shell-app__panel') as HTMLElement | null;
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
    return (
      this.resolvedMode !== 'mobile' &&
      normalizeShellGradientPreset(this.gradientPreset) !== 'none'
    );
  }

  @Listen('keydown', { target: 'window', capture: true })
  handleWindowKeyDown(e: KeyboardEvent) {
    if (!this.shortcutsEnabled) return;
    if (isEditableShortcutTarget(e.target)) return;

    const action = resolveShellShortcut(e);
    if (!action) return;

    e.preventDefault();

    const panel = this.el.querySelector('ds-panel-nav') as HTMLDsPanelNavElement | null;
    const tools = this.el.querySelector('ds-shell-tools, ds-panel-tools') as
      | (HTMLElement & {
          closeDrawer?: () => Promise<void>;
          activateTool?: (id: PanelToolsToolId) => Promise<void>;
        })
      | null;

    if (action === 'toggle-panel-nav') {
      void panel?.toggleCollapsed();
      return;
    }

    if (action === 'close-panel-tools') {
      void tools?.closeDrawer?.();
      return;
    }

    if (action.startsWith('open-tool:') && tools) {
      const toolId = action.slice('open-tool:'.length) as PanelToolsToolId;
      void tools.activateTool?.(toolId);
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

    const preset = normalizeShellGradientPreset(this.gradientPreset);
    if (preset === 'none' || this.resolvedMode === 'mobile') {
      this.clearGradientPaintVars(targets);
      clearLayoutVars();
      return;
    }

    const viewport = this.resolveViewportDimensions();
    const panelWidth = this.resolvePanelWidthPx(panelNav);

    const panelPosition = shellGradientPositionPanel();
    const barPosition = shellGradientPositionBar(panelWidth);

    this.syncChromeLayoutVars(panelNav, bar, panelPosition, barPosition);

    const image = buildShellRadialGradient(preset);

    const size = shellGradientSize({
      width: viewport.width,
      height: viewport.height,
    });
    const opacity = shellGradientPresetOpacity(preset);

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
    const mobile = this.resolvedMode === 'mobile';
    const mobileToolActive = mobile && this.mobileDestination !== 'area';
    const mobileStageBlocked = mobile && (mobileToolActive || this.mobileNavigationOpen);
    const fullscreen = !mobile && this.toolsFullscreen;
    const shellCls: Record<string, boolean> = {
      'shell-app': true,
      'shell-app--gradient': chromeActive,
      [`shell-app--${this.navStyle}`]: true,
      [`shell-app--${this.resolvedMode}`]: true,
      'shell-app--tools-fullscreen': fullscreen,
      'shell-app--mobile-tool-active': mobileToolActive,
      'shell-app--mobile-navigation-open': mobile && this.mobileNavigationOpen,
    };

    return (
      <Host class={shellCls} responsive-mode={this.resolvedMode}>
        <div class="shell-app__row">
          <div class="shell-app__chrome" aria-hidden="true" />
          <div class="shell-app__panel" aria-hidden={fullscreen ? 'true' : undefined} inert={fullscreen ? true : undefined}>
            <slot name="panel" />
          </div>
          <div class="shell-app__main">
            <div class="shell-app__bar" aria-hidden={fullscreen ? 'true' : undefined} inert={fullscreen ? true : undefined}>
              <slot name="bar" />
            </div>
            <div
              class="shell-app__mobile-section"
              hidden={!mobile || this.mobileDestination !== 'area' || this.mobileNavigationOpen}
            >
              <slot name="mobile-section-nav" />
            </div>
            <div
              class="shell-app__tools"
              aria-hidden={mobile && (!mobileToolActive || this.mobileNavigationOpen) ? 'true' : undefined}
              inert={mobile && (!mobileToolActive || this.mobileNavigationOpen) ? true : undefined}
              hidden={mobile && !mobileToolActive}
            >
              <slot name="tools" />
            </div>
            <div
              class="shell-app__content"
              aria-hidden={fullscreen || mobileStageBlocked ? 'true' : undefined}
              inert={fullscreen || mobileStageBlocked ? true : undefined}
            >
              <slot />
            </div>
            <div
              class="shell-app__mobile-navigation"
              hidden={!mobile || !this.mobileNavigationOpen}
              aria-hidden={mobile && this.mobileNavigationOpen ? undefined : 'true'}
              inert={mobile && this.mobileNavigationOpen ? undefined : true}
            >
              <slot name="mobile-navigation" />
            </div>
            <div class="shell-app__mobile-bar" hidden={!mobile}>
              <slot name="mobile-bar" />
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
