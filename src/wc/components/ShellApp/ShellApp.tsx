import {
  Component,
  Prop,
  Element,
  Event,
  EventEmitter,
  State,
  Watch,
  Listen,
  Method,
  h,
  Host,
} from '@stencil/core';
import type { NavChromeStyle } from '../../shell/nav-chrome';
import { isEditableShortcutTarget, resolveShellShortcut } from '../../shell/shell-shortcuts';
import type {
  PanelToolsHeaderAction,
  PanelToolsRailAccessoryActionDetail,
  PanelToolsToolId,
} from '../PanelTools/panel-tools-types';
import { PANEL_TOOLS_DEFAULT_ITEMS } from '../PanelTools/panel-tools-types';
import type { BarTitleActionConfigItem, BarTitleSectionItem } from '../BarTitle/bar-title-types';
import type { BarTitlePlacement } from '../BarTitle/bar-title-types';
import {
  findBarTitleAction,
  overflowBarTitleActionSections,
  resolveBarTitleActionItems,
  visibleBarTitleActions,
} from '../BarTitle/bar-title-actions';
import type { BarNavTab } from '../BarNav/bar-nav-types';
import type { BreadcrumbSelectDetail } from '../Breadcrumb/breadcrumb-types';
import type { MenuItemData } from '../Menu/menu-types';
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
  itemUsesShellInbox,
  resolveAvailableInboxTool,
  resolveManagedShellPageCapacity,
  resolveShellResponsiveMode,
  SHELL_DESKTOP_BREAKPOINT,
  shellMobileDestinationForTool,
  type MobileDestination,
  type ShellInboxToolId,
  type ShellResponsiveMode,
} from '../../shell/shell-responsive';
import { deriveActiveIdFromUrl } from '../PanelNav/panel-nav-utils';
import type { PanelNavChildSelectDetail } from '../PanelNav/panel-nav-types';
import type { PanelNavItem } from '../PanelNav/panel-nav-types';
import type { PanelNavUserActionDetail } from '../PanelNav/panel-nav-types';
import type { MobileBarNavDestinationDetail } from '../MobileBarNav/mobile-bar-nav-types';
import type {
  ShellAppComposition,
  ShellNavigationConfig,
  ShellPageChromeConfig,
  ShellSectionNavigation,
  ShellToolsConfig,
} from './shell-app-types';
import type { PaperTextureConfig } from '../PaperTexture/paper-texture-types';

let nextShellAppId = 0;
type FocusableButton = HTMLElement & { setFocus?: () => Promise<void> };

@Component({
  tag: 'ds-shell-app',
  styleUrl: 'ShellApp.css',
  scoped: true,
})
export class ShellApp {
  private static readonly FOREGROUND_REFRESH_MS = 50;

  /** Managed renders the complete responsive chrome; slotted exposes the advanced composition. */
  @Prop({ reflect: true }) composition: ShellAppComposition = 'managed';

  /** Router-owned navigation data used by managed composition. */
  @Prop() navigation: ShellNavigationConfig = {};

  /** Desktop/tablet route sections in BarNav, or nested beneath PanelNav parents. */
  @Prop({ attribute: 'section-navigation', reflect: true })
  sectionNavigation: ShellSectionNavigation = 'bar';

  /** Route-owned page title and section data used by managed composition. */
  @Prop({ attribute: 'page-chrome' }) pageChrome: ShellPageChromeConfig = {};

  /** Product-owned global tool definitions used by managed composition. */
  @Prop() tools: ShellToolsConfig = {};

  /** Chrome style propagated to slotted `ds-panel-nav` and `ds-bar-nav`. */
  @Prop({ attribute: 'nav-style', reflect: true }) navStyle: NavChromeStyle = 'dashboard';

  /**
   * Shell chrome wash preset. `none` renders solid chrome; the remaining
   * presets use token-based washes that adapt to the active color theme.
   */
  @Prop({ attribute: 'gradient-preset', reflect: true }) gradientPreset: ShellGradientPreset =
    DEFAULT_SHELL_GRADIENT_PRESET;

  /** Optional decorative Paper Design texture layered above the shell wash. */
  @Prop({ attribute: 'paper-texture' }) paperTexture?: PaperTextureConfig;

  /** When `true` (default), registers global shell keyboard shortcuts. `[` toggles panel nav; `]` closes tools; K, A, S, M, N, and / toggle tool drawers. Modifiers are ignored so browser chords like ⌘N stay native. */
  @Prop({ attribute: 'shortcuts-enabled' }) shortcutsEnabled: boolean = true;

  /** Controlled mobile surface shown above the persistent bottom bar. */
  @Prop({ attribute: 'mobile-destination' })
  mobileDestination: MobileDestination = 'area';

  /** Controlled full-stage Mobile Sheet Nav state. */
  @Prop({ attribute: 'mobile-sheet-nav-open' })
  mobileSheetNavOpen: boolean = false;

  /** Emitted after crossing the fixed 768px or 1200px shell boundaries. */
  @Event() dsResponsiveModeChange!: EventEmitter<{ mode: ShellResponsiveMode }>;

  /** Managed primary-navigation intent; the application router performs navigation. */
  @Event() dsNavSelect!: EventEmitter<string>;

  /** Managed desktop BarNav or mobile section-selection intent. */
  @Event() dsTabChange!: EventEmitter<string>;

  /** Managed nested PanelNav child-route intent. */
  @Event() dsNavChildSelect!: EventEmitter<PanelNavChildSelectDetail>;

  /** Managed page-subsection intent from BarTitle or MobileHeader. */
  @Event() dsSubsectionChange!: EventEmitter<string>;

  /** Managed page-level Back intent. */
  @Event() dsPageBack!: EventEmitter<MouseEvent>;

  /** Managed breadcrumb intent from BarTitle. */
  @Event({ cancelable: true })
  dsBreadcrumbSelect!: EventEmitter<BreadcrumbSelectDetail>;

  /** Managed page action intent from BarTitle. */
  @Event() dsPageAction!: EventEmitter<string>;

