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
import {
  isEditableShortcutTarget,
  resolveShellShortcut,
} from '../../shell/shell-shortcuts';
import type {
  PanelToolsToolId,
  PanelToolsHeaderAction,
} from '../PanelTools/panel-tools-types';
import { PANEL_TOOLS_DEFAULT_ITEMS } from '../PanelTools/panel-tools-types';
import type { BarTitleSectionItem } from '../BarTitle/bar-title-types';
import type { BreadcrumbSelectDetail } from '../Breadcrumb/breadcrumb-types';
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
  isShellInboxTool,
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
import type { PanelNavItem } from '../PanelNav/panel-nav-types';
import type { PanelNavUserActionDetail } from '../PanelNav/panel-nav-types';
import type { MobileBarNavDestinationDetail } from '../MobileBarNav/mobile-bar-nav-types';
import type {
  ShellAppComposition,
  ShellNavigationConfig,
  ShellPageChromeConfig,
  ShellToolsConfig,
} from './shell-app-types';

@Component({
  tag: 'ds-shell-app',
  styleUrl: 'ShellApp.css',
  scoped: true,
})
export class ShellApp {
  /** Managed renders the complete responsive chrome; slotted exposes the advanced composition. */
  @Prop({ reflect: true }) composition: ShellAppComposition = 'managed';

  /** Router-owned navigation data used by managed composition. */
  @Prop() navigation: ShellNavigationConfig = {};

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

