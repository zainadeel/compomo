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
import type { BarNavActionItem, BarNavTab } from './bar-nav-types';
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
  getActiveTab,
  getActiveTabLabel,
  tabsOverflowContainer,
  tabsToMenuSections,
} from './bar-nav-tabs-menu-utils';
import {
  CHROME_TRANSITION_END,
  CHROME_TRANSITION_START,
  ChromeTransitionDepth,
  createRafCoalescer,
  readChromeTransitionSource,
} from '../../nav/chrome-transition';
import { readCssVarWidthPx } from '../../nav/shell-chrome-metrics';

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
   * Action items rendered in the right section.
   * Set via JS property: `el.actions = [...]`. Replace the array reference to update.
   */
  @Prop() actions: BarNavActionItem[] = [];

  /** JSON fallback for `actions` — useful when framework bindings don't propagate arrays. */
  @Prop({ attribute: 'actions-json' }) actionsJson: string = '';

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

  /** Emitted when an action button is toggled. Detail = { id, selected }. */
  @Event() dsActionChange!: EventEmitter<{ id: string; selected: boolean }>;

  @State() private resolvedTabs: BarNavTab[] = [];
  @State() private resolvedActions: BarNavActionItem[] = [];
  @State() private urlDerivedValue: string = '';
  @State() private hideTabsForDetailRoute = false;
  @State() private tabsCollapsed = false;
  @State() private menuOpen = false;
  /** When false, defer showing expanded tabs or the collapsed trigger until intrinsic width is measured (avoids a one-frame flash of the full tab row on narrow viewports). */
  @State() private tabLayoutCommitted = false;
  @State() private triggerLabelTruncated = false;

  private static readonly HOST_PROP_SYNC_BUDGET = 8;
  private static readonly INTRINSIC_WIDTH_RETRY_MAX = 3;
  private static readonly OVERFLOW_HYSTERESIS_PX = 8;

  private headerEl: HTMLElement | null = null;
  private triggerEl: HTMLButtonElement | null = null;
  private triggerLabelTextEl: HTMLElement | null = null;
  private triggerLabelObserver: ResizeObserver | null = null;
  private menuEl: HTMLDsMenuElement | null = null;
  private visibleTabGroupEl: QueryableHost | null = null;
  private probeTabGroupEl: QueryableHost | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private intrinsicWidthRetryCount = 0;
  private readonly panelNavTransition = new ChromeTransitionDepth();
  private readonly overflowCoalescer = createRafCoalescer(() => {
    this.updateTabsCollapsed();
    this.updateTriggerLabelTruncation();
  });
  private chromeTransitionShell: HTMLElement | null = null;
  private toolsDrawerOpening = false;
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

  private get activeTabLabel(): string {
    return getActiveTabLabel(this.resolvedTabs, this.effectiveValue);
  }

  private get activeTabHasDot(): boolean {
    return !!getActiveTab(this.resolvedTabs, this.effectiveValue)?.dot;
  }

  @Watch('tabs')
  @Watch('tabsJson')
  @Watch('actions')
  @Watch('actionsJson')
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
      this.menuEl = null;
      this.triggerLabelTruncated = false;
      this.syncTriggerLabelObserver();
    }
    this.scheduleOverflowCheck();
    if (collapsed) {
      requestAnimationFrame(() => {
        this.scheduleOverflowCheck();
        this.syncTriggerLabelObserver();
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
    if (this.panelNavTransition.isActive) {
      this.syncMenuAnchor();
      return;
    }
    this.scheduleOverflowCheck();
    this.syncMenuAnchor();
    if (this.tabsCollapsed) {
      this.updateTriggerLabelTruncation();
    }
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.overflowCoalescer.cancel();
    this.syncTriggerLabelObserver(true);
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
      this.toolsDrawerOpening = true;
      this.el.classList.add('bar-nav--tools-drawer-opening');
      if (this.resolvedTabs.length > 0 && !this.hideTabsForDetailRoute) {
        this.tabsCollapsed = true;
        this.menuOpen = false;
      }
      this.scheduleOverflowCheck();
    }
  };

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
      this.toolsDrawerOpening = false;
      this.el.classList.remove('bar-nav--tools-drawer-opening');
      this.scheduleOverflowCheck();
    }
  };

  /** Re-resolve props assigned by the host after componentWillLoad (Angular ngAfterViewInit). */
  private syncHostPropsIfNeeded() {
    if (
      shouldResyncBarNavProps(
        this.resolvedTabs,
        this.tabs,
        this.tabsJson,
        this.resolvedActions,
        this.actions,
        this.actionsJson,
      )
    ) {
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
      if (this.panelNavTransition.isActive) return;
      this.scheduleOverflowCheck();
    });
    this.resizeObserver.observe(this.headerEl);
  }

  private scheduleOverflowCheck() {
    if (this.panelNavTransition.isActive) return;
    this.overflowCoalescer.schedule();
  }

  private syncTriggerLabelObserver(disconnectOnly = false) {
    this.triggerLabelObserver?.disconnect();
    this.triggerLabelObserver = null;

    if (disconnectOnly || !this.tabsCollapsed || !this.triggerLabelTextEl) {
      return;
    }

    this.updateTriggerLabelTruncation();

    if (typeof ResizeObserver === 'undefined') return;

    this.triggerLabelObserver = new ResizeObserver(() => this.updateTriggerLabelTruncation());
    this.triggerLabelObserver.observe(this.triggerLabelTextEl);
    if (this.triggerEl) {
      this.triggerLabelObserver.observe(this.triggerEl);
    }
  }

  private updateTriggerLabelTruncation() {
    const el = this.triggerLabelTextEl;
    if (!el || !this.tabsCollapsed) {
      if (this.triggerLabelTruncated) {
        this.triggerLabelTruncated = false;
      }
      return;
    }

    const truncated = el.scrollWidth > el.clientWidth + 1;
    if (truncated !== this.triggerLabelTruncated) {
      this.triggerLabelTruncated = truncated;
    }
  }

  /** Width left for tabs after actions. */
  private getLeftZoneAvailableWidth(): number {
    if (!this.headerEl) return 0;

    const headerStyle = getComputedStyle(this.headerEl);
    const gap = parseFloat(headerStyle.columnGap || headerStyle.gap || '0') || 0;
    const actionsEl = this.headerEl.querySelector('.bar-nav__actions') as HTMLElement | null;
    const actionsWidth = actionsEl?.offsetWidth ?? 0;
    const horizontalPadding =
      (parseFloat(headerStyle.paddingLeft) || 0) + (parseFloat(headerStyle.paddingRight) || 0);
    const spacing = this.tabsCollapsed
      ? parseFloat(
          getComputedStyle(this.headerEl).getPropertyValue('--dimension-space-100').trim(),
        ) || 8
      : actionsEl
        ? gap
        : 0;
    const available =
      this.headerEl.clientWidth - horizontalPadding - actionsWidth - spacing;

    return Math.max(0, available - this.toolsDrawerOpeningReservePx());
  }

  /** While the tools drawer is opening, reserve width not yet claimed by flex shrink. */
  private toolsDrawerOpeningReservePx(): number {
    if (!this.toolsDrawerOpening) return 0;

    const tools = this.el.closest('ds-app-shell')?.querySelector('ds-panel-tools') as HTMLElement | null;
    if (!tools) return 0;

    const drawerTarget = readCssVarWidthPx(tools, '--_panel-tools-drawer-width');
    const drawerNow =
      tools.querySelector('.panel-tools__drawer')?.getBoundingClientRect().width ?? 0;
    return Math.max(0, drawerTarget - drawerNow);
  }

  private getTabsIntrinsicWidth(): number {
    const tabList = getTabListFromTabGroup(this.probeTabGroupEl);
    return tabList?.scrollWidth ?? 0;
  }

  private scheduleIntrinsicWidthRetry() {
    if (this.intrinsicWidthRetryCount >= BarNav.INTRINSIC_WIDTH_RETRY_MAX) return;
    this.intrinsicWidthRetryCount++;
    requestAnimationFrame(() => this.scheduleOverflowCheck());
  }

  private updateTabsCollapsed() {
    if (!this.headerEl || this.resolvedTabs.length === 0 || this.hideTabsForDetailRoute) {
      if (this.tabsCollapsed) {
        this.tabsCollapsed = false;
        this.menuOpen = false;
      }
      this.intrinsicWidthRetryCount = 0;
      return;
    }

    const intrinsicWidth = this.getTabsIntrinsicWidth();
    if (intrinsicWidth === 0) {
      this.scheduleIntrinsicWidthRetry();
      return;
    }
    this.intrinsicWidthRetryCount = 0;

    const shouldCollapse = tabsOverflowContainer(
      intrinsicWidth,
      this.getLeftZoneAvailableWidth(),
      this.tabsCollapsed,
      BarNav.OVERFLOW_HYSTERESIS_PX,
    );

    if (shouldCollapse !== this.tabsCollapsed) {
      this.tabsCollapsed = shouldCollapse;
      if (!shouldCollapse) {
        this.menuOpen = false;
      }
    }
  }

  private syncMenuAnchor() {
    if (!this.menuEl || !this.triggerEl || !this.tabsCollapsed) return;
    this.menuEl.anchor = this.triggerEl;
    this.syncMenuSections();
  }

  private handleMenuSelect(e: Event) {
    const detail = (e as CustomEvent<MenuItemData>).detail;
    if (detail?.value !== undefined) {
      this.selectTab(String(detail.value));
    }
    this.menuOpen = false;
  }

  private handleMenuClose() {
    this.menuOpen = false;
  }

  /** Batch tabs/basePath/currentUrl updates so URL derivation never runs with a mixed section. */
  private incomingTabs(): BarNavTab[] {
    return this.tabsJson
      ? parseJsonArrayProp(this.tabsJson, [])
      : (this.tabs ?? []);
  }

  private incomingActions(): BarNavActionItem[] {
    return this.actionsJson
      ? parseJsonArrayProp(this.actionsJson, [])
      : (this.actions ?? []);
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
      this.resolvedActions = this.incomingActions();
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

    this.resolvedTabs = this.incomingTabs();
    this.resolvedActions = this.incomingActions();
    this.syncValueFromUrl();
    this.committedSection = nextBasePath;
    this.intrinsicWidthRetryCount = 0;
    this.scheduleOverflowCheck();
  }

  private syncMenuSections() {
    if (!this.menuEl) return;
    this.menuEl.sections = tabsToMenuSections(this.resolvedTabs, this.effectiveValue);
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

  private handleActionChange(actionId: string, e: Event) {
    const selected = (e as CustomEvent<boolean>).detail;
    this.dsActionChange.emit({ id: actionId, selected });
  }

  private toggleTabMenu() {
    if (this.menuOpen) {
      this.menuOpen = false;
      return;
    }

    if (this.menuEl && this.triggerEl) {
      this.menuEl.anchor = this.triggerEl;
      this.menuEl.minWidth = `${this.triggerEl.offsetWidth}px`;
      this.syncMenuSections();
    }

    this.menuOpen = true;
  }

  private handleTriggerKeyDown(e: KeyboardEvent) {
    if (!this.tabsCollapsed) return;

    if (!this.menuOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggleTabMenu();
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      this.menuOpen = false;
      this.triggerEl?.focus();
    }
  }

  render() {
    const sectionReady =
      this.basePath !== '' && this.committedSection === this.basePath;
    const hasTabs =
      sectionReady && this.resolvedTabs.length > 0 && !this.hideTabsForDetailRoute;
    const tabGroupKey = this.basePath || 'no-section';

    return (
      <Host>
        <header
          class={{
            'bar-nav': true,
            'bar-nav--dashboard': this.navStyle === 'dashboard',
            'bar-nav--settings': this.navStyle === 'settings',
            'bar-nav--tabs-collapsed': hasTabs && this.tabsCollapsed,
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
                    this.probeTabGroupEl = el ?? null;
                    if (el) {
                      this.intrinsicWidthRetryCount = 0;
                      this.scheduleOverflowCheck();
                    }
                  }}
                  tabs={this.resolvedTabs}
                  value={this.effectiveValue}
                />
              </div>
            )}

            {hasTabs && !this.tabsCollapsed && (
              <div class="bar-nav__left">
                <ds-tab-group-nav
                  key={`visible-${tabGroupKey}`}
                  class="bar-nav__tabs-visible"
                  ref={el => {
                    this.visibleTabGroupEl = el ?? null;
                  }}
                  tabs={this.resolvedTabs}
                  value={this.effectiveValue}
                  onDsChange={(e: Event) => this.handleTabChange(e)}
                />
              </div>
            )}

            {!hasTabs && this.heading && (
              <span class="bar-nav__heading text-body-medium-emphasis">{this.heading}</span>
            )}

            {hasTabs && this.tabsCollapsed && (
              <button
                type="button"
                class={{
                  'bar-nav__tab-trigger': true,
                  'bar-nav__tab-trigger--open': this.menuOpen,
                }}
                ref={el => {
                  this.triggerEl = el as HTMLButtonElement;
                }}
                aria-haspopup="menu"
                aria-expanded={this.menuOpen}
                aria-label={`${this.activeTabLabel} tabs`}
                onClick={() => this.toggleTabMenu()}
                onKeyDown={(e: KeyboardEvent) => this.handleTriggerKeyDown(e)}
              >
                <span
                  class={{
                    'bar-nav__tab-trigger-label': true,
                    'bar-nav__tab-trigger-label--dot': this.activeTabHasDot,
                    'bar-nav__tab-trigger-label--truncated': this.triggerLabelTruncated,
                  }}
                >
                  <span
                    class={{
                      'bar-nav__tab-trigger-label-text': true,
                      'bar-nav__tab-trigger-label-text--truncated': this.triggerLabelTruncated,
                      'text-body-medium-emphasis': true,
                    }}
                    ref={el => {
                      const next = el ?? null;
                      if (next === this.triggerLabelTextEl) return;
                      this.triggerLabelTextEl = next;
                      if (this.tabsCollapsed) {
                        this.syncTriggerLabelObserver();
                      }
                    }}
                  >
                    {this.activeTabLabel}
                  </span>
                  {this.activeTabHasDot && (
                    <ds-badge
                      class="bar-nav__tab-trigger-dot"
                      variant="dot"
                      background="var(--_bar-nav-bg)"
                      label=""
                      aria-hidden="true"
                    />
                  )}
                </span>
                <ds-icon
                  name="ChevronDown"
                  size="md"
                  color="inherit"
                  class="bar-nav__tab-trigger-chevron"
                />
              </button>
            )}

            {hasTabs && this.tabsCollapsed && this.resolvedActions.length > 0 && (
              <div class="bar-nav__between" aria-hidden="true" />
            )}

          {this.resolvedActions.length > 0 && (
            <div class="bar-nav__actions">
              {this.resolvedActions.map(action => (
                <ds-bar-nav-action
                  key={action.id}
                  icon={action.icon}
                  selected={action.selected ?? false}
                  dot={action.dot ?? false}
                  inactive={action.inactive}
                  aria-label={action.ariaLabel ?? action.id}
                  onDsChange={(e: Event) => this.handleActionChange(action.id, e)}
                />
              ))}
            </div>
          )}

        </header>

        {hasTabs && this.tabsCollapsed && (
          <ds-menu
            ref={el => {
              this.menuEl = (el as HTMLDsMenuElement) ?? null;
            }}
            open={this.menuOpen}
            sections={tabsToMenuSections(this.resolvedTabs, this.effectiveValue)}
            side="bottom"
            align="start"
            onDsSelect={(e: Event) => this.handleMenuSelect(e)}
            onDsClose={() => this.handleMenuClose()}
          />
        )}
      </Host>
    );
  }
}