  /** Managed tools selection state. */
  @Event() dsToolChange!: EventEmitter<{ id: PanelToolsToolId; selected: boolean }>;

  /** Managed tool-header Back intent. */
  @Event() dsHeaderBack!: EventEmitter<{ tool: PanelToolsToolId }>;

  /** Managed tool-header action intent. */
  @Event() dsHeaderAction!: EventEmitter<{ tool: PanelToolsToolId; id: string }>;

  /** Managed desktop/tablet rail accessory intent. */
  @Event() dsRailAccessoryAction!: EventEmitter<PanelToolsRailAccessoryActionDetail>;

  /** Managed drawer/fullscreen presentation state. */
  @Event() dsPresentationChange!: EventEmitter<{ presentation: 'drawer' | 'fullscreen' }>;

  /** Managed mobile Dashboard/Settings browsing intent. */
  @Event() dsBrowseContextChange!: EventEmitter<NavChromeStyle>;

  /** Managed account-footer action intent. */
  @Event() dsNavFooterAction!: EventEmitter<void>;

  /** Managed user/account trigger intent. */
  @Event() dsNavUserAction!: EventEmitter<PanelNavUserActionDetail>;

  @Element() el!: HTMLElement;
  @State() private toolsFullscreen = false;
  @State() private resolvedMode: ShellResponsiveMode = 'desktop';
  @State() private managedToolsOpen = false;
  @State() private managedActiveTool: PanelToolsToolId | '' = '';
  @State() private managedToolPresentation: 'drawer' | 'fullscreen' = 'drawer';
  @State() private managedMobileDestination: MobileDestination = 'area';
  @State() private managedMobileSheetNavOpen = false;
  @State() private managedInboxTool: ShellInboxToolId | '' = '';
  @State() private managedBrowseContext: NavChromeStyle = 'dashboard';
  @State() private mobileActionMenuOpen = false;
  @State() private mobileActionMenuInitialFocusVisible = false;

  private readonly instanceId = nextShellAppId++;
  private readonly mobileActionMenuTriggerId = `shell-app-mobile-action-trigger-${this.instanceId}`;
  private readonly mobileActionMenuId = `shell-app-mobile-action-menu-${this.instanceId}`;
  private mobileActionTriggerEl: FocusableButton | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private hasLoaded = false;
  private foregroundRefreshTimer: number | null = null;
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

  private get managed(): boolean {
    return this.composition === 'managed';
  }

  private get effectiveMobileDestination(): MobileDestination {
    return this.managed ? this.managedMobileDestination : this.mobileDestination;
  }

  private get effectiveMobileSheetNavOpen(): boolean {
    return this.managed ? this.managedMobileSheetNavOpen : this.mobileSheetNavOpen;
  }

  private get resolvedNavigationGroups() {
    if (this.navigation.groups?.length) return this.navigation.groups;
    return this.managedBrowseContext === 'settings'
      ? (this.navigation.settingsGroups ?? [])
      : (this.navigation.dashboardGroups ?? []);
  }

  private get resolvedToolItems() {
    return this.tools.items ?? PANEL_TOOLS_DEFAULT_ITEMS;
  }

  private get resolvedPageTabs(): BarNavTab[] {
    const children = this.currentArea.children;
    if (!children?.length) return this.pageChrome.tabs ?? [];
    return children.map(child => ({
      id: child.id,
      label: child.label,
      dot: child.dot,
      isInactive: child.isInactive,
    }));
  }

  private get availableInboxTools(): ShellInboxToolId[] {
    return this.resolvedToolItems
      .filter(item => !item.isInactive && itemUsesShellInbox(item))
      .map(item => item.id as ShellInboxToolId);
  }

  componentWillLoad() {
    if (typeof window !== 'undefined') {
      this.resolvedMode = resolveShellResponsiveMode(window.innerWidth);
    }
    this.managedBrowseContext = this.navigation.browseContext ?? this.navStyle;
    this.managedMobileDestination = this.mobileDestination;
    this.managedMobileSheetNavOpen = this.mobileSheetNavOpen;
    this.managedInboxTool = resolveAvailableInboxTool('', this.availableInboxTools);
  }

  componentDidLoad() {
    this.hasLoaded = true;
    this.syncSlottedNavStyle();
    this.syncSlottedMobileState();
    this.connectMetricsObserver();
    this.connectViewportListeners();
    this.connectPageLifecycleListeners();
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
    this.disconnectPageLifecycleListeners();
    this.cancelForegroundRefresh();
    this.chromeSyncCoalescer.cancel();
    this.el.removeEventListener(CHROME_TRANSITION_START, this.onChromeTransitionStart);
    this.el.removeEventListener(CHROME_TRANSITION_END, this.onChromeTransitionEnd);
  }

  @Watch('navStyle')
  @Watch('gradientPreset')
  @Watch('paperTexture')
  @Watch('sectionNavigation')
  onShellPropsChange() {
    this.syncSlottedNavStyle();
    this.scheduleChromeSync();
  }

  @Watch('navigation')
  handleNavigationChange() {
    this.managedBrowseContext = this.navigation.browseContext ?? this.navStyle;
  }

  @Watch('pageChrome')
  handlePageChromeChange() {
    if (this.mobileActionMenuSections.length === 0) this.mobileActionMenuOpen = false;
  }

  @Watch('tools')
  handleToolsChange() {
    if (
      this.managedActiveTool &&
      !this.resolvedToolItems.some(item => item.id === this.managedActiveTool)
    ) {
      this.managedToolsOpen = false;
      this.managedActiveTool = '';
      this.managedMobileDestination = 'area';
    }
    this.managedInboxTool = resolveAvailableInboxTool(
      this.managedInboxTool,
      this.availableInboxTools
    );
  }

