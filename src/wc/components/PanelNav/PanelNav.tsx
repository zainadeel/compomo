import { Component, Prop, Event, EventEmitter, Watch, State, Element, Method, h, Host } from '@stencil/core';
import type { ChromeTransitionDetail } from '../../nav/chrome-transition';
import type { NavChromeStyle } from '../../nav/nav-chrome';
import {
  deriveActiveIdFromUrl,
  parsePanelNavGroups,
  resolvePanelNavDisableVt,
  resolvePanelNavStyle,
  resolvePanelNavToggle,
  shouldResyncPanelNavGroups,
  shouldResyncPanelNavStyle,
} from './panel-nav-utils';
import {
  PANEL_NAV_USER_MENU_ANCHOR_ID,
  PANEL_NAV_USER_MENU_PLACEMENT,
  type PanelNavGroup,
  type PanelNavItem,
  type PanelNavRouterMode,
  type PanelNavUserActionDetail,
} from './panel-nav-types';
import { scrollEdgeFadeClassMap } from '../../utils/scroll-edge-fade';

@Component({
  tag: 'ds-panel-nav',
  styleUrl: 'PanelNav.css',
  styleUrls: ['../../utils/scroll-edge-fade.css'],
  scoped: true,
})
export class PanelNav {
  /** Style slot: `dashboard` or `settings`. Colors match for now;
   *  class hooks reserved for texture/glyph layers. Property: `navStyle`. Attribute: `nav-style`. */
  @Prop({ attribute: 'nav-style', reflect: true }) navStyle: NavChromeStyle = 'dashboard';

  /** When `true`, style changes apply synchronously — host app owns view transitions. */
  @Prop() disableViewTransition: boolean = false;

  /** Nav groups — set via JS property (`el.groups = [...]`) or JSON string attribute. */
  @Prop() groups: string | PanelNavGroup[] = '[]';

  /** How items with `href` render:
   *  - `anchor` (default): native `<a href>` — works with routers that intercept anchors.
   *  - `event`: always `<button>`; host handles navigation via `dsNavSelect`. */
  @Prop() routerMode: PanelNavRouterMode = 'anchor';

  /** ID of the currently active/selected nav item. Overridden by `currentUrl` matching when set. */
  @Prop() activeId: string = '';

  /** Whether the nav is in collapsed (icon-only) state.
   *  Set `storageKey` to persist across reloads. `dsNavToggle` still fires on change. */
  @Prop({ mutable: true }) collapsed: boolean = false;

  /** Viewport width (px) below which the nav locks in icon-only mode. 0 = disabled. */
  @Prop() breakpoint: number = 0;

  /** `localStorage` key used to persist the collapsed state across page loads.
   *  When set, collapsed state is restored on mount and written on each toggle. */
  @Prop() storageKey: string = '';

  /** Current route URL (e.g. `window.location.pathname` or the router's active URL).
   *  When set the component derives the active item by matching item `href` values
   *  against this string (longest segment-boundary prefix wins), overriding `activeId`. */
  @Prop() currentUrl: string = '';

  /** Display name for the footer user section */
  @Prop() userName: string = '';

  /** Single character shown in the collapsed avatar */
  @Prop() userInitial: string = '';

  @Prop() dashboardLabel: string = 'Dashboard';
  @Prop() settingsLabel: string = 'Settings';
  @Prop() accountLabel: string = 'Account';
  @Prop() dashboardNavigationLabel: string = 'Dashboard navigation';
  @Prop() settingsNavigationLabel: string = 'Settings navigation';
  @Prop() expandNavigationLabel: string = 'Expand navigation';
  @Prop() collapseNavigationLabel: string = 'Collapse navigation';

  /** Emitted when a nav item is clicked. Detail = the item's `id`. */
  @Event() dsNavSelect!: EventEmitter<string>;

  /** Emitted when the collapse toggle is clicked. Detail = new collapsed state. */
  @Event() dsNavToggle!: EventEmitter<boolean>;

  /** Bubbling lifecycle — `ds-app-shell` pauses chrome metrics during width motion. */
  @Event({ bubbles: true, composed: true })
  dsChromeTransitionStart!: EventEmitter<ChromeTransitionDetail>;

  @Event({ bubbles: true, composed: true })
  dsChromeTransitionEnd!: EventEmitter<ChromeTransitionDetail>;