  private get availableInboxTools(): ShellInboxToolId[] {
    return this.resolvedToolItems
      .filter(
        item =>
          !item.isInactive &&
          (item.mobileDestination === 'inbox' || isShellInboxTool(item.id))
      )
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

  @Watch('navigation')
  handleNavigationChange() {
    this.managedBrowseContext = this.navigation.browseContext ?? this.navStyle;
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
    if (
      previous === true &&
      !this.effectiveMobileSheetNavOpen &&
      this.resolvedMode === 'mobile'
    ) {
      requestAnimationFrame(() => {
        const bar = this.el.querySelector('ds-mobile-bar-nav') as
          | (HTMLElement & {
              focusDestination?: (
                destination: MobileDestination | 'sheet-nav'
              ) => Promise<void>;
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

  private handleManagedTabChange = (event: CustomEvent<string>) => {
    event.stopPropagation();
    this.dsTabChange.emit(event.detail);
  };

  private handleManagedPageBack = (event: CustomEvent<MouseEvent>) => {
    event.stopPropagation();
    this.dsPageBack.emit(event.detail);
  };

  private handleManagedBreadcrumbSelect = (
    event: CustomEvent<BreadcrumbSelectDetail>
  ) => {
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
    if (item?.mobileDestination === 'inbox' || isShellInboxTool(id)) {
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

  private handleManagedSheetToggle = (event: CustomEvent<boolean>) => {
    event.stopPropagation();
    this.managedMobileSheetNavOpen = event.detail;
    if (event.detail) {
      this.managedMobileDestination = 'area';
      this.managedToolsOpen = false;
    }
  };

  private handleManagedMobileDestination = (
    event: CustomEvent<MobileBarNavDestinationDetail>
  ) => {
    event.stopPropagation();
    const destination = event.detail.destination;
    this.managedMobileSheetNavOpen = false;
    this.managedMobileDestination = destination;

    if (destination === 'area') {
      this.managedToolsOpen = false;
      return;
    }

    const canonicalId =
      destination === 'inbox'
        ? resolveAvailableInboxTool(this.managedInboxTool, this.availableInboxTools)
        : destination;
    if (!canonicalId) return;

    const item = this.resolvedToolItems.find(
      candidate =>
        candidate.id === canonicalId ||
        (destination !== 'inbox' && candidate.mobileDestination === destination)
    );
    if (!item || item.isInactive) return;
    const id = item.id;
    this.managedActiveTool = id;
    this.managedToolsOpen = true;
    if (isShellInboxTool(id)) this.managedInboxTool = id;
    this.dsToolChange.emit({ id: id as PanelToolsToolId, selected: true });
  };

  private handleManagedAreaSelect = (event: CustomEvent<string>) => {
    event.stopPropagation();
    this.managedMobileSheetNavOpen = false;
    this.managedMobileDestination = 'area';
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

  private handleManagedNavUserAction = (
    event: CustomEvent<PanelNavUserActionDetail>
  ) => {
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
      deriveActiveIdFromUrl(
        this.navigation.currentUrl ?? this.pageChrome.currentUrl ?? '',
        items
      );
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

  private renderManagedPanelNav() {
    const navigation = this.navigation;
    return (
      <ds-panel-nav
        navStyle={this.navStyle}
        groups={this.resolvedNavigationGroups}
        breakpoint={SHELL_DESKTOP_BREAKPOINT}
        routerMode={navigation.routerMode ?? 'event'}
        activeId={navigation.activeId ?? ''}
        currentUrl={navigation.currentUrl ?? this.pageChrome.currentUrl ?? ''}
        storageKey={navigation.storageKey ?? ''}
        userName={navigation.userName ?? ''}
        userInitial={navigation.userInitial ?? ''}
        accountMenuExpanded={navigation.accountMenuExpanded ?? false}
        dashboardLabel={navigation.dashboardLabel ?? 'Dashboard'}
        settingsLabel={navigation.settingsLabel ?? 'Settings'}
        accountLabel={navigation.accountLabel ?? 'Account'}
        dashboardNavigationLabel={
          navigation.dashboardNavigationLabel ?? 'Dashboard navigation'
        }
        settingsNavigationLabel={
          navigation.settingsNavigationLabel ?? 'Settings navigation'
        }
        navigationItemsLabel={navigation.navigationLabel ?? 'Navigation items'}
        onDsNavSelect={this.handleManagedNavSelect}
        onDsNavFooterAction={this.handleManagedNavFooterAction}
        onDsNavUserAction={this.handleManagedNavUserAction}
      />
    );
  }

  private renderManagedBarNav() {
    return (
      <ds-bar-nav
        navStyle={this.navStyle}
        tabs={this.pageChrome.tabs ?? []}
        value={this.pageChrome.value ?? ''}
        heading={this.pageChrome.routeHeading ?? this.pageChrome.heading}
        basePath={this.pageChrome.basePath ?? ''}
        currentUrl={this.pageChrome.currentUrl ?? this.navigation.currentUrl ?? ''}
        onDsTabChange={this.handleManagedTabChange}
      />
    );
  }

  private renderManagedToolSlots() {
    const ids = this.resolvedToolItems.map(item => item.id);
    return ids.flatMap(id => [
      <slot name={id} slot={id} />,
      <slot name={`${id}-view`} slot={`${id}-view`} />,
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
        navigationLabel={navigation.navigationLabel ?? 'Application navigation'}
        dashboardLabel={navigation.dashboardLabel ?? 'Dashboard'}
        settingsLabel={navigation.settingsLabel ?? 'Settings'}
        accountLabel={navigation.accountLabel ?? 'Account'}
        onDsAreaSelect={this.handleManagedAreaSelect}
        onDsBrowseContextChange={this.handleManagedBrowseContext}
        onDsClose={this.handleManagedSheetClose}
      />
    );
  }

  private renderManagedMobileBarNav() {
    return (
      <ds-mobile-bar-nav
        hidden={this.tools.mobileBarHidden ?? false}
        activeDestination={this.managedMobileDestination}
        currentArea={this.currentArea}
        sheetNavExpanded={this.managedMobileSheetNavOpen}
        searchLabel={this.tools.items?.find(item => item.id === 'search')?.ariaLabel ?? 'Search'}
        agentsLabel={this.tools.items?.find(item => item.id === 'agents')?.ariaLabel ?? 'Agents'}
        inboxLabel={this.tools.inboxLabel ?? 'Inbox'}
        helpLabel={this.tools.items?.find(item => item.id === 'help')?.ariaLabel ?? 'Help & Support'}
        searchDot={this.toolDot('search')}
        agentsDot={this.toolDot('agents')}
        inboxDot={
          this.toolDot('messages') || this.toolDot('stacks') || this.toolDot('activity')
        }
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
          onDsClick={(event: CustomEvent<MouseEvent>) =>
            this.dsPageBack.emit(event.detail)
          }
        />
      </ds-tooltip>,
      <slot name="page-header-leading" slot="leading" />,
    ];
  }

  private renderManagedMobileActions() {
    const actions = this.pageChrome.mobileActions ?? [];
    return [
      ...actions.map((action: PanelToolsHeaderAction) => (
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
            isActive={!!action.expanded}
            isInactive={action.isInactive}
            activeFill={false}
            hasBorder={false}
            onDsClick={() => this.dsPageAction.emit(action.id)}
          />
        </ds-tooltip>
      )),
      <slot name="page-header-trailing" slot="trailing" />,
    ];
  }

  private renderManagedPage() {
    const page = this.pageChrome;
    const mobileSections = page.showBack ? [] : (page.tabs ?? []);
    const barTitleSections: BarTitleSectionItem[] = (page.subsections ?? []).map(item =>
      'type' in item
        ? { type: 'divider' }
        : {
            id: item.id,
            label: item.label,
            isInactive: item.isInactive,
          }
    );
    return (
      <ds-shell-page
        responsiveMode={this.resolvedMode}
        headerCapacity={resolveManagedShellPageCapacity(
          this.resolvedMode,
          this.managedToolsOpen
        )}
        contentInset={page.contentInset ?? 'default'}
      >
        <ds-bar-title
          slot="header"
          heading={page.heading ?? ''}
          description={page.description ?? ''}
          showBack={page.showBack ?? false}
          backAriaLabel={page.backAriaLabel ?? 'Back'}
          backLabel={page.backLabel ?? 'Back'}
          breadcrumbs={page.breadcrumbs ?? []}
          breadcrumbAriaLabel={page.breadcrumbAriaLabel ?? 'Breadcrumb'}
          sections={barTitleSections}
          value={page.subvalue ?? ''}
          sectionsAriaLabel={page.subsectionsAriaLabel ?? 'Change page subsection'}
          primaryAction={page.primaryAction ?? null}
          actions={page.actions ?? []}
          actionsAriaLabel={page.actionsAriaLabel ?? 'More page actions'}
          onDsBack={this.handleManagedPageBack}
          onDsBreadcrumbSelect={this.handleManagedBreadcrumbSelect}
          onDsSectionChange={this.handleManagedSubsectionChange}
          onDsAction={this.handleManagedPageAction}
        />
        <ds-mobile-header
          slot="mobile-header"
          heading={page.heading ?? ''}
          headingLevel={page.headingLevel ?? 'h1'}
          sections={mobileSections}
          value={page.showBack ? '' : (page.value ?? '')}
          sectionsAriaLabel={page.sectionsAriaLabel ?? 'Change page section'}
          subsections={page.subsections ?? []}
          subvalue={page.subvalue ?? ''}
          subsectionsAriaLabel={
            page.subsectionsAriaLabel ?? 'Change page subsection'
          }
          tone={page.tone ?? 'default'}
          onDsSectionChange={this.handleManagedTabChange}
          onDsSubsectionChange={this.handleManagedSubsectionChange}
        >
          {this.renderManagedMobileLeading()}
          {this.renderManagedMobileActions()}
        </ds-mobile-header>
        <slot />
      </ds-shell-page>
    );
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
          <div class="shell-app__chrome" aria-hidden="true" />
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
              aria-hidden={
                mobile && (!mobileToolActive || this.mobileSheetNavOpen)
                  ? 'true'
                  : undefined
              }
              inert={
                mobile && (!mobileToolActive || this.mobileSheetNavOpen)
                  ? true
                  : undefined
              }
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
              class="shell-app__mobile-sheet-nav"
              hidden={!mobile || !this.mobileSheetNavOpen}
              aria-hidden={
                mobile && this.mobileSheetNavOpen ? undefined : 'true'
              }
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
    const mobile = this.resolvedMode === 'mobile';
    const mobileToolActive = mobile && this.effectiveMobileDestination !== 'area';
    const mobileStageBlocked =
      mobile && (mobileToolActive || this.effectiveMobileSheetNavOpen);
    const fullscreen = !mobile && this.toolsFullscreen;
    const shellCls: Record<string, boolean> = {
      'shell-app': true,
      'shell-app--gradient': chromeActive,
      [`shell-app--${this.navStyle}`]: true,
      [`shell-app--${this.resolvedMode}`]: true,
      'shell-app--tools-fullscreen': fullscreen,
      'shell-app--mobile-tool-active': mobileToolActive,
      'shell-app--mobile-sheet-nav-open':
        mobile && this.effectiveMobileSheetNavOpen,
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
          <div class="shell-app__chrome" aria-hidden="true" />
          <div class="shell-app__panel" aria-hidden={fullscreen ? 'true' : undefined} inert={fullscreen ? true : undefined}>
            {this.renderManagedPanelNav()}
          </div>
          <div class="shell-app__main">
            <div class="shell-app__bar" aria-hidden={fullscreen ? 'true' : undefined} inert={fullscreen ? true : undefined}>
              {this.renderManagedBarNav()}
            </div>
            <div
              class="shell-app__tools"
              aria-hidden={
                mobile && (!mobileToolActive || this.effectiveMobileSheetNavOpen)
                  ? 'true'
                  : undefined
              }
              inert={
                mobile && (!mobileToolActive || this.effectiveMobileSheetNavOpen)
                  ? true
                  : undefined
              }
              hidden={mobile && !mobileToolActive}
            >
              {this.renderManagedTools()}
            </div>
            <div
              class="shell-app__content"
              aria-hidden={fullscreen || mobileStageBlocked ? 'true' : undefined}
              inert={fullscreen || mobileStageBlocked ? true : undefined}
            >
              {this.renderManagedPage()}
            </div>
            <div
              class="shell-app__mobile-sheet-nav"
              hidden={!mobile || !this.effectiveMobileSheetNavOpen}
              aria-hidden={
                mobile && this.effectiveMobileSheetNavOpen ? undefined : 'true'
              }
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