  @Watch('mobileDestination')
  @Watch('mobileSheetNavOpen')
  onMobileStateChange(_next: unknown, previous: unknown) {
    if (this.managed) {
      this.managedMobileDestination = this.mobileDestination;
      this.managedMobileSheetNavOpen = this.mobileSheetNavOpen;
    }
    this.syncSlottedMobileState();
    if (previous === true && !this.effectiveMobileSheetNavOpen && this.resolvedMode === 'mobile') {
      requestAnimationFrame(() => {
        const bar = this.el.querySelector('ds-mobile-bar-nav') as
          | (HTMLElement & {
              focusDestination?: (destination: MobileDestination | 'sheet-nav') => Promise<void>;
            })
          | null;
        const activeElement = document.activeElement;
        if (activeElement instanceof HTMLElement && bar?.contains(activeElement)) return;
        void bar?.focusDestination?.('sheet-nav');
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
    const source = readChromeTransitionSource(event);
    if (source !== 'panel-nav') return;

    this.panelNavTransition.enter();
    const viewport = readShellViewportDimensions();
    this.cachedViewportWidth = viewport.width;
    this.cachedViewportHeight = viewport.height;
    this.syncChrome();
  };

  private onChromeTransitionEnd = (event: Event) => {
    const source = readChromeTransitionSource(event);
    if (source !== 'panel-nav') return;

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
    const panel = this.el.querySelector('ds-panel-nav') as
      | (HTMLElement & { navStyle: NavChromeStyle })
      | null;
    const bar = this.el.querySelector('ds-bar-nav') as
      | (HTMLElement & { navStyle: NavChromeStyle })
      | null;
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
    const bar = this.el.querySelector('ds-mobile-bar-nav') as
      | (HTMLElement & {
          activeDestination: MobileDestination;
          sheetNavExpanded: boolean;
        })
      | null;
    const sheetNav = this.el.querySelector('ds-mobile-sheet-nav') as
      | (HTMLElement & { open: boolean })
      | null;

    if (tools) {
      tools.setAttribute('responsive-mode', this.resolvedMode);
      tools.responsiveMode = this.resolvedMode;
    }
    if (bar) {
      bar.activeDestination = this.effectiveMobileDestination;
      bar.sheetNavExpanded = this.effectiveMobileSheetNavOpen;
    }
    if (sheetNav) {
      sheetNav.open = this.effectiveMobileSheetNavOpen;
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

  private connectPageLifecycleListeners() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    document.addEventListener('visibilitychange', this.onDocumentVisibilityChange);
    window.addEventListener('pageshow', this.onPageShow);
  }

  private disconnectPageLifecycleListeners() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    document.removeEventListener('visibilitychange', this.onDocumentVisibilityChange);
    window.removeEventListener('pageshow', this.onPageShow);
  }

  private onDocumentVisibilityChange = () => {
    if (!document.hidden) this.refreshAfterForegroundRestore();
  };

  private onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted) this.refreshAfterForegroundRestore();
  };

  private cancelForegroundRefresh() {
    if (this.foregroundRefreshTimer !== null) {
      window.clearTimeout(this.foregroundRefreshTimer);
      this.foregroundRefreshTimer = null;
    }
    this.el.classList.remove('shell-app--foreground-refresh');
  }

  private refreshAfterForegroundRestore() {
    this.updateResponsiveMode();
    this.syncSlottedMobileState();
    this.scheduleChromeSync();

    if (this.resolvedMode !== 'mobile') return;

    /*
     * Mobile WebKit can restore a live, correctly sized DOM without repainting
     * its suspended shell layer. Re-promote the complete mobile stage for one
     * painted frame; routed and tool owners remain mounted and keep their state.
     */
    this.cancelForegroundRefresh();
    this.el.classList.add('shell-app--foreground-refresh');
    void this.el.offsetHeight;
    // A short timer spans a real compositor commit; resumed WebKit may coalesce
    // nested animation frames before presenting either one.
    this.foregroundRefreshTimer = window.setTimeout(() => {
      this.foregroundRefreshTimer = null;
      this.el.classList.remove('shell-app--foreground-refresh');
      // WebKit otherwise may keep presenting the retired composite layer.
      void this.el.querySelector<HTMLElement>('.shell-app__main')?.offsetHeight;
    }, ShellApp.FOREGROUND_REFRESH_MS);
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
    const keys = [SHELL_GRADIENT_IMAGE_VAR, SHELL_GRADIENT_SIZE_VAR, SHELL_GRADIENT_OPACITY_VAR];
    for (const target of targets) {
      for (const key of keys) target.style.removeProperty(key);
    }
  }

  /** Panel/bar wash offsets for scroll fades and badge rings. */
  private syncChromeLayoutVars(
    panel: HTMLElement | null,
    bar: HTMLElement | null,
    panelPosition: string,
    barPosition: string
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
    return this.gradientLayerActive() || this.paperTextureLayerActive();
  }

  private gradientLayerActive(): boolean {
    return (
      this.resolvedMode !== 'mobile' && normalizeShellGradientPreset(this.gradientPreset) !== 'none'
    );
  }

  private paperTextureLayerActive(): boolean {
    return this.resolvedMode !== 'mobile' && this.paperTexture != null;
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

  /** Open or toggle a managed global tool from application-owned UI. */
  @Method()
  async activateTool(id: PanelToolsToolId) {
    const tools = this.el.querySelector('ds-shell-tools, ds-panel-tools') as
      | (HTMLElement & { activateTool?: (tool: PanelToolsToolId) => Promise<void> })
      | null;
    await tools?.activateTool?.(id);
  }

  /** Close whichever managed global surface is currently visible. */
  @Method()
  async closeGlobalSurface() {
    if (this.managedMobileSheetNavOpen) {
      this.managedMobileSheetNavOpen = false;
      return;
    }
    const tools = this.el.querySelector('ds-shell-tools, ds-panel-tools') as
      | (HTMLElement & { closeDrawer?: () => Promise<void> })
      | null;
    await tools?.closeDrawer?.();
  }

  /** Request drawer or fullscreen presentation for the active managed tool. */
  @Method()
  async setToolPresentation(presentation: 'drawer' | 'fullscreen') {
    this.managedToolPresentation = presentation;
    this.toolsFullscreen = presentation === 'fullscreen';
  }

  private handleManagedNavSelect = (event: CustomEvent<string>) => {
    event.stopPropagation();
    this.dsNavSelect.emit(event.detail);
  };

  private handleManagedNavChildSelect = (event: CustomEvent<PanelNavChildSelectDetail>) => {
    event.stopPropagation();
    this.dsNavChildSelect.emit(event.detail);
  };

  private handleManagedTabChange = (event: CustomEvent<string>) => {
    event.stopPropagation();
    this.dsTabChange.emit(event.detail);
  };

  private handleManagedPageBack = (event: CustomEvent<MouseEvent>) => {
    event.stopPropagation();
    this.dsPageBack.emit(event.detail);
  };

  private handleManagedBreadcrumbSelect = (event: CustomEvent<BreadcrumbSelectDetail>) => {
    event.stopPropagation();
    const forwarded = this.dsBreadcrumbSelect.emit(event.detail);
    if (forwarded.defaultPrevented) event.preventDefault();
  };

  private handleManagedSubsectionChange = (event: CustomEvent<string>) => {
    event.stopPropagation();
    this.dsSubsectionChange.emit(event.detail);
  };

  private handleManagedPageAction = (event: CustomEvent<string>) => {
    event.stopPropagation();
    this.dsPageAction.emit(event.detail);
  };

  private handleManagedToolChange = (
    event: CustomEvent<{ id: PanelToolsToolId; selected: boolean }>
  ) => {
    event.stopPropagation();
    const { id, selected } = event.detail;
    this.managedActiveTool = id;
    this.managedToolsOpen = selected;
    const item = this.resolvedToolItems.find(candidate => candidate.id === id);
    if (item && itemUsesShellInbox(item)) {
      this.managedInboxTool = id;
    }
    this.managedMobileDestination = selected
      ? (item?.mobileDestination ?? shellMobileDestinationForTool(true, id))
      : 'area';
    this.managedMobileSheetNavOpen = false;
    this.dsToolChange.emit(event.detail);
  };

  private handleManagedPresentationChange = (
    event: CustomEvent<{ presentation: 'drawer' | 'fullscreen' }>
  ) => {
    event.stopPropagation();
    this.managedToolPresentation = event.detail.presentation;
    this.toolsFullscreen = event.detail.presentation === 'fullscreen';
    this.dsPresentationChange.emit(event.detail);
  };

  private handleManagedHeaderBack = (event: CustomEvent<{ tool: PanelToolsToolId }>) => {
    event.stopPropagation();
    this.dsHeaderBack.emit(event.detail);
  };

  private handleManagedHeaderAction = (
    event: CustomEvent<{ tool: PanelToolsToolId; id: string }>
  ) => {
    event.stopPropagation();
    this.dsHeaderAction.emit(event.detail);
  };

  private handleManagedRailAccessoryAction = (
    event: CustomEvent<PanelToolsRailAccessoryActionDetail>
  ) => {
    event.stopPropagation();
    this.dsRailAccessoryAction.emit(event.detail);
  };

  private handleManagedSheetToggle = (event: CustomEvent<boolean>) => {
    event.stopPropagation();
    this.managedMobileSheetNavOpen = event.detail;
  };

  private activateManagedMobileTool(destination: Exclude<MobileDestination, 'area'>): boolean {
    const canonicalId =
      destination === 'inbox'
        ? resolveAvailableInboxTool(this.managedInboxTool, this.availableInboxTools)
        : destination;
    if (!canonicalId) return false;

    const item = this.resolvedToolItems.find(
      candidate =>
        candidate.id === canonicalId ||
        (destination !== 'inbox' && candidate.mobileDestination === destination)
    );
    if (!item || item.isInactive) return false;

    const id = item.id;
    this.managedActiveTool = id;
    this.managedToolsOpen = true;
    if (itemUsesShellInbox(item)) this.managedInboxTool = id;
    this.dsToolChange.emit({ id: id as PanelToolsToolId, selected: true });
    return true;
  }

  private handleManagedMobileDestination = (event: CustomEvent<MobileBarNavDestinationDetail>) => {
    event.stopPropagation();
    const destination = event.detail.destination;
    this.managedMobileSheetNavOpen = false;
    this.managedMobileDestination = destination;

    if (destination === 'area') {
      this.managedToolsOpen = false;
      return;
    }

    this.activateManagedMobileTool(destination);
  };

  private handleManagedAreaSelect = (event: CustomEvent<string>) => {
    event.stopPropagation();
    if (event.detail === 'help') {
      this.managedMobileSheetNavOpen = false;
      this.managedMobileDestination = 'help';
      if (this.activateManagedMobileTool('help')) return;
    }

    this.managedMobileSheetNavOpen = false;
    this.managedMobileDestination = 'area';
    this.managedToolsOpen = false;
    this.dsNavSelect.emit(event.detail);
  };

  private handleManagedBrowseContext = (event: CustomEvent<NavChromeStyle>) => {
    event.stopPropagation();
    this.managedBrowseContext = event.detail;
    this.dsBrowseContextChange.emit(event.detail);
  };

  private handleManagedSheetClose = (event: CustomEvent<void>) => {
    event.stopPropagation();
    this.managedMobileSheetNavOpen = false;
  };

  private handleManagedNavFooterAction = (event: CustomEvent<void>) => {
    event.stopPropagation();
    this.dsNavFooterAction.emit();
  };

  private handleManagedNavUserAction = (event: CustomEvent<PanelNavUserActionDetail>) => {
    event.stopPropagation();
    this.dsNavUserAction.emit(event.detail);
  };

  private get currentArea(): PanelNavItem {
    const groups = [
      ...(this.navigation.dashboardGroups ?? []),
      ...(this.navigation.settingsGroups ?? []),
      ...this.resolvedNavigationGroups,
    ];
    const items = groups.flatMap(group => group.items);
    const activeId =
      this.navigation.activeId ||
      deriveActiveIdFromUrl(this.navigation.currentUrl ?? this.pageChrome.currentUrl ?? '', items);
    return (
      items.find(item => item.id === activeId) ??
      items[0] ?? {
        id: 'area',
        icon: 'MapPage',
        label: this.pageChrome.heading || 'Area',
      }
    );
  }

  private toolDot(id: PanelToolsToolId): boolean {
    return this.resolvedToolItems.find(item => item.id === id)?.dot ?? false;
  }

  private syncChrome() {
    const panelNav = this.el.querySelector('ds-panel-nav') as HTMLElement | null;
    const bar = this.el.querySelector(
      'ds-bar-nav, ds-bar-title[placement="shell-bar"]'
    ) as HTMLElement | null;
    const targets = [this.el, panelNav, bar].filter((el): el is HTMLElement => el !== null);

    const clearLayoutVars = () => {
      if (panelNav) panelNav.style.removeProperty(SHELL_GRADIENT_POSITION_PANEL_VAR);
      if (bar) bar.style.removeProperty(SHELL_GRADIENT_POSITION_BAR_VAR);
    };

    const preset = normalizeShellGradientPreset(this.gradientPreset);
    if (this.resolvedMode === 'mobile') {
      this.clearGradientPaintVars(targets);
      clearLayoutVars();
      return;
    }

    const viewport = this.resolveViewportDimensions();
    if (preset === 'none') {
      this.clearGradientPaintVars(targets);
      clearLayoutVars();
      this.syncPaperTextureLayout(viewport);
      return;
    }

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

      const isBar = target === bar;
      this.applyGradientVars(target, {
        [SHELL_GRADIENT_IMAGE_VAR]: image,
        [SHELL_GRADIENT_SIZE_VAR]: size,
        [SHELL_GRADIENT_OPACITY_VAR]: opacity,
        [SHELL_GRADIENT_POSITION_PANEL_VAR]: isBar ? null : panelPosition,
        [SHELL_GRADIENT_POSITION_BAR_VAR]: isBar ? barPosition : null,
      });
    }

    this.syncPaperTextureLayout(viewport);
  }

  private syncPaperTextureLayout(viewport: { width: number; height: number }) {
    const chrome = this.el.querySelector<HTMLElement>('.shell-app__chrome');
    const paperTexture = this.el.querySelector<HTMLElement>(
      '.shell-app__chrome > ds-paper-texture'
    );
    if (!chrome || !paperTexture) return;

    const chromeRect = chrome.getBoundingClientRect();
    paperTexture.style.setProperty('width', `${Math.round(viewport.width)}px`);
    paperTexture.style.setProperty('height', `${Math.round(viewport.height)}px`);
    paperTexture.style.setProperty('left', `${-Math.round(chromeRect.left)}px`);
    paperTexture.style.setProperty('top', `${-Math.round(chromeRect.top)}px`);
  }

  private renderPaperTexture() {
    if (!this.paperTextureLayerActive()) return null;
    return <ds-paper-texture class="shell-app__paper-texture" config={this.paperTexture} />;
  }

  private renderManagedPanelNav() {
    const navigation = this.navigation;
    return (
      <ds-panel-nav
        navStyle={this.navStyle}
        presentation={this.sectionNavigation === 'panel' ? 'nested' : 'flat'}
        groups={this.resolvedNavigationGroups}
        breakpoint={SHELL_DESKTOP_BREAKPOINT}
        routerMode={navigation.routerMode ?? 'event'}
        activeId={navigation.activeId ?? ''}
        activeChildId={this.pageChrome.value ?? ''}
        currentUrl={navigation.currentUrl ?? this.pageChrome.currentUrl ?? ''}
        storageKey={navigation.storageKey ?? ''}
        userName={navigation.userName ?? ''}
        userInitial={navigation.userInitial ?? ''}
        accountMenuExpanded={navigation.accountMenuExpanded ?? false}
        dashboardLabel={navigation.dashboardLabel ?? 'Dashboard'}
        settingsLabel={navigation.settingsLabel ?? 'Settings'}
        accountLabel={navigation.accountLabel ?? 'Account'}
        dashboardNavigationLabel={navigation.dashboardNavigationLabel ?? 'Dashboard navigation'}
        settingsNavigationLabel={navigation.settingsNavigationLabel ?? 'Settings navigation'}
        navigationItemsLabel={navigation.navigationLabel ?? 'Navigation items'}
        onDsNavSelect={this.handleManagedNavSelect}
        onDsNavChildSelect={this.handleManagedNavChildSelect}
        onDsNavFooterAction={this.handleManagedNavFooterAction}
        onDsNavUserAction={this.handleManagedNavUserAction}
      />
    );
  }

  private renderManagedBarNav() {
    return (
      <ds-bar-nav
        navStyle={this.navStyle}
        tabs={this.resolvedPageTabs}
        value={this.pageChrome.value ?? ''}
        heading={this.pageChrome.routeHeading ?? this.pageChrome.heading}
        basePath={this.pageChrome.basePath ?? ''}
        currentUrl={this.pageChrome.currentUrl ?? this.navigation.currentUrl ?? ''}
        onDsTabChange={this.handleManagedTabChange}
      />
    );
  }

  private renderManagedTopBar() {
    return this.sectionNavigation === 'panel'
      ? this.renderManagedBarTitle('shell-bar')
      : this.renderManagedBarNav();
  }

  private renderManagedToolSlots() {
    const ids = [...new Set(this.resolvedToolItems.map(item => item.id))].sort();
    return ids.flatMap(id => [
      <div key={`tool:${id}`} class="shell-app__tool-slot-proxy" slot={id}>
        <slot name={id} />
      </div>,
      <div key={`tool-view:${id}`} class="shell-app__tool-slot-proxy" slot={`${id}-view`}>
        <slot name={`${id}-view`} />
      </div>,
    ]);
  }

  private renderManagedTools() {
    const tools = this.tools;
    return (
      <ds-shell-tools
        responsiveMode={this.resolvedMode}
        open={this.managedToolsOpen}
        activeTool={this.managedActiveTool}
        presentation={this.managedToolPresentation}
        fullscreenHeaderMode={tools.fullscreenHeaderMode ?? 'shared'}
        items={this.resolvedToolItems}
        accessories={tools.accessories ?? []}
        headers={tools.headers ?? {}}
        storageKey={tools.storageKey ?? ''}
        toolsLabel={tools.toolsLabel ?? 'Tools'}
        toolShortcutsLabel={tools.toolShortcutsLabel ?? 'Tool shortcuts'}
        inboxLabel={tools.inboxLabel ?? 'Inbox'}
        inboxNavigationLabel={tools.inboxNavigationLabel ?? 'Inbox sections'}
        onDsToolChange={this.handleManagedToolChange}
        onDsPresentationChange={this.handleManagedPresentationChange}
        onDsHeaderBack={this.handleManagedHeaderBack}
        onDsHeaderAction={this.handleManagedHeaderAction}
        onDsRailAccessoryAction={this.handleManagedRailAccessoryAction}
      >
        {this.renderManagedToolSlots()}
      </ds-shell-tools>
    );
  }

  private renderManagedMobileSheetNav() {
    const navigation = this.navigation;
    return (
      <ds-mobile-sheet-nav
        open={this.managedMobileSheetNavOpen}
        browseContext={this.managedBrowseContext}
        dashboardGroups={navigation.dashboardGroups ?? navigation.groups ?? []}
        settingsGroups={navigation.settingsGroups ?? []}
        currentUrl={navigation.currentUrl ?? this.pageChrome.currentUrl ?? ''}
        routeSelectionActive={this.managedMobileDestination === 'area'}
        navigationLabel={navigation.navigationLabel ?? 'Application navigation'}
        dashboardLabel={navigation.dashboardLabel ?? 'Dashboard'}
        settingsLabel={navigation.settingsLabel ?? 'Settings'}
        accountLabel={navigation.accountLabel ?? 'Account'}
        showAccount={navigation.showMobileAccount ?? true}
        onDsAreaSelect={this.handleManagedAreaSelect}
        onDsBrowseContextChange={this.handleManagedBrowseContext}
        onDsClose={this.handleManagedSheetClose}
      />
    );
  }

  private renderManagedMobileBarNav() {
    const item = (id: PanelToolsToolId) =>
      this.resolvedToolItems.find(candidate => candidate.id === id);
    const label = (id: PanelToolsToolId, fallback: string) =>
      item(id)?.ariaLabel ?? item(id)?.label ?? fallback;
    const directActivity = this.resolvedToolItems.some(
      candidate => !candidate.isInactive && candidate.mobileDestination === 'activity'
    );

    return (
      <ds-mobile-bar-nav
        hidden={this.tools.mobileBarHidden ?? false}
        activeDestination={this.managedMobileDestination}
        currentArea={this.currentArea}
        sheetNavExpanded={this.managedMobileSheetNavOpen}
        searchLabel={label('search', 'Search')}
        activityMode={directActivity ? 'direct' : 'inbox'}
        activityLabel={label('activity', 'Activity')}
        inboxLabel={this.tools.inboxLabel ?? 'Inbox'}
        messagesLabel={label('messages', 'Messages')}
        agentsLabel={label('agents', 'Agents')}
        helpLabel={label('help', 'Help & Support')}
        searchDot={this.toolDot('search')}
        activityDot={this.toolDot('activity')}
        inboxDot={this.toolDot('stacks') || this.toolDot('activity')}
        messagesDot={this.toolDot('messages')}
        agentsDot={this.toolDot('agents')}
        onDsSheetNavToggle={this.handleManagedSheetToggle}
        onDsDestinationChange={this.handleManagedMobileDestination}
      />
    );
  }

  private renderManagedMobileLeading() {
    if (!this.pageChrome.showBack) {
      return <slot name="page-header-leading" slot="leading" />;
    }
    return [
      <ds-tooltip
        slot="leading"
        label={this.pageChrome.backAriaLabel ?? 'Back'}
        side="bottom"
        size="sm"
      >
        <ds-button-unfilled
          variant="icon"
          icon={this.pageChrome.backIcon ?? 'ChevronLeft'}
          size="md"
          aria-label={this.pageChrome.backAriaLabel ?? 'Back'}
          activeFill={false}
          hasBorder={false}
          onDsClick={(event: CustomEvent<MouseEvent>) => this.dsPageBack.emit(event.detail)}
        />
      </ds-tooltip>,
      <slot name="page-header-leading" slot="leading" />,
    ];
  }

  private renderManagedMobileActions() {
    const legacyActions = this.pageChrome.mobileActions ?? [];
    const visibleActions = visibleBarTitleActions(this.resolvedHeaderActions, 'mobile');
    return [
      ...legacyActions.map((action: PanelToolsHeaderAction) => (
        <ds-tooltip
          slot="trailing"
          key={action.id}
          label={action.ariaLabel}
          side="bottom"
          size="sm"
        >
          <ds-button-unfilled
            id={action.triggerId || undefined}
            variant="icon"
            icon={action.icon}
            size="md"
            aria-label={action.ariaLabel}
            haspopup={action.haspopup}
            controls={action.controls}
            expanded={action.expanded}
            pressed={action.pressed}
            isInactive={action.isInactive}
            activeFill={false}
            hasBorder={false}
            onDsClick={() => this.dsPageAction.emit(action.id)}
          />
        </ds-tooltip>
      )),
      ...visibleActions.map(action => {
        if (action.type !== 'icon') return null;
        const button =
          (action.appearance ?? 'unfilled') === 'filled' ? (
            <ds-button-filled
              variant="icon"
              icon={action.icon}
              aria-label={action.ariaLabel}
              size="md"
              intent={action.intent ?? 'brand'}
              contrast={action.contrast ?? 'bold'}
              isInactive={action.isInactive}
              isLoading={action.isLoading}
              onDsClick={() => this.dsPageAction.emit(action.id)}
            />
          ) : (
            <ds-button-unfilled
              variant="icon"
              icon={action.icon}
              aria-label={action.ariaLabel}
              size="md"
              isInactive={action.isInactive}
              isLoading={action.isLoading}
              activeFill={false}
              hasBorder={false}
              onDsClick={() => this.dsPageAction.emit(action.id)}
            />
          );
        return (
          <ds-tooltip slot="trailing" key={action.id} label={action.label} side="bottom" size="sm">
            {button}
          </ds-tooltip>
        );
      }),
      ...(this.mobileActionMenuSections.length > 0
        ? [
            <ds-tooltip slot="trailing" label="Page options" side="bottom" size="sm">
              <ds-button-unfilled
                ref={el => {
                  this.mobileActionTriggerEl = el ?? null;
                }}
                id={this.mobileActionMenuTriggerId}
                variant="icon"
                icon="Ellipses"
                aria-label={this.pageChrome.actionsAriaLabel ?? 'More page actions'}
                size="md"
                activeFill={false}
                hasBorder={false}
                haspopup="menu"
                controls={this.mobileActionMenuId}
                expanded={this.mobileActionMenuOpen}
                onDsClick={(event: CustomEvent<MouseEvent>) => {
                  this.mobileActionMenuInitialFocusVisible = event.detail.detail === 0;
                  this.mobileActionMenuOpen = !this.mobileActionMenuOpen;
                }}
              />
            </ds-tooltip>,
          ]
        : []),
      <slot name="page-header-trailing" slot="trailing" />,
    ];
  }

  private get resolvedHeaderActions(): BarTitleActionConfigItem[] {
    return resolveBarTitleActionItems(
      this.pageChrome.actionItems,
      this.pageChrome.primaryAction ?? null,
      this.pageChrome.actions ?? []
    );
  }

  private get mobileActionMenuSections() {
    return overflowBarTitleActionSections(this.resolvedHeaderActions, 'mobile');
  }

  private closeMobileActionMenu = () => {
    this.mobileActionMenuOpen = false;
  };

  private handleMobileActionSelect = (event: CustomEvent<MenuItemData>) => {
    const id = String(event.detail.value ?? '');
    const action = findBarTitleAction(this.resolvedHeaderActions, id);
    if (!action || action.isInactive || ('isLoading' in action && action.isLoading)) return;
    this.mobileActionMenuOpen = false;
    this.dsPageAction.emit(id);
    requestAnimationFrame(() => void this.mobileActionTriggerEl?.setFocus?.());
  };

  private renderManagedMobileActionMenu() {
    if (this.mobileActionMenuSections.length === 0) return null;
    return (
      <ds-menu
        id={this.mobileActionMenuId}
        anchorId={this.mobileActionMenuTriggerId}
        align="end"
        menuLabel={this.pageChrome.actionsAriaLabel ?? 'More page actions'}
        open={this.mobileActionMenuOpen}
        initialFocusVisible={this.mobileActionMenuInitialFocusVisible}
        sections={this.mobileActionMenuSections}
        onDsClose={this.closeMobileActionMenu}
        onDsSelect={this.handleMobileActionSelect}
      />
    );
  }

  private get barTitleSections(): BarTitleSectionItem[] {
    return (this.pageChrome.subsections ?? []).map(item =>
      'type' in item
        ? { type: 'divider' }
        : {
            id: item.id,
            label: item.label,
            isInactive: item.isInactive,
          }
    );
  }

  private renderManagedBarTitle(placement: BarTitlePlacement) {
    const page = this.pageChrome;
    return (
      <ds-bar-title
        ref={el => {
          if (el) {
            (el as HTMLElement & { actionItems?: BarTitleActionConfigItem[] }).actionItems =
              page.actionItems;
          }
        }}
        slot={placement === 'page' ? 'header' : undefined}
        placement={placement}
        variant={placement === 'shell-bar' ? 'compact' : 'expanded'}
        heading={page.heading ?? ''}
        description={page.description ?? ''}
        showBack={page.showBack ?? false}
        backAriaLabel={page.backAriaLabel ?? 'Back'}
        backLabel={page.backLabel ?? 'Back'}
        breadcrumbs={page.breadcrumbs ?? []}
        breadcrumbAriaLabel={page.breadcrumbAriaLabel ?? 'Breadcrumb'}
        sections={this.barTitleSections}
        value={page.subvalue ?? ''}
        sectionsAriaLabel={page.subsectionsAriaLabel ?? 'Change page subsection'}
        primaryAction={page.primaryAction ?? null}
        actions={page.actions ?? []}
        actionsAriaLabel={page.actionsAriaLabel ?? 'More page actions'}
        showDivider={page.showHeaderDivider ?? true}
        showCompactDivider={page.showCompactHeaderDivider}
        onDsBack={this.handleManagedPageBack}
        onDsBreadcrumbSelect={this.handleManagedBreadcrumbSelect}
        onDsSectionChange={this.handleManagedSubsectionChange}
        onDsAction={this.handleManagedPageAction}
      />
    );
  }

  private renderManagedPage() {
    const page = this.pageChrome;
    const mobileSections = page.showBack ? [] : this.resolvedPageTabs;
    return [
      <ds-shell-page
        responsiveMode={this.resolvedMode}
        headerCapacity={resolveManagedShellPageCapacity(this.resolvedMode)}
        desktopHeaderPlacement={this.sectionNavigation === 'panel' ? 'shell-bar' : 'page'}
        contentInset={page.contentInset ?? 'default'}
        contentInsetBlockStart={page.contentInsetBlockStart ?? 'default'}
        contentInsetBlockStartSize={page.contentInsetBlockStartSize}
        compactContentInsetBlockStartSize={page.compactContentInsetBlockStartSize}
        scrollCompaction={page.scrollCompaction ?? true}
        contentSurface={page.contentSurface ?? 'primary'}
      >
        {this.sectionNavigation === 'bar' ? this.renderManagedBarTitle('page') : null}
        <ds-mobile-header
          slot="mobile-header"
          heading={page.heading ?? ''}
          headingLevel={page.headingLevel ?? 'h1'}
          sections={mobileSections}
          value={page.showBack ? '' : (page.value ?? '')}
          sectionsAriaLabel={page.sectionsAriaLabel ?? 'Change page section'}
          subsections={page.subsections ?? []}
          subvalue={page.subvalue ?? ''}
          subsectionsAriaLabel={page.subsectionsAriaLabel ?? 'Change page subsection'}
          tone={page.tone ?? 'default'}
          onDsSectionChange={this.handleManagedTabChange}
          onDsSubsectionChange={this.handleManagedSubsectionChange}
        >
          {this.renderManagedMobileLeading()}
          {this.renderManagedMobileActions()}
        </ds-mobile-header>
        <slot />
      </ds-shell-page>,
      this.renderManagedMobileActionMenu(),
    ];
  }

  private renderSlottedShell(
    shellCls: Record<string, boolean>,
    mobile: boolean,
    mobileToolActive: boolean,
    mobileStageBlocked: boolean,
    fullscreen: boolean
  ) {
    return (
      <Host class={shellCls} responsive-mode={this.resolvedMode}>
        <div class="shell-app__banner">
          <slot name="banner" />
        </div>
        <div class="shell-app__row">
          <div class="shell-app__chrome" aria-hidden="true">
            {this.renderPaperTexture()}
          </div>
          <div
            class="shell-app__panel"
            aria-hidden={fullscreen ? 'true' : undefined}
            inert={fullscreen ? true : undefined}
          >
            <slot name="panel" />
          </div>
          <div class="shell-app__main">
            <div
              class="shell-app__bar"
              aria-hidden={fullscreen ? 'true' : undefined}
              inert={fullscreen ? true : undefined}
            >
              <slot name="bar" />
            </div>
            <div
              class="shell-app__tools"
              data-ds-overlay-boundary
              aria-hidden={
                mobile && (!mobileToolActive || this.mobileSheetNavOpen) ? 'true' : undefined
              }
              inert={mobile && (!mobileToolActive || this.mobileSheetNavOpen) ? true : undefined}
              hidden={mobile && !mobileToolActive}
            >
              <slot name="tools" />
            </div>
            <div
              class="shell-app__content"
              data-ds-overlay-boundary
              aria-hidden={fullscreen || mobileStageBlocked ? 'true' : undefined}
              inert={fullscreen || mobileStageBlocked ? true : undefined}
              tabIndex={0}
            >
              <slot />
            </div>
            <div
              class="shell-app__mobile-sheet-nav"
              hidden={!mobile || !this.mobileSheetNavOpen}
              aria-hidden={mobile && this.mobileSheetNavOpen ? undefined : 'true'}
              inert={mobile && this.mobileSheetNavOpen ? undefined : true}
            >
              <slot name="mobile-sheet-nav" />
            </div>
            <div class="shell-app__mobile-bar-nav" hidden={!mobile}>
              <slot name="mobile-bar-nav" />
            </div>
          </div>
        </div>
      </Host>
    );
  }

  render() {
    const chromeActive = this.chromeLayerActive();
    const gradientActive = this.gradientLayerActive();
    const paperTextureActive = this.paperTextureLayerActive();
    const mobile = this.resolvedMode === 'mobile';
    const mobileToolActive = mobile && this.effectiveMobileDestination !== 'area';
    const mobileStageBlocked = mobile && (mobileToolActive || this.effectiveMobileSheetNavOpen);
    const fullscreen = !mobile && this.toolsFullscreen;
    const shellCls: Record<string, boolean> = {
      'shell-app': true,
      'shell-app--chrome': chromeActive,
      'shell-app--gradient': gradientActive,
      'shell-app--paper-texture': paperTextureActive,
      [`shell-app--${this.navStyle}`]: true,
      [`shell-app--${this.resolvedMode}`]: true,
      'shell-app--tools-fullscreen': fullscreen,
      'shell-app--mobile-tool-active': mobileToolActive,
      'shell-app--mobile-sheet-nav-open': mobile && this.effectiveMobileSheetNavOpen,
      'shell-app--managed': this.managed,
      'shell-app--slotted': !this.managed,
    };

    if (!this.managed) {
      return this.renderSlottedShell(
        shellCls,
        mobile,
        mobileToolActive,
        mobileStageBlocked,
        fullscreen
      );
    }

    return (
      <Host class={shellCls} responsive-mode={this.resolvedMode}>
        <div class="shell-app__banner">
          <slot name="banner" />
        </div>
        <div class="shell-app__row">
          <div class="shell-app__chrome" aria-hidden="true">
            {this.renderPaperTexture()}
          </div>
          <div
            class="shell-app__panel"
            aria-hidden={fullscreen ? 'true' : undefined}
            inert={fullscreen ? true : undefined}
          >
            {this.renderManagedPanelNav()}
          </div>
          <div class="shell-app__main">
            <div
              class="shell-app__bar"
              aria-hidden={fullscreen ? 'true' : undefined}
              inert={fullscreen ? true : undefined}
            >
              {this.renderManagedTopBar()}
            </div>
            <div
              class="shell-app__tools"
              data-ds-overlay-boundary
              aria-hidden={
                mobile && (!mobileToolActive || this.effectiveMobileSheetNavOpen)
                  ? 'true'
                  : undefined
              }
              inert={
                mobile && (!mobileToolActive || this.effectiveMobileSheetNavOpen) ? true : undefined
              }
              hidden={mobile && !mobileToolActive}
            >
              {this.renderManagedTools()}
            </div>
            <div
              class="shell-app__content"
              data-ds-overlay-boundary
              aria-hidden={fullscreen || mobileStageBlocked ? 'true' : undefined}
              inert={fullscreen || mobileStageBlocked ? true : undefined}
              tabIndex={0}
            >
              {this.renderManagedPage()}
            </div>
            <div
              class="shell-app__mobile-sheet-nav"
              hidden={!mobile || !this.effectiveMobileSheetNavOpen}
              aria-hidden={mobile && this.effectiveMobileSheetNavOpen ? undefined : 'true'}
              inert={mobile && this.effectiveMobileSheetNavOpen ? undefined : true}
            >
              {this.renderManagedMobileSheetNav()}
            </div>
            <div class="shell-app__mobile-bar-nav" hidden={!mobile}>
              {this.renderManagedMobileBarNav()}
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
