import {
  Component,
  Prop,
  Event,
  EventEmitter,
  Element,
  Watch,
  State,
  h,
  Host,
} from '@stencil/core';
import type { NavChromeStyle } from '../../shell/nav-chrome';
import type { MenuItemData } from '../Menu/menu-types';
import { getSelectableTabs, isTabDivider, type TabItemTab } from '../TabGroup/tab-item-utils';
import type { BarNavTab } from './bar-nav-types';
import {
  deriveBarNavValueFromUrl,
  parseJsonArrayProp,
  shouldResyncBarNavProps,
} from './bar-nav-utils';
import {
  tabsOverflowContainer,
  tabsToOverflowMenuSections,
  trimTrailingDividers,
  visibleTabCountForWidth,
} from './bar-nav-tabs-menu-utils';
import {
  CHROME_TRANSITION_END,
  CHROME_TRANSITION_START,
  ChromeTransitionGate,
  createRafCoalescer,
  readChromeTransitionSource,
  readChromeTransitionPhase,
} from '../../shell/chrome-transition';

@Component({
  tag: 'ds-bar-nav',
  styleUrl: 'BarNav.css',
  scoped: true,
})
export class BarNav {
  /** Style slot: `dashboard` or `settings`. Colors match for now. */
  @Prop({ attribute: 'nav-style', reflect: true }) navStyle: NavChromeStyle = 'dashboard';

  @Element() el!: HTMLElement;

  /**
   * Tab items for the left section.
   * Set via JS property: `el.tabs = [...]`. Replace the array reference to update.
   */
  @Prop() tabs: BarNavTab[] = [];

  /** JSON fallback for `tabs` — useful when framework bindings don't propagate arrays. */
  @Prop({ attribute: 'tabs-json' }) tabsJson: string = '';

  /** ID of the currently active tab. Overridden when `currentUrl` + `basePath` are set. */
  @Prop({ mutable: true }) value: string = '';

  /**
   * Fallback heading shown when no tabs are provided.
   * When tabs are present the heading is hidden.
   */
  @Prop() heading: string | undefined;

  /** Section base path (e.g. `/dashboard/safety`). Used with `currentUrl` to derive `value`. */
  @Prop() basePath: string = '';

  /** Current route URL. When set with `basePath`, the active tab is derived automatically. */
  @Prop() currentUrl: string = '';
  @Prop() moreTabsLabel: string = 'More tabs';

  /** Emitted when the active tab changes. Detail = tab id. */
  @Event() dsTabChange!: EventEmitter<string>;

  @State() private resolvedTabs: BarNavTab[] = [];
  @State() private urlDerivedValue: string = '';
  @State() private hideTabsForDetailRoute = false;
  @State() private tabsCollapsed = false;
  @State() private menuOpen = false;
  @State() private menuTriggerActive = false;
  /** When false, defer showing expanded tabs or the collapsed trigger until intrinsic width is measured (avoids a one-frame flash of the full tab row on narrow viewports). */
  @State() private tabLayoutCommitted = false;
  @State() private visibleTabs: BarNavTab[] = [];
  @State() private overflowTabs: BarNavTab[] = [];
  @State() private menuInitialFocusVisible = false;
  @State() private overflowRovingFocused = false;
  @State() private focusedTabId = '';

  private static readonly HOST_PROP_SYNC_BUDGET = 8;
  private static readonly INTRINSIC_WIDTH_RETRY_MAX = 3;
  private static readonly TAB_LAYOUT_COMMIT_MAX_FRAMES = 16;
  private static readonly OVERFLOW_HYSTERESIS_PX = 8;

  private headerEl: HTMLElement | null = null;
  private triggerEl: (HTMLElement & { setFocus?: () => Promise<void> }) | null = null;
  private menuEl: HTMLDsMenuElement | null = null;
  private visibleTabListEl: HTMLElement | null = null;
  private probeTabListEl: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private intrinsicWidthRetryCount = 0;
  private tabLayoutPendingFrames = 0;
  private readonly panelNavTransition = new ChromeTransitionGate();
  private readonly panelToolsTransition = new ChromeTransitionGate();
  private readonly overflowCoalescer = createRafCoalescer(() => {
    this.updateTabsCollapsed();
  });
  private chromeTransitionShell: HTMLElement | null = null;
  /** Matches `basePath` once tabs + URL are reconciled for the active section. */
  @State() private committedSection = '';
  /** Section waiting for URL + tabs to catch up after a cross-area navigation. */
  @State() private pendingSection = '';

