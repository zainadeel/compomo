import {
  Component,
  Prop,
  Event,
  EventEmitter,
  Watch,
  State,
  h,
  Host,
} from '@stencil/core';
import type { MenuItemData } from '../Menu/Menu';
import type { BarNavActionBackground } from '../BarNavAction/BarNavAction';
import type { TabItem } from '../TabGroup/tab-item-utils';
import {
  deriveBarNavValueFromUrl,
  parseJsonArrayProp,
  shouldResyncBarNavProps,
} from './bar-nav-utils';
import {
  getActiveTab,
  getActiveTabLabel,
  tabsOverflowContainer,
  tabsToMenuSections,
} from './bar-nav-tabs-menu-utils';

export type BarNavBackground = 'primary' | 'secondary' | 'transparent' | 'translucent';

/** Same shape as `TabItem` — supports `{ type: 'divider' }` between tab groups. */
export type BarNavTab = TabItem;

export interface BarNavActionItem {
  id: string;
  /** Icon name for <ds-icon>. */
  icon: string;
  /** Whether this action button is currently pressed/active. */
  selected?: boolean;
  /** Show a notification dot. */
  dot?: boolean;
  inactive?: boolean;
  ariaLabel?: string;
}

@Component({
  tag: 'ds-bar-nav',
  styleUrl: 'BarNav.css',
  scoped: true,
})
export class BarNav {
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

  /** Surface background variant. */
  @Prop() background: BarNavBackground = 'secondary';

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

  private static readonly HOST_PROP_SYNC_BUDGET = 8;

  private leftEl: HTMLElement | null = null;
  private triggerEl: HTMLButtonElement | null = null;
  private menuEl: HTMLDsMenuElement | null = null;
  private visibleTabGroupEl: HTMLDsTabGroupElement | null = null;
  private probeTabGroupEl: HTMLDsTabGroupElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private overflowCheckScheduled = false;

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
  onPropsChange() {
    this.resolvedTabs = this.tabsJson
      ? parseJsonArrayProp(this.tabsJson, [])
      : (this.tabs ?? []);
    this.resolvedActions = this.actionsJson
      ? parseJsonArrayProp(this.actionsJson, [])
      : (this.actions ?? []);
    this.syncValueFromUrl();
    this.scheduleOverflowCheck();
  }