  /** Emitted when the footer left button (gear / dashboard) is clicked. */
  @Event() dsNavFooterAction!: EventEmitter<void>;

  /** Emitted when the footer user button is clicked. Detail includes the anchor for `ds-menu`. */
  @Event() dsNavUserAction!: EventEmitter<PanelNavUserActionDetail>;

  @Element() el!: HTMLElement;

  @State() private renderedStyle: NavChromeStyle = 'dashboard';
  @State() private parsedGroups: PanelNavGroup[] = [];
  @State() private isAnimating = false;
  @State() private rovingIndex: number = 0;
  @State() private viewportNarrow: boolean = false;
  @State() private urlDerivedActiveId: string = '';

  private transitionEndHandler?: (e: TransitionEvent) => void;
  private resizeObserver?: ResizeObserver;

  // Drag-to-resize state (not @State — no re-render needed)
  private isDragging = false;
  private dragStartX = 0;
  private didSnap = false;
  private lastDeltaX = 0;
  private edgeOverlayTimer: number | null = null;
  private globalMouseMoveHandler?: (e: MouseEvent) => void;
  private globalMouseUpHandler?: () => void;

  @State() private showEdgeOverlay = false;

  private static readonly HOST_PROP_SYNC_BUDGET = 8;

  /** The ID that should be treated as active. `currentUrl` matching takes precedence
   *  over `activeId` when both are present. */
  private get effectiveActiveId(): string {
    return this.urlDerivedActiveId || this.activeId;
  }

  private get effectiveDisableViewTransition(): boolean {
    return resolvePanelNavDisableVt(
      this.disableViewTransition,
      this.el.getAttribute('disable-view-transition'),
    );
  }

  @Watch('collapsed')
  onCollapsedChange(_next: boolean, prev: boolean | undefined) {
    if (prev === undefined) return;
    this.startCollapseAnimation();
  }

  @Watch('viewportNarrow')
  onViewportNarrowChange(next: boolean, prev: boolean | undefined) {
    if (prev === undefined) return;
    if (next && this.rovingIndex === 0) {
      this.rovingIndex = this.getFirstRovingIndex();
    }
    this.startCollapseAnimation();
  }

  @Watch('breakpoint')
  onBreakpointChange() {
    this.disconnectResizeObserver();
    if (this.breakpoint > 0) this.connectResizeObserver();
  }

  @Watch('groups')
  onGroupsChange(val: string | PanelNavGroup[]) {
    this.parsedGroups = parsePanelNavGroups(val);
    this.rovingIndex = 0;
    this.syncActiveFromUrl();
  }

  @Watch('activeId')
  @Watch('urlDerivedActiveId')
  onActiveIdChange() {
    /* Active route updates aria-current only — roving tab stop stays user-controlled. */
  }

  @Watch('currentUrl')
  onCurrentUrlChange() {
    this.syncActiveFromUrl();
  }

  @Watch('navStyle')
  onNavStyleChange(newVal: NavChromeStyle) {
    this.renderedStyle = newVal;
  }