  private get effectiveValue(): string {
    if (this.currentUrl && this.basePath) {
      return this.urlDerivedValue;
    }
    return this.value;
  }

  private get renderedSelectableTabs(): TabItemTab[] {
    const tabs = this.hasOverflowTabs ? this.visibleTabs : this.resolvedTabs;
    return getSelectableTabs(tabs);
  }

  private get hasOverflowTabs(): boolean {
    return this.tabLayoutCommitted && this.tabsCollapsed && this.overflowTabs.length > 0;
  }

  private syncFocusedTabId(preferred: string, tabs: TabItemTab[]) {
    if (tabs.some(tab => tab.id === preferred && !tab.isInactive)) {
      this.focusedTabId = preferred;
      return;
    }
    const first = tabs.find(tab => !tab.isInactive);
    this.focusedTabId = first?.id ?? '';
  }

  private digestTabsConfig(tabs: BarNavTab[]): string {
    return tabs.map(t => (isTabDivider(t) ? '|' : t.id)).join(',');
  }

  private resetTabOverflowLayout() {
    this.tabLayoutCommitted = false;
    this.tabsCollapsed = false;
    this.menuOpen = false;
    this.menuTriggerActive = false;
    this.menuInitialFocusVisible = false;
    this.intrinsicWidthRetryCount = 0;
    this.tabLayoutPendingFrames = 0;
    this.visibleTabs = [];
    this.overflowTabs = [];
  }

  @Watch('tabs')
  @Watch('tabsJson')
  @Watch('currentUrl')
  @Watch('basePath')
  onHostPropsChange() {
    this.applyHostProps();
  }

  @Watch('value')
  @Watch('urlDerivedValue')
  onSelectionChange() {
    this.syncFocusedTabId(this.effectiveValue, this.renderedSelectableTabs);
    this.syncMenuSections();
    this.scheduleOverflowCheck();
  }

  @Watch('menuOpen')
  onMenuOpenChange(open: boolean) {
    if (this.menuEl) {
      this.menuEl.open = open;
    }
  }

  @Watch('tabsCollapsed')
  onTabsCollapsedChange(collapsed: boolean, prevCollapsed: boolean | undefined) {
    if (!collapsed) {
      this.menuOpen = false;
      this.menuTriggerActive = false;
      this.menuInitialFocusVisible = false;
      this.menuEl = null;
    }
    this.scheduleOverflowCheck();
    if (collapsed) {
      requestAnimationFrame(() => {
        this.scheduleOverflowCheck();
      });
    }
    if (collapsed || prevCollapsed === undefined || prevCollapsed === collapsed) return;
    requestAnimationFrame(() => this.scheduleOverflowCheck());
    queueMicrotask(() => this.focusVisibleSelectedTab());
  }

  componentWillLoad() {
    this.applyHostProps();
    this.syncFocusedTabId(this.effectiveValue, getSelectableTabs(this.resolvedTabs));
  }

  componentDidLoad() {
    this.syncHostPropsIfNeeded();
    this.scheduleDeferredHostPropSync();
    this.setupOverflowObserver();
    this.bindChromeTransitionListeners();
    this.scheduleOverflowCheck();
  }

  componentDidRender() {
    if (this.chromeOverflowPaused()) {
      this.syncMenuAnchor();
      return;
    }
    this.scheduleOverflowCheck();
    this.syncMenuAnchor();
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.overflowCoalescer.cancel();
    this.unbindChromeTransitionListeners();
  }

  private bindChromeTransitionListeners() {
    const shell = this.el.closest<HTMLElement>('ds-shell-app');
    if (!shell) return;
    this.chromeTransitionShell = shell;
    shell.addEventListener(CHROME_TRANSITION_START, this.onChromeTransitionStart);
    shell.addEventListener(CHROME_TRANSITION_END, this.onChromeTransitionEnd);
  }