  @Watch('currentUrl')
  @Watch('basePath')
  onUrlChange() {
    this.syncValueFromUrl();
    this.scheduleOverflowCheck();
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
    }
    this.scheduleOverflowCheck();
    if (collapsed || prevCollapsed === undefined || prevCollapsed === collapsed) return;
    requestAnimationFrame(() => this.scheduleOverflowCheck());
    queueMicrotask(() => this.focusVisibleSelectedTab());
  }

  componentWillLoad() {
    this.onPropsChange();
  }

  componentDidLoad() {
    this.syncHostPropsIfNeeded();
    this.scheduleDeferredHostPropSync();
    this.setupOverflowObserver();
    this.scheduleOverflowCheck();
  }

  componentDidRender() {
    this.scheduleOverflowCheck();
    this.syncMenuAnchor();
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

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
      this.onPropsChange();
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
    if (typeof ResizeObserver === 'undefined' || !this.leftEl) return;
    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => this.scheduleOverflowCheck());
    this.resizeObserver.observe(this.leftEl);
    const header = this.leftEl.parentElement;
    if (header) {
      this.resizeObserver.observe(header);
    }
  }

  private scheduleOverflowCheck() {
    if (this.overflowCheckScheduled) return;
    this.overflowCheckScheduled = true;
    requestAnimationFrame(() => {
      this.overflowCheckScheduled = false;
      this.updateTabsCollapsed();
    });
  }

  /** Width left for tabs after actions — stable while collapsed (unlike leftEl box when hugging the trigger). */
  private getLeftZoneAvailableWidth(): number {
    if (!this.leftEl) return 0;

    const header = this.leftEl.parentElement;
    if (!header?.classList.contains('bar-nav')) {
      return this.leftEl.clientWidth;
    }

    const headerStyle = getComputedStyle(header);
    const gap = parseFloat(headerStyle.columnGap || headerStyle.gap || '0') || 0;
    const actionsEl = header.querySelector('.bar-nav__actions') as HTMLElement | null;
    const actionsWidth = actionsEl?.offsetWidth ?? 0;
    const horizontalPadding =
      (parseFloat(headerStyle.paddingLeft) || 0) + (parseFloat(headerStyle.paddingRight) || 0);
    const available = header.clientWidth - horizontalPadding - actionsWidth - (actionsEl ? gap : 0);

    return Math.max(0, available);
  }

  private getTabsIntrinsicWidth(): number {
    const tabList = this.probeTabGroupEl?.querySelector('[role="tablist"]') as HTMLElement | null;
    return tabList?.scrollWidth ?? 0;
  }

  private updateTabsCollapsed() {
    if (!this.leftEl || this.resolvedTabs.length === 0 || this.hideTabsForDetailRoute) {
      if (this.tabsCollapsed) {
        this.tabsCollapsed = false;
        this.menuOpen = false;
      }
      return;
    }

    const intrinsicWidth = this.getTabsIntrinsicWidth();
    if (intrinsicWidth === 0) return;

    const shouldCollapse = tabsOverflowContainer(
      intrinsicWidth,
      this.getLeftZoneAvailableWidth(),
      this.tabsCollapsed,
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

  private syncMenuSections() {
    if (!this.menuEl) return;
    this.menuEl.sections = tabsToMenuSections(this.resolvedTabs, this.effectiveValue);
  }

  private syncValueFromUrl() {
    if (!this.currentUrl || !this.basePath) {
      this.urlDerivedValue = '';
      this.hideTabsForDetailRoute = false;
      return;
    }

    const { value, hideTabs } = deriveBarNavValueFromUrl(
      this.currentUrl,
      this.basePath,
      this.resolvedTabs,
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
    const tab = this.visibleTabGroupEl?.querySelector(
      `[data-tab-id="${this.effectiveValue}"]`,
    ) as HTMLElement | null;
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
    const hasTabs = this.resolvedTabs.length > 0 && !this.hideTabsForDetailRoute;

    const bgToActionBg: Partial<Record<BarNavBackground, BarNavActionBackground>> = {};
    const actionBg: BarNavActionBackground | undefined = bgToActionBg[this.background];

    return (
      <Host>
        <header class={{ 'bar-nav': true, [`bg-${this.background}`]: true }}>

          <div
            class="bar-nav__left"
            ref={el => {
              this.leftEl = el as HTMLElement;
              if (el && !this.resizeObserver) {
                this.setupOverflowObserver();
              }
            }}
          >
            {hasTabs && (
              <div class="bar-nav__tabs-probe" aria-hidden="true" inert>
                <ds-tab-group
                  ref={el => {
                    this.probeTabGroupEl = el as HTMLDsTabGroupElement;
                  }}
                  tabs={this.resolvedTabs}
                  value={this.effectiveValue}
                />
              </div>
            )}

            {hasTabs && !this.tabsCollapsed && (
              <ds-tab-group
                class="bar-nav__tabs-visible"
                ref={el => {
                  this.visibleTabGroupEl = el as HTMLDsTabGroupElement;
                }}
                tabs={this.resolvedTabs}
                value={this.effectiveValue}
                onDsChange={(e: Event) => this.handleTabChange(e)}
              />
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
                <span class={{
                  'bar-nav__tab-trigger-label': true,
                  'bar-nav__tab-trigger-label--dot': this.activeTabHasDot,
                  'text-body-medium-emphasis': true,
                }}>
                  {this.activeTabLabel}
                  {this.activeTabHasDot && (
                    <span class="bar-nav__tab-trigger-dot" aria-hidden="true" />
                  )}
                </span>
                <ds-icon
                  name="ChevronDown"
                  size="sm"
                  color="inherit"
                  class="bar-nav__tab-trigger-chevron"
                />
              </button>
            )}
          </div>

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
                  background={actionBg}
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