  componentWillLoad() {
    this.renderedStyle = resolvePanelNavStyle(this.navStyle, this.el.getAttribute('nav-style'));
    if (this.storageKey) {
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (stored !== null) this.collapsed = stored === 'true';
      } catch { /* localStorage unavailable */ }
    }
    this.onGroupsChange(this.groups);
    this.syncActiveFromUrl();
  }

  componentDidLoad() {
    this.syncHostPropsIfNeeded();
    this.scheduleDeferredHostPropSync();
    if (this.breakpoint > 0) this.connectResizeObserver();
  }

  disconnectedCallback() {
    this.disconnectResizeObserver();
    this.clearEdgeOverlayTimer();
    if (this.globalMouseMoveHandler) {
      window.removeEventListener('mousemove', this.globalMouseMoveHandler);
    }
    if (this.globalMouseUpHandler) {
      window.removeEventListener('mouseup', this.globalMouseUpHandler);
    }
  }

  private startCollapseAnimation() {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.dsChromeTransitionStart.emit({ source: 'panel-nav' });
    const panel = this.el.querySelector('.panel-nav') as HTMLElement | null;
    const widthBefore = panel?.getBoundingClientRect().width ?? 0;
    if (this.transitionEndHandler) {
      panel?.removeEventListener('transitionend', this.transitionEndHandler);
    }
    this.transitionEndHandler = (e: TransitionEvent) => {
      if (e.propertyName === 'width') {
        this.finishCollapseAnimation(panel);
      }
    };
    panel?.addEventListener('transitionend', this.transitionEndHandler);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!this.isAnimating) return;
        const widthAfter = panel?.getBoundingClientRect().width ?? 0;
        if (Math.abs(widthAfter - widthBefore) < 1) {
          this.finishCollapseAnimation(panel);
        }
      });
    });
  }

  private finishCollapseAnimation(panel: HTMLElement | null) {
    if (!this.isAnimating) return;
    this.isAnimating = false;
    this.dsChromeTransitionEnd.emit({ source: 'panel-nav' });
    if (this.transitionEndHandler) {
      panel?.removeEventListener('transitionend', this.transitionEndHandler);
    }
  }

  private connectResizeObserver() {
    this.viewportNarrow = window.innerWidth < this.breakpoint;
    this.resizeObserver = new ResizeObserver(() => {
      this.viewportNarrow = window.innerWidth < this.breakpoint;
    });
    this.resizeObserver.observe(document.documentElement);
  }

  private disconnectResizeObserver() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
  }

  /** Derive active ID from the current URL by matching item `href` values.
   *  Uses longest segment-boundary prefix match. */
  private syncActiveFromUrl() {
    if (!this.currentUrl) {
      this.urlDerivedActiveId = '';
      return;
    }
    this.urlDerivedActiveId = deriveActiveIdFromUrl(this.currentUrl, this.getAllItems());
  }

  /** Re-parse props assigned by the host after componentWillLoad (Angular ngAfterViewInit). */
  private syncHostPropsIfNeeded() {
    if (shouldResyncPanelNavStyle(this.renderedStyle, this.navStyle)) {
      this.renderedStyle = this.navStyle;
    }

    if (shouldResyncPanelNavGroups(this.parsedGroups, this.groups)) {
      this.onGroupsChange(this.groups);
    } else if (this.currentUrl) {
      this.syncActiveFromUrl();
    }
  }

  /** Poll across animation frames — host props may land without triggering @Watch. */
  private scheduleDeferredHostPropSync() {
    let remaining = PanelNav.HOST_PROP_SYNC_BUDGET;
    const tick = () => {
      this.syncHostPropsIfNeeded();
      if (--remaining > 0) {
        requestAnimationFrame(tick);
      }
    };
    queueMicrotask(tick);
  }

  /** Centralised toggle: updates the desktop preference unless breakpoint-locked. */
  private applyToggle(next: boolean) {
    if (this.viewportNarrow) return;
    this.collapsed = next;
    if (this.storageKey) {
      try { localStorage.setItem(this.storageKey, String(next)); } catch { /* unavailable */ }
    }
    this.dsNavToggle.emit(next);
  }

  private getAllItems(): PanelNavItem[] {
    return this.parsedGroups.flatMap(g => g.items);
  }

  private getFirstRovingIndex(): number {
    return this.viewportNarrow ? 1 : 0;
  }

  private getFooterRovingIndex(): number {
    return 1 + this.getAllItems().length;
  }

  private getUserRovingIndex(): number {
    return this.getFooterRovingIndex() + 1;
  }

  private getRovingElement(index: number): HTMLElement | null {
    const itemCount = this.getAllItems().length;
    if (index === 0) {
      return this.viewportNarrow ? null : this.el.querySelector('.panel-nav__header-btn');
    }
    if (index >= 1 && index <= itemCount) {
      const items = this.el.querySelectorAll<HTMLElement>('.panel-nav__body .panel-nav__item');
      return items[index - 1] ?? null;
    }
    if (index === this.getFooterRovingIndex()) {
      return this.el.querySelector('.panel-nav__footer-btn .button-icon');
    }
    if (index === this.getUserRovingIndex()) {
      return this.el.querySelector('.panel-nav__footer-user');
    }
    return null;
  }

  private focusRovingAt(index: number) {
    this.rovingIndex = index;
    this.getRovingElement(index)?.focus({ preventScroll: true });
  }

  private activateRovingIndex(index: number) {
    const itemCount = this.getAllItems().length;
    const items = this.getAllItems();
    if (index === 0) {
      this.handleToggle();
      return;
    }
    if (index >= 1 && index <= itemCount) {
      this.handleItemClick(items[index - 1].id);
      return;
    }
    if (index === this.getFooterRovingIndex()) {
      this.handleFooterAction();
      return;
    }
    if (index === this.getUserRovingIndex()) {
      const anchor = this.el.querySelector(`#${PANEL_NAV_USER_MENU_ANCHOR_ID}`) as HTMLElement | null;
      if (anchor) this.dsNavUserAction.emit({ anchor, menuPlacement: PANEL_NAV_USER_MENU_PLACEMENT });
    }
  }

  private handleRovingKeyDown(e: KeyboardEvent, index: number) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.activateRovingIndex(index);
      return;
    }

    const footerIdx = this.getFooterRovingIndex();
    const userIdx = this.getUserRovingIndex();
    const firstIdx = this.getFirstRovingIndex();
    let next: number | undefined;

    switch (e.key) {
      case 'ArrowDown':
        if (index === userIdx) return;
        if (index === footerIdx) next = userIdx;
        else next = index + 1;
        break;
      case 'ArrowUp':
        if (index === firstIdx) return;
        if (index === userIdx) next = footerIdx;
        else if (index === footerIdx) next = footerIdx - 1;
        else next = index - 1;
        break;
      case 'ArrowRight':
        if (index === footerIdx) next = userIdx;
        else return;
        break;
      case 'ArrowLeft':
        if (index === userIdx) next = footerIdx;
        else return;
        break;
      case 'Home':
        e.preventDefault();
        next = firstIdx;
        break;
      case 'End':
        e.preventDefault();
        next = userIdx;
        break;
      default:
        return;
    }

    if (next === undefined || next === index) return;
    e.preventDefault();
    this.focusRovingAt(next);
  }

  private handleItemClick(id: string) {
    this.dsNavSelect.emit(id);
  }

  private handleToggle() {
    const next = resolvePanelNavToggle(this.collapsed, this.viewportNarrow);
    if (next !== null) this.applyToggle(next);
  }

  /** Toggle the desktop preference. No-op while the breakpoint locks the panel collapsed. */
  @Method()
  async toggleCollapsed() {
    this.handleToggle();
  }

  private handleFooterAction() {
    this.dsNavFooterAction.emit();
  }

  private handleUserAction(e: MouseEvent) {
    const anchor = e.currentTarget as HTMLElement;
    this.dsNavUserAction.emit({ anchor, menuPlacement: PANEL_NAV_USER_MENU_PLACEMENT });
  }

  private clearEdgeOverlayTimer() {
    if (this.edgeOverlayTimer !== null) {
      window.clearTimeout(this.edgeOverlayTimer);
      this.edgeOverlayTimer = null;
    }
  }

  private handleResizeHandleMouseEnter() {
    this.clearEdgeOverlayTimer();
    this.edgeOverlayTimer = window.setTimeout(() => {
      this.showEdgeOverlay = true;
      this.edgeOverlayTimer = null;
    }, 500);
  }

  private handleResizeHandleMouseLeave() {
    if (this.isDragging) return;
    this.clearEdgeOverlayTimer();
    this.showEdgeOverlay = false;
  }

  private handleResizeHandleMouseDown(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const wasCollapsed = this.collapsed || this.viewportNarrow;
    this.isDragging = true;
    this.dragStartX = e.clientX;
    this.didSnap = false;
    this.lastDeltaX = 0;
    this.clearEdgeOverlayTimer();
    this.showEdgeOverlay = false;

    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';

    const onMove = (ev: MouseEvent) => {
      const deltaX = ev.clientX - this.dragStartX;
      this.lastDeltaX = Math.abs(deltaX);
      if (this.didSnap) return;
      if (!wasCollapsed && deltaX < -8) {
        this.applyToggle(true);
        this.didSnap = true;
      } else if (wasCollapsed && deltaX > 8) {
        this.applyToggle(false);
        this.didSnap = true;
      }
    };

    const onUp = () => {
      if (!this.didSnap && this.lastDeltaX < 3) {
        this.applyToggle(!wasCollapsed);
      }
      this.isDragging = false;
      this.showEdgeOverlay = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      this.globalMouseMoveHandler = undefined;
      this.globalMouseUpHandler = undefined;
    };

    this.globalMouseMoveHandler = onMove;
    this.globalMouseUpHandler = onUp;
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  private renderFooterAction(isDashboardChrome: boolean) {
    // Short chrome labels — same string for tip + aria (not "Open/Go to …").
    const footerLabel = isDashboardChrome ? this.settingsLabel : this.dashboardLabel;
    return (
      <ds-tooltip label={footerLabel} side="right" size="sm">
        <ds-button-unfilled variant="icon"
          class="panel-nav__footer-btn"
          icon={isDashboardChrome ? 'Gear' : 'Dashboard'}
          activeFill={false}
          hasBorder={false}
          focusTabIndex={this.rovingIndex === this.getFooterRovingIndex() ? 0 : -1}
          aria-label={footerLabel}
          onDsClick={() => this.handleFooterAction()}
          onKeyDown={(e: KeyboardEvent) => this.handleRovingKeyDown(e, this.getFooterRovingIndex())}
          onFocusin={() => { this.rovingIndex = this.getFooterRovingIndex(); }}
        />
      </ds-tooltip>
    );
  }

  private renderFooterUser(collapsed: boolean, userName: string, userInitial: string) {
    // Always wrap so collapse morph CSS can transition on a stable button node.
    // Tip only when collapsed (empty label → ds-tooltip skips show).
    const tipLabel = collapsed ? this.accountLabel : '';
    const userButton = (
      <button
        type="button"
        id={PANEL_NAV_USER_MENU_ANCHOR_ID}
        class="panel-nav__item panel-nav__footer-user ds-focus-ring-inset ds-interaction-fill"
        tabIndex={this.rovingIndex === this.getUserRovingIndex() ? 0 : -1}
        aria-label={this.accountLabel}
        onClick={(e) => this.handleUserAction(e)}
        onKeyDown={(e: KeyboardEvent) => this.handleRovingKeyDown(e, this.getUserRovingIndex())}
        onFocus={() => { this.rovingIndex = this.getUserRovingIndex(); }}
      >
        <ds-text
          class="panel-nav__item-label panel-nav__footer-user-label panel-nav__item-label-text"
          as="span"
          variant="text-body-medium"
          emphasis
          color="inherit"
        >
          {userName}
        </ds-text>
        <span class="panel-nav__item-icon panel-nav__footer-user-icon" aria-hidden="true">
          <span class="panel-nav__footer-icon-expanded">
            <ds-icon name="ChevronUpDown" size="md" color="inherit" />
          </span>
          <span class="panel-nav__footer-icon-collapsed">
            <ds-icon name="Circle" size="md" color="inherit" />
            <ds-text
              class="panel-nav__user-initial"
              as="span"
              variant="text-caption"
              emphasis
              align="center"
              color="inherit"
            >
              {userInitial}
            </ds-text>
          </span>
        </span>
      </button>
    );

    return (
      <ds-tooltip label={tipLabel} side="right" size="sm">
        {userButton}
      </ds-tooltip>
    );
  }

  private renderNavItem(item: PanelNavItem, idx: number, collapsed: boolean) {
    const isActive = item.id === this.effectiveActiveId;
    const rovingPosition = idx + 1;

    const itemContent = [
      <span class="panel-nav__item-icon">
        <ds-icon name={item.icon} size="md" color="inherit" flag={item.flag} />
      </span>,
      <ds-text
        class="panel-nav__item-label panel-nav__item-label-text"
        as="span"
        variant="text-body-medium"
        emphasis={isActive}
        color="inherit"
      >
        {item.label}
      </ds-text>,
      item.dot && (
        <ds-badge
          class="panel-nav__item-dot"
          variant="dot"
          background="var(--_nav-bg)"
          label=""
          aria-hidden="true"
        />
      ),
    ];

    const sharedProps = {
      class: {
        'panel-nav__item': true,
        'panel-nav__item--active': isActive,
        'ds-focus-ring-inset': true,
        'ds-interaction-fill': true,
      },
      'aria-current': isActive ? ('page' as const) : undefined,
      tabIndex: rovingPosition === this.rovingIndex ? 0 : -1,
      onClick: () => this.handleItemClick(item.id),
      onKeyDown: (e: KeyboardEvent) => this.handleRovingKeyDown(e, rovingPosition),
      onFocus: () => { this.rovingIndex = rovingPosition; },
    };

    const useAnchor = this.routerMode === 'anchor' && item.href;
    const control = useAnchor
      ? <a {...sharedProps} href={item.href}>{itemContent}</a>
      : <button {...sharedProps} type="button">{itemContent}</button>;

    // Always wrap so label fade CSS can transition on a stable item node.
    // Tip only when collapsed (empty label → ds-tooltip skips show).
    return (
      <ds-tooltip label={collapsed ? item.label : ''} side="right" size="sm">
        {control}
      </ds-tooltip>
    );
  }

  render() {
    const chromeStyle = this.renderedStyle;
    const isDashboardChrome = chromeStyle === 'dashboard';
    const isDashboard = this.navStyle === 'dashboard';
    const collapsed = this.collapsed || this.viewportNarrow;
    const { userName, userInitial } = this;

    const navCls: Record<string, boolean> = {
      'panel-nav': true,
      'panel-nav--dashboard': isDashboard,
      'panel-nav--settings': !isDashboard,
      'panel-nav--collapsed': collapsed,
      'panel-nav--breakpoint-locked': this.viewportNarrow,
      'panel-nav--animating': this.isAnimating,
    };

    return (
      <Host style={{ display: 'block', position: 'relative' }}>
        <nav
          class={navCls}
          aria-label={isDashboardChrome ? this.dashboardNavigationLabel : this.settingsNavigationLabel}
        >

          {/* ── Header: Motive logo, reveals collapse toggle on hover ── */}
          <div class="panel-nav__header">
            <button
              type="button"
              class="panel-nav__header-btn ds-focus-ring-inset ds-interaction-fill"
              disabled={this.viewportNarrow}
              tabIndex={!this.viewportNarrow && this.rovingIndex === 0 ? 0 : -1}
              onClick={() => this.handleToggle()}
              onKeyDown={(e: KeyboardEvent) => this.handleRovingKeyDown(e, 0)}
              onFocus={() => { this.rovingIndex = 0; }}
              aria-label={collapsed ? this.expandNavigationLabel : this.collapseNavigationLabel}
              aria-expanded={collapsed ? 'false' : 'true'}
            >
              {/* Motive M mark — fades out on hover to reveal collapse toggle */}
              <span class="panel-nav__header-logo" aria-hidden="true">
                <svg class="panel-nav__m-mark" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">
                  <path d="M11.1159 4.31537H7.67021L2.53401 13.0703H0V15.6875H4.02716L8.24319 8.49978V15.6846H11.6342L15.8289 8.47829V15.6846H18.7122V4.3125H15.2559L11.1159 11.3648V4.31537Z" fill="currentColor"/>
                </svg>
              </span>
              {/* Collapse / expand icon — revealed on hover via CSS */}
              <span class="panel-nav__header-toggle" aria-hidden="true">
                <ds-icon
                  name={collapsed ? 'LeftExpandB' : 'LeftCollapseB'}
                  size="md"
                  color="inherit"
                />
              </span>
            </button>
          </div>

          {/* ── Scrollable body ── */}
          <div
            class={{
              'panel-nav__body': true,
              ...scrollEdgeFadeClassMap({ edges: 'bottom' }),
            }}
          >
            {(() => {
              let flatIdx = 0;
              return this.parsedGroups.map(group => (
                <div class="panel-nav__group">
                  {group.label && (
                    <ds-text
                      class="panel-nav__group-label"
                      as="span"
                      variant="text-caption"
                      emphasis
                      color="inherit"
                    >
                      {group.label}
                    </ds-text>
                  )}
                  {group.items.map(item => this.renderNavItem(item, flatIdx++, collapsed))}
                </div>
              ));
            })()}
          </div>

          {/* ── Footer ── */}
          <div class="panel-nav__footer">
            {this.renderFooterAction(isDashboardChrome)}
            {this.renderFooterUser(collapsed, userName, userInitial)}
          </div>

        </nav>

        {/* Drag-to-resize handle — always rendered, hidden only when auto-collapsed by breakpoint */}
        {!this.viewportNarrow && (
          <div
            class={{
              'panel-nav__resize-handle': true,
              'panel-nav__resize-handle--overlay': this.showEdgeOverlay,
            }}
            onMouseEnter={() => this.handleResizeHandleMouseEnter()}
            onMouseLeave={() => this.handleResizeHandleMouseLeave()}
            onMouseDown={(e: MouseEvent) => this.handleResizeHandleMouseDown(e)}
            aria-hidden="true"
          />
        )}
      </Host>
    );
  }
}