  private unbindChromeTransitionListeners() {
    if (!this.chromeTransitionShell) return;
    this.chromeTransitionShell.removeEventListener(
      CHROME_TRANSITION_START,
      this.onChromeTransitionStart,
    );
    this.chromeTransitionShell.removeEventListener(
      CHROME_TRANSITION_END,
      this.onChromeTransitionEnd,
    );
    this.chromeTransitionShell = null;
  }

  private onChromeTransitionStart = (event: Event) => {
    const source = readChromeTransitionSource(event);
    if (source === 'panel-nav') {
      this.panelNavTransition.enter();
      return;
    }
    if (source === 'panel-tools') {
      const phase = readChromeTransitionPhase(event) ?? 'opening';
      if (phase === 'closing') {
        this.panelToolsTransition.enter();
      }
    }
  };

  private chromeOverflowPaused(): boolean {
    return this.panelNavTransition.isActive || this.panelToolsTransition.isActive;
  }

  private onChromeTransitionEnd = (event: Event) => {
    const source = readChromeTransitionSource(event);
    if (source === 'panel-nav') {
      this.panelNavTransition.exit();
      if (!this.panelNavTransition.isActive) {
        this.scheduleOverflowCheck();
      }
      return;
    }
    if (source === 'panel-tools') {
      this.panelToolsTransition.exit();
      this.scheduleOverflowCheck();
    }
  };

  /** Re-resolve props assigned by the host after componentWillLoad (Angular ngAfterViewInit). */
  private syncHostPropsIfNeeded() {
    if (shouldResyncBarNavProps(this.resolvedTabs, this.tabs, this.tabsJson)) {
      this.applyHostProps();
    } else if (this.currentUrl && this.basePath) {
      this.syncValueFromUrl();
    }
  }

  /** Poll across animation frames — host props may land without triggering @Watch. */
  private scheduleDeferredHostPropSync() {
    let remaining = BarNav.HOST_PROP_SYNC_BUDGET;
    const tick = () => {
      this.syncHostPropsIfNeeded();
      if (--remaining > 0) {
        requestAnimationFrame(tick);
      }
    };
    queueMicrotask(tick);
  }

