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
import type { NavChromeStyle } from '../../nav/nav-chrome';
import type { MenuItemData } from '../Menu/menu-types';
import { isTabDivider } from '../TabGroup/tab-item-utils';
import type { BarNavTab } from './bar-nav-types';
import {
  deriveBarNavValueFromUrl,
  parseJsonArrayProp,
  shouldResyncBarNavProps,
} from './bar-nav-utils';
import {
  getTabListFromTabGroup,
  queryWithinComponentHost,
  type QueryableHost,
} from './bar-nav-dom-utils';
import {
  tabsOverflowContainer,
  tabsToOverflowMenuSections,
  trimTrailingDividers,
  visibleTabCountForWidth,
} from './bar-nav-tabs-menu-utils';
import {
  CHROME_TRANSITION_END,
  CHROME_TRANSITION_START,
  ChromeTransitionDepth,
  createRafCoalescer,
  readChromeTransitionSource,
  readChromeTransitionPhase,
} from '../../nav/chrome-transition';

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

  /** Emitted when the active tab changes. Detail = tab id. */
  @Event() dsTabChange!: EventEmitter<string>;

  @State() private resolvedTabs: BarNavTab[] = [];
  @State() private urlDerivedValue: string = '';
  @State() private hideTabsForDetailRoute = false;
  @State() private tabsCollapsed = false;
  @State() private menuOpen = false;
  /** When false, defer showing expanded tabs or the collapsed trigger until intrinsic width is measured (avoids a one-frame flash of the full tab row on narrow viewports). */
  @State() private tabLayoutCommitted = false;
  @State() private visibleTabs: BarNavTab[] = [];
  @State() private overflowTabs: BarNavTab[] = [];
  @State() private menuInitialFocusVisible = false;
  @State() private overflowRovingFocused = false;

  private static readonly HOST_PROP_SYNC_BUDGET = 8;
  private static readonly INTRINSIC_WIDTH_RETRY_MAX = 3;
  private static readonly TAB_LAYOUT_COMMIT_MAX_FRAMES = 16;
  private static readonly OVERFLOW_HYSTERESIS_PX = 8;

  private headerEl: HTMLElement | null = null;
  private triggerEl: (HTMLElement & { setFocus?: () => Promise<void> }) | null = null;
  private menuEl: HTMLDsMenuElement | null = null;
  private visibleTabGroupEl: HTMLDsTabGroupNavElement | null = null;
  private probeTabGroupEl: QueryableHost | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private intrinsicWidthRetryCount = 0;
  private tabLayoutPendingFrames = 0;
  private readonly panelNavTransition = new ChromeTransitionDepth();
  private readonly panelToolsTransition = new ChromeTransitionDepth();
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

  private get hasOverflowTabs(): boolean {
    return this.tabLayoutCommitted && this.tabsCollapsed && this.overflowTabs.length > 0;
  }

  private digestTabsConfig(tabs: BarNavTab[]): string {
    return tabs.map(t => (isTabDivider(t) ? '|' : t.id)).join(',');
  }

  private resetTabOverflowLayout() {
    this.tabLayoutCommitted = false;
    this.tabsCollapsed = false;
    this.menuOpen = false;
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
    const shell = this.el.closest('ds-app-shell');
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
    const tabList = getTabListFromTabGroup(this.probeTabGroupEl);
    return tabList?.scrollWidth ?? 0;
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
    const tabList = getTabListFromTabGroup(this.probeTabGroupEl);
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
      }
    }
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
    const tab = queryWithinComponentHost(
      this.visibleTabGroupEl,
      `[data-tab-id="${this.effectiveValue}"]`,
    );
    tab?.focus({ preventScroll: true });
  }

  private handleTabChange(e: Event) {
    this.selectTab((e as CustomEvent<string>).detail);
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
    this.menuOpen = true;
  }

  private handleTabRovingExit(e: CustomEvent<'start' | 'end'>) {
    if (e.detail !== 'end' || !this.hasOverflowTabs) return;
    this.overflowRovingFocused = true;
    void this.triggerEl?.setFocus?.();
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
        void this.visibleTabGroupEl?.focusLastTab();
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

  render() {
    const sectionReady =
      this.basePath !== '' && this.committedSection === this.basePath;
    const hasTabs =
      sectionReady && this.resolvedTabs.length > 0 && !this.hideTabsForDetailRoute;
    const tabGroupKey = this.basePath || 'no-section';
    const renderedTabs = this.hasOverflowTabs ? this.visibleTabs : this.resolvedTabs;

    return (
      <Host>
        <header
          class={{
            'bar-nav': true,
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
                <ds-tab-group-nav
                  key={`probe-${tabGroupKey}`}
                  ref={el => {
                    const next = el ?? null;
                    if (next === this.probeTabGroupEl) return;
                    this.probeTabGroupEl = next;
                    if (next) {
                      this.intrinsicWidthRetryCount = 0;
                      this.tabLayoutPendingFrames = 0;
                      this.scheduleOverflowCheck();
                    }
                  }}
                  tabs={this.resolvedTabs}
                  value={this.effectiveValue}
                />
              </div>
            )}

            {hasTabs && this.tabLayoutCommitted && renderedTabs.length > 0 && (
              <div class="bar-nav__left">
                <ds-tab-group-nav
                  key={`visible-${tabGroupKey}`}
                  class="bar-nav__tabs-visible"
                  ref={el => {
                    this.visibleTabGroupEl = el ?? null;
                  }}
                  tabs={renderedTabs}
                  value={this.effectiveValue}
                  selectionFollowsFocus={false}
                  rovingEnabled={!this.overflowRovingFocused}
                  onDsChange={(e: Event) => this.handleTabChange(e)}
                  onDsRovingExit={(e: CustomEvent<'start' | 'end'>) => this.handleTabRovingExit(e)}
                  onFocusin={() => {
                    this.overflowRovingFocused = false;
                  }}
                />
              </div>
            )}

            {hasTabs && !this.tabLayoutCommitted && (
              <div class="bar-nav__tabs-pending" aria-hidden="true" />
            )}

            {!hasTabs && this.heading && (
              <span class="bar-nav__heading text-body-medium-emphasis">{this.heading}</span>
            )}

            {hasTabs && this.hasOverflowTabs && (
              <ds-button-unfilled variant="icon"
                class={{
                  'bar-nav__overflow-trigger': true,
                }}
                icon="Ellipses"
                isActive={this.menuOpen}
                activeFill={false}
                focusTabIndex={this.overflowRovingFocused ? 0 : -1}
                ref={(el?: HTMLDsButtonUnfilledElement) => {
                  this.triggerEl = (el as (HTMLElement & { setFocus?: () => Promise<void> })) ?? null;
                }}
                haspopup="menu"
                expanded={this.menuOpen}
                aria-label="More tabs"
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
            alignOffset="var(--dimension-space-050)"
            initialFocusVisible={this.menuInitialFocusVisible}
            onDsSelect={(e: Event) => this.handleMenuSelect(e)}
            onDsClose={() => this.handleMenuClose()}
          />
        )}
      </Host>
    );
  }
}