  private setupOverflowObserver() {
    if (typeof ResizeObserver === 'undefined' || !this.headerEl) return;
    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => {
      if (this.chromeOverflowPaused()) return;
      this.scheduleOverflowCheck();
    });
    this.resizeObserver.observe(this.headerEl);
  }

  private scheduleOverflowCheck() {
    if (this.chromeOverflowPaused()) return;
    this.overflowCoalescer.schedule();
  }

  /** Width available for the tab row or collapsed trigger. */
  private getLeftZoneAvailableWidth(): number {
    if (!this.headerEl) return 0;

    const headerStyle = getComputedStyle(this.headerEl);
    const horizontalPadding =
      (parseFloat(headerStyle.paddingLeft) || 0) + (parseFloat(headerStyle.paddingRight) || 0);

    return Math.max(0, this.headerEl.clientWidth - horizontalPadding);
  }

  private getTabsIntrinsicWidth(): number {
    return this.probeTabListEl?.scrollWidth ?? 0;
  }

  private getHeaderGap(): number {
    if (!this.headerEl) return 0;
    const style = getComputedStyle(this.headerEl);
    return parseFloat(style.columnGap || style.gap) || 0;
  }

  private getOverflowTriggerReserveWidth(): number {
    if (!this.triggerEl) {
      return 40;
    }
    return this.triggerEl.getBoundingClientRect().width + this.getHeaderGap();
  }

  private getProbeTabMetrics():
    | {
        itemWidths: number[];
        itemGap: number;
        listExtraWidth: number;
      }
    | null {
    const tabList = this.probeTabListEl;
    if (!tabList) return null;

    const children = Array.from(tabList.children) as HTMLElement[];
    const itemWidths = children.map(child => child.getBoundingClientRect().width);
    if (itemWidths.length === 0 || itemWidths.some(width => width === 0)) return null;

    const style = getComputedStyle(tabList);
    const itemGap = parseFloat(style.columnGap || style.gap) || 0;
    const childrenWidth = itemWidths.reduce((sum, width) => sum + width, 0);
    const gapWidth = itemGap * Math.max(0, itemWidths.length - 1);
    const listExtraWidth = Math.max(0, tabList.scrollWidth - childrenWidth - gapWidth);

    return { itemWidths, itemGap, listExtraWidth };
  }

  private setOverflowTabLayout(visibleTabs: BarNavTab[], overflowTabs: BarNavTab[]) {
    const nextCollapsed = overflowTabs.length > 0;
    const visibleChanged =
      this.digestTabsConfig(visibleTabs) !== this.digestTabsConfig(this.visibleTabs);
    const overflowChanged =
      this.digestTabsConfig(overflowTabs) !== this.digestTabsConfig(this.overflowTabs);

    if (visibleChanged) {
      this.visibleTabs = visibleTabs;
    }
    if (overflowChanged) {
      this.overflowTabs = overflowTabs;
    }
    if (nextCollapsed !== this.tabsCollapsed) {
      this.tabsCollapsed = nextCollapsed;
      if (!nextCollapsed) {
        this.menuOpen = false;
        this.menuTriggerActive = false;
      }
    }
    this.syncFocusedTabId(
      this.effectiveValue,
      getSelectableTabs(nextCollapsed ? visibleTabs : this.resolvedTabs),
    );
  }

  private scheduleIntrinsicWidthRetry() {
    if (this.intrinsicWidthRetryCount >= BarNav.INTRINSIC_WIDTH_RETRY_MAX) return;
    this.intrinsicWidthRetryCount++;
    requestAnimationFrame(() => this.scheduleOverflowCheck());
  }

  private forceTabLayoutCommit(fallbackCollapsed: boolean) {
    this.intrinsicWidthRetryCount = 0;
    this.tabLayoutPendingFrames = 0;
    this.setOverflowTabLayout(
      fallbackCollapsed ? [] : this.resolvedTabs,
      fallbackCollapsed ? this.resolvedTabs : [],
    );
    this.tabLayoutCommitted = true;
  }

  private updateTabsCollapsed() {
    if (!this.headerEl || this.resolvedTabs.length === 0 || this.hideTabsForDetailRoute) {
      if (this.tabsCollapsed) {
        this.setOverflowTabLayout([], []);
      }
      this.intrinsicWidthRetryCount = 0;
      this.tabLayoutPendingFrames = 0;
      this.tabLayoutCommitted = true;
      return;
    }

    const metrics = this.getProbeTabMetrics();
    const intrinsicWidth = this.getTabsIntrinsicWidth();
    if (!metrics || intrinsicWidth === 0) {
      this.tabLayoutPendingFrames += 1;
      if (this.intrinsicWidthRetryCount >= BarNav.INTRINSIC_WIDTH_RETRY_MAX) {
        this.forceTabLayoutCommit(false);
      } else if (this.tabLayoutPendingFrames >= BarNav.TAB_LAYOUT_COMMIT_MAX_FRAMES) {
        this.forceTabLayoutCommit(false);
      } else {
        this.scheduleIntrinsicWidthRetry();
      }
      return;
    }
    this.intrinsicWidthRetryCount = 0;
    this.tabLayoutPendingFrames = 0;

    const shouldCollapse = tabsOverflowContainer(
      intrinsicWidth,
      this.getLeftZoneAvailableWidth(),
      this.tabsCollapsed,
      BarNav.OVERFLOW_HYSTERESIS_PX,
    );

    if (!shouldCollapse) {
      this.setOverflowTabLayout(this.resolvedTabs, []);
      this.tabLayoutCommitted = true;
      return;
    }

    const visibleCount = visibleTabCountForWidth(
      metrics.itemWidths,
      this.getLeftZoneAvailableWidth(),
      this.getOverflowTriggerReserveWidth(),
      metrics.itemGap,
      metrics.listExtraWidth,
    );
    const visibleTabs = trimTrailingDividers(this.resolvedTabs.slice(0, visibleCount));
    const overflowTabs = this.resolvedTabs.slice(visibleTabs.length);
    this.setOverflowTabLayout(visibleTabs, overflowTabs);
    this.tabLayoutCommitted = true;
  }

  private syncMenuAnchor() {
    if (!this.menuEl || !this.triggerEl || !this.hasOverflowTabs) return;
    this.menuEl.anchor = this.triggerEl;
    this.syncMenuSections();
  }

  private handleMenuSelect(e: Event) {
    const detail = (e as CustomEvent<MenuItemData>).detail;
    if (detail?.value !== undefined) {
      this.selectTab(String(detail.value));
    }
    this.menuOpen = false;
    this.menuInitialFocusVisible = false;
  }

  private handleMenuClose() {
    this.menuOpen = false;
    this.menuInitialFocusVisible = false;
  }

  private handleMenuAfterClose() {
    if (!this.menuOpen) this.menuTriggerActive = false;
  }

  /** Batch tabs/basePath/currentUrl updates so URL derivation never runs with a mixed section. */
  private incomingTabs(): BarNavTab[] {
    return this.tabsJson
      ? parseJsonArrayProp(this.tabsJson, [])
      : (this.tabs ?? []);
  }

  private applyHostProps() {
    const nextBasePath = this.basePath;
    const sectionChanged =
      nextBasePath !== '' &&
      this.committedSection !== '' &&
      nextBasePath !== this.committedSection;

    if (sectionChanged) {
      this.urlDerivedValue = '';
      this.committedSection = '';
      this.pendingSection = nextBasePath;
      this.resolvedTabs = [];
      this.resetTabOverflowLayout();
      return;
    }

    if (this.pendingSection) {
      if (!nextBasePath || nextBasePath !== this.pendingSection) {
        return;
      }
      if (!this.currentUrl.startsWith(this.pendingSection)) {
        return;
      }
      const tabs = this.incomingTabs();
      if (tabs.length === 0) {
        return;
      }
      this.pendingSection = '';
    }

    const tabs = this.incomingTabs();
    const tabsConfigChanged =
      this.digestTabsConfig(tabs) !== this.digestTabsConfig(this.resolvedTabs);

    this.resolvedTabs = tabs;
    this.syncValueFromUrl();
    this.committedSection = nextBasePath;
    if (tabsConfigChanged) {
      this.resetTabOverflowLayout();
    }
    this.scheduleOverflowCheck();
  }

  private syncMenuSections() {
    if (!this.menuEl) return;
    this.menuEl.sections = tabsToOverflowMenuSections(this.overflowTabs, this.effectiveValue);
  }

  private syncValueFromUrl() {
    const tabs = this.incomingTabs();

    if (!this.currentUrl || !this.basePath) {
      this.urlDerivedValue = '';
      this.hideTabsForDetailRoute = false;
      return;
    }

    if (!this.currentUrl.startsWith(this.basePath)) {
      this.urlDerivedValue = '';
      this.hideTabsForDetailRoute = false;
      return;
    }

    const { value, hideTabs } = deriveBarNavValueFromUrl(
      this.currentUrl,
      this.basePath,
      tabs,
    );
    this.urlDerivedValue = value;
    this.hideTabsForDetailRoute = hideTabs;
  }

  private selectTab(id: string) {
    this.value = id;
    this.dsTabChange.emit(id);
  }

  /** Move focus to the selected tab in the visible tab group (after expand). */
  private focusVisibleSelectedTab() {
    const tab = this.visibleTabListEl?.querySelector(
      `[data-tab-id="${this.effectiveValue}"]`,
    ) as HTMLElement | null;
    tab?.focus({ preventScroll: true });
  }

  private focusVisibleTab(id: string) {
    this.focusedTabId = id;
    const tab = this.visibleTabListEl?.querySelector(
      `[data-tab-id="${id}"]`,
    ) as HTMLElement | null;
    tab?.focus({ preventScroll: true });
  }

  private focusLastVisibleTab() {
    const last = [...this.renderedSelectableTabs].reverse().find(tab => !tab.isInactive);
    if (last) this.focusVisibleTab(last.id);
  }

  private findEnabledVisibleTab(from: number, step: 1 | -1): number | null {
    const tabs = this.renderedSelectableTabs;
    for (let index = from + step; index >= 0 && index < tabs.length; index += step) {
      if (!tabs[index]?.isInactive) return index;
    }
    return null;
  }

  private handleTabKeyDown(e: KeyboardEvent) {
    const tabs = this.renderedSelectableTabs;
    if (!tabs.length) return;
    const targetId = (e.target as HTMLElement | null)?.getAttribute('data-tab-id');
    const focusedId = targetId ?? this.focusedTabId;

    if (e.key === 'Enter' || e.key === ' ') {
      const focused = tabs.find(tab => tab.id === focusedId);
      if (!focused || focused.isInactive) return;
      e.preventDefault();
      this.selectTab(focused.id);
      return;
    }

    const currentIndex = tabs.findIndex(tab => tab.id === focusedId);
    if (currentIndex < 0) return;

    let nextIndex: number | null;
    if (e.key === 'ArrowRight') {
      nextIndex = this.findEnabledVisibleTab(currentIndex, 1);
      if (nextIndex === null && this.hasOverflowTabs) {
        e.preventDefault();
        this.overflowRovingFocused = true;
        void this.triggerEl?.setFocus?.();
        return;
      }
    } else if (e.key === 'ArrowLeft') {
      nextIndex = this.findEnabledVisibleTab(currentIndex, -1);
    } else if (e.key === 'Home') {
      nextIndex = tabs.findIndex(tab => !tab.isInactive);
    } else if (e.key === 'End') {
      const reversedIndex = [...tabs].reverse().findIndex(tab => !tab.isInactive);
      nextIndex = reversedIndex < 0 ? null : tabs.length - 1 - reversedIndex;
    } else {
      return;
    }

    if (nextIndex === null || nextIndex < 0 || nextIndex === currentIndex) return;
    e.preventDefault();
    this.focusVisibleTab(tabs[nextIndex].id);
  }

  private toggleTabMenu(options?: { focusVisible?: boolean }) {
    if (this.menuOpen) {
      this.menuOpen = false;
      this.menuInitialFocusVisible = false;
      return;
    }

    if (this.menuEl && this.triggerEl) {
      this.menuEl.anchor = this.triggerEl;
      this.menuEl.minWidth = '';
      this.syncMenuSections();
    }

    this.menuInitialFocusVisible = options?.focusVisible ?? false;
    this.menuTriggerActive = true;
    this.menuOpen = true;
  }

  private handleOverflowFocus = () => {
    this.overflowRovingFocused = true;
  };

  private handleOverflowBlur = () => {
    this.overflowRovingFocused = false;
  };

  private handleTriggerKeyDown(e: KeyboardEvent) {
    if (!this.hasOverflowTabs) return;

    if (!this.menuOpen) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.overflowRovingFocused = false;
        this.focusLastVisibleTab();
        return;
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggleTabMenu({ focusVisible: true });
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      this.menuOpen = false;
      this.menuInitialFocusVisible = false;
      void this.triggerEl?.setFocus?.();
    }
  }

  private renderTabList(tabs: BarNavTab[], probe: boolean) {
    return (
      <div
        role="tablist"
        class="bar-nav__tab-list"
        aria-label={this.heading}
        ref={el => {
          if (probe) {
            const next = (el as HTMLElement) ?? null;
            if (next === this.probeTabListEl) return;
            this.probeTabListEl = next;
            if (next) {
              this.intrinsicWidthRetryCount = 0;
              this.tabLayoutPendingFrames = 0;
              this.scheduleOverflowCheck();
            }
          } else {
            this.visibleTabListEl = (el as HTMLElement) ?? null;
          }
        }}
        onKeyDown={probe ? undefined : (e: KeyboardEvent) => this.handleTabKeyDown(e)}
        onFocusin={probe ? undefined : () => {
          this.overflowRovingFocused = false;
        }}
      >
        {tabs.map((tab, index) => {
          if (isTabDivider(tab)) {
            return (
              <div class="bar-nav__tab-divider" key={`divider-${index}`} aria-hidden="true">
                <div class="bar-nav__tab-divider-line" />
              </div>
            );
          }

          const isSelected = tab.id === this.effectiveValue;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              data-tab-id={tab.id}
              class={{
                'bar-nav__tab': true,
                'bar-nav__tab--selected': isSelected,
                'ds-control--md': true,
                'ds-focus-ring-inset': true,
                'ds-control-inactive': !!tab.isInactive,
              }}
              aria-selected={isSelected ? 'true' : 'false'}
              aria-disabled={tab.isInactive ? 'true' : undefined}
              aria-controls={tab.panelId ?? undefined}
              disabled={tab.isInactive}
              tabIndex={
                !probe && !this.overflowRovingFocused && tab.id === this.focusedTabId
                  ? 0
                  : -1
              }
              onClick={() => !probe && !tab.isInactive && this.selectTab(tab.id)}
              onFocus={() => {
                if (!probe) this.focusedTabId = tab.id;
              }}
            >
              <span
                class={{
                  'bar-nav__tab-label': true,
                  'bar-nav__tab-label--dot': !!tab.dot,
                }}
              >
                <ds-text as="span" variant="text-body-medium" emphasis={isSelected} color="inherit">
                  {tab.label}
                </ds-text>
                {tab.dot && (
                  <ds-badge
                    class="bar-nav__tab-dot"
                    variant="dot"
                    hasRing={false}
                    label=""
                    aria-hidden="true"
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  render() {
    // Section gating only applies when `basePath` is set (SPA section sync).
    // Tabs without a base path must still render — otherwise a single-tab bar
    // (or any non-routed tabs) silently falls through to an empty header.
    const sectionReady =
      this.basePath === '' || this.committedSection === this.basePath;
    const hasTabs =
      sectionReady && this.resolvedTabs.length > 0 && !this.hideTabsForDetailRoute;
    const tabGroupKey = this.basePath || 'no-section';
    const renderedTabs = this.hasOverflowTabs ? this.visibleTabs : this.resolvedTabs;

    return (
      <Host>
        <header
          class={{
            'bar-nav': true,
            'ds-control--md': true,
            'bar-nav--dashboard': this.navStyle === 'dashboard',
            'bar-nav--settings': this.navStyle === 'settings',
            'bar-nav--tabs-collapsed':
              hasTabs && this.hasOverflowTabs,
          }}
          ref={el => {
            this.headerEl = el as HTMLElement;
            if (el && !this.resizeObserver) {
              this.setupOverflowObserver();
            }
          }}
        >
            {hasTabs && (
              <div class="bar-nav__tabs-probe" aria-hidden="true" inert>
                <div key={`probe-${tabGroupKey}`}>
                  {this.renderTabList(this.resolvedTabs, true)}
                </div>
              </div>
            )}

            {hasTabs && this.tabLayoutCommitted && renderedTabs.length > 0 && (
              <div class="bar-nav__left">
                <div key={`visible-${tabGroupKey}`} class="bar-nav__tabs-visible">
                  {this.renderTabList(renderedTabs, false)}
                </div>
              </div>
            )}

            {hasTabs && !this.tabLayoutCommitted && (
              <div class="bar-nav__tabs-pending" aria-hidden="true" />
            )}

            {!hasTabs && this.heading && (
              <ds-text
                class="bar-nav__heading"
                lineTruncation={1}
                as="span"
                variant="text-body-medium"
                emphasis
                color="primary"
                wrap="nowrap"
              >
                {this.heading}
              </ds-text>
            )}

            {hasTabs && this.hasOverflowTabs && (
              <ds-button-unfilled variant="icon"
                class={{
                  'bar-nav__overflow-trigger': true,
                }}
                icon="Ellipses"
                activeFill={false}
                hasBorder={false}
                focusTabIndex={this.overflowRovingFocused ? 0 : -1}
                ref={(el?: HTMLDsButtonUnfilledElement) => {
                  this.triggerEl = (el as (HTMLElement & { setFocus?: () => Promise<void> })) ?? null;
                }}
                haspopup="menu"
                expanded={this.menuTriggerActive}
                aria-label={this.moreTabsLabel}
                onDsClick={() => this.toggleTabMenu({ focusVisible: false })}
                onFocusin={this.handleOverflowFocus}
                onFocusout={this.handleOverflowBlur}
                onKeyDown={(e: KeyboardEvent) => this.handleTriggerKeyDown(e)}
              />
            )}

        </header>

        {hasTabs && this.hasOverflowTabs && (
          <ds-menu
            ref={el => {
              this.menuEl = (el as HTMLDsMenuElement) ?? null;
            }}
            open={this.menuOpen}
            sections={tabsToOverflowMenuSections(this.overflowTabs, this.effectiveValue)}
            side="bottom"
            align="end"
            sideOffset="calc(var(--dimension-space-100) + var(--dimension-space-050))"
            initialFocusVisible={this.menuInitialFocusVisible}
            onDsSelect={(e: Event) => this.handleMenuSelect(e)}
            onDsClose={() => this.handleMenuClose()}
            onDsAfterClose={() => this.handleMenuAfterClose()}
          />
        )}
      </Host>
    );
  }
}
