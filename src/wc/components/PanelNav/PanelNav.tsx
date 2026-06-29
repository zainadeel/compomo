import { Component, Prop, Event, EventEmitter, Watch, State, Element, h, Host } from '@stencil/core';
import type { NavChromeStyle } from '../../nav/nav-chrome';
import { isShellGradientActive } from '../../nav/badge-gradient-ring';
import {
  animateShellNavRadialReveal,
  ensureShellNavVtStyle,
  resolveShellNavRevealOrigin,
  setShellNavRevealOriginVars,
} from '../../nav/shell-view-transition';
import {
  deriveActiveIdFromUrl,
  parsePanelNavGroups,
  resolvePanelNavDisableVt,
  resolvePanelNavStyle,
  shouldResyncPanelNavGroups,
  shouldResyncPanelNavStyle,
} from './panel-nav-utils';
import {
  PANEL_NAV_USER_MENU_ANCHOR_ID,
  type PanelNavGroup,
  type PanelNavItem,
  type PanelNavRouterMode,
  type PanelNavUserActionDetail,
} from './panel-nav-types';

// Module-level WeakMaps
interface ViewTransition {
  finished: Promise<void>;
  skipTransition: () => void;
}
type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void | Promise<void>) => ViewTransition;
};

const vtTransitions = new WeakMap<object, ViewTransition>();
const vtResolvers = new WeakMap<object, () => void>();

@Component({
  tag: 'ds-panel-nav',
  styleUrl: 'PanelNav.css',
  scoped: true,
})
export class PanelNav {
  /** Chrome style: `navigation` = navigation tokens, `default` = standard app tokens.
   *  Property: `navStyle`. HTML attribute: `nav-style`. */
  @Prop({ attribute: 'nav-style', reflect: true }) navStyle: NavChromeStyle = 'navigation';

  /** When `true`, the component does not run its own View Transition on style
   *  change — it just updates the rendered surface synchronously. Use this when
   *  the host app orchestrates the page transition itself (e.g. Angular Router's
   *  `withViewTransitions`), so the two don't fight or nest. */
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

  /** Viewport width (px) below which the nav auto-collapses to icon-only mode. 0 = disabled. */
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

  /** Emitted when a nav item is clicked. Detail = the item's `id`. */
  @Event() dsNavSelect!: EventEmitter<string>;

  /** Emitted when the collapse toggle is clicked. Detail = new collapsed state. */
  @Event() dsNavToggle!: EventEmitter<boolean>;

  /** Emitted when the footer left button (gear / dashboard) is clicked. */
  @Event() dsNavFooterAction!: EventEmitter<void>;

  /** Emitted when the footer user button is clicked. Detail includes the anchor for `ds-menu`. */
  @Event() dsNavUserAction!: EventEmitter<PanelNavUserActionDetail>;

  @Element() el!: HTMLElement;

  /** Mirrors `style` but is only updated inside the VT callback so the
   *  View Transition captures a clean before/after snapshot. */
  @State() private renderedStyle: NavChromeStyle = 'navigation';

  @State() private parsedGroups: PanelNavGroup[] = [];
  @State() private atBottom = false;
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

  /** Host may set `disable-view-transition` as an attribute before the JS prop lands. */
  private get effectiveDisableViewTransition(): boolean {
    return resolvePanelNavDisableVt(
      this.disableViewTransition,
      this.el.getAttribute('disable-view-transition'),
    );
  }

  @Watch('collapsed')
  @Watch('viewportNarrow')
  onCollapsedChange() {
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
    this.syncRovingIndex();
    this.syncActiveFromUrl();
  }

  @Watch('activeId')
  @Watch('urlDerivedActiveId')
  onActiveIdChange() {
    this.syncRovingIndex();
  }

  @Watch('currentUrl')
  onCurrentUrlChange() {
    this.syncActiveFromUrl();
  }

  @Watch('navStyle')
  async onNavStyleChange(newVal: NavChromeStyle) {
    // Host app drives the transition (e.g. Angular Router withViewTransitions):
    // just reflect the new surface so the app's transition captures it.
    if (this.effectiveDisableViewTransition) {
      this.renderedStyle = newVal;
      return;
    }

    // Skip any in-progress transition immediately so rapid style changes never leave the nav stuck.
    vtTransitions.get(this)?.skipTransition();
    vtTransitions.delete(this);

    const doc = document as DocumentWithViewTransition;
    if (typeof doc.startViewTransition !== 'function') {
      this.renderedStyle = newVal;
      return;
    }

    ensureShellNavVtStyle();
    const origin = resolveShellNavRevealOrigin(
      this.el.querySelector('.panel-nav__footer-btn') as HTMLElement | null,
    );
    setShellNavRevealOriginVars(origin);

    const transition = doc.startViewTransition(() =>
      new Promise<void>(resolve => {
        vtResolvers.set(this, resolve);
        this.renderedStyle = newVal;
      })
    );

    vtTransitions.set(this, transition);
    transition.finished.finally(() => {
      if (vtTransitions.get(this) === transition) vtTransitions.delete(this);
      vtResolvers.delete(this);
    });

    transition.ready
      .then(() => animateShellNavRadialReveal(origin))
      .catch(() => { /* transition was skipped or aborted */ });
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
    this.checkScroll();
    if (this.breakpoint > 0) this.connectResizeObserver();
  }

  componentDidRender() {
    // If a view transition callback is waiting for the render to complete,
    // resolve it now so the "after" snapshot is taken at exactly the right moment.
    const resolve = vtResolvers.get(this);
    if (resolve) {
      vtResolvers.delete(this);
      resolve();
    }
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
    this.isAnimating = true;
    const panel = this.el.querySelector('.panel-nav') as HTMLElement | null;
    if (this.transitionEndHandler) {
      panel?.removeEventListener('transitionend', this.transitionEndHandler);
    }
    this.transitionEndHandler = (e: TransitionEvent) => {
      if (e.propertyName === 'width') {
        this.isAnimating = false;
        panel?.removeEventListener('transitionend', this.transitionEndHandler!);
      }
    };
    panel?.addEventListener('transitionend', this.transitionEndHandler);
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
    this.syncRenderedStyleIfNeeded();

    if (shouldResyncPanelNavGroups(this.parsedGroups, this.groups)) {
      this.onGroupsChange(this.groups);
    } else if (this.currentUrl) {
      this.syncActiveFromUrl();
    }
  }

  /** Align `renderedStyle` with `style` when host bindings land after first paint. */
  private syncRenderedStyleIfNeeded() {
    if (!shouldResyncPanelNavStyle(this.renderedStyle, this.navStyle)) return;

    if (this.effectiveDisableViewTransition) {
      vtTransitions.get(this)?.skipTransition();
      vtTransitions.delete(this);
      this.renderedStyle = this.navStyle;
    } else {
      void this.onNavStyleChange(this.navStyle);
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

  /** Centralised toggle: updates `collapsed`, emits `dsNavToggle`, optionally persists. */
  private applyToggle(next: boolean) {
    this.collapsed = next;
    if (this.storageKey) {
      try { localStorage.setItem(this.storageKey, String(next)); } catch { /* unavailable */ }
    }
    this.dsNavToggle.emit(next);
  }

  private getAllItems(): PanelNavItem[] {
    return this.parsedGroups.flatMap(g => g.items);
  }

  private syncRovingIndex() {
    const idx = this.getAllItems().findIndex(i => i.id === this.effectiveActiveId);
    this.rovingIndex = idx >= 0 ? idx : 0;
  }

  private handleItemKeyDown(e: KeyboardEvent, index: number) {
    const total = this.getAllItems().length;
    let next: number;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); next = (index + 1) % total; break;
      case 'ArrowUp':   e.preventDefault(); next = (index - 1 + total) % total; break;
      case 'Home':      e.preventDefault(); next = 0; break;
      case 'End':       e.preventDefault(); next = total - 1; break;
      default: return;
    }
    this.rovingIndex = next;
    const items = Array.from(
      this.el.querySelectorAll<HTMLElement>('.panel-nav__body .panel-nav__item')
    );
    items[next]?.focus();
  }

  private checkScroll() {
    const body = this.el.querySelector('.panel-nav__body') as HTMLElement | null;
    if (!body) return;
    const remaining = body.scrollHeight - body.scrollTop - body.clientHeight;
    this.atBottom = remaining < 2;
  }

  private handleBodyScroll(e: Event) {
    const body = e.target as HTMLElement;
    const remaining = body.scrollHeight - body.scrollTop - body.clientHeight;
    this.atBottom = remaining < 2;
  }

  private handleItemClick(id: string) {
    this.dsNavSelect.emit(id);
  }

  private handleToggle() {
    this.applyToggle(!this.collapsed);
  }

  private handleFooterAction() {
    this.dsNavFooterAction.emit();
  }

  private handleUserAction(e: MouseEvent) {
    const anchor = e.currentTarget as HTMLElement;
    this.dsNavUserAction.emit({ anchor });
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

  private renderNavItem(item: PanelNavItem, idx: number, collapsed: boolean) {
    const isActive = item.id === this.effectiveActiveId;

    const itemContent = [
      <span class="panel-nav__item-icon">
        <ds-icon name={item.icon} size="md" color="inherit" flag={item.flag} />
      </span>,
      <span class="panel-nav__item-label">
        <span class="panel-nav__item-label-text">
          <ds-text
            as="span"
            variant={isActive ? 'text-body-medium-emphasis' : 'text-body-medium'}
            color="inherit"
          >
            {item.label}
          </ds-text>
        </span>
      </span>,
      item.dot && (
        <ds-badge
          class="panel-nav__item-dot"
          variant="dot"
          background="var(--_nav-bg)"
          on-gradient-background={isShellGradientActive(this.el)}
          label=""
          aria-hidden="true"
        />
      ),
    ];

    const sharedProps = {
      class: { 'panel-nav__item': true, 'panel-nav__item--active': isActive },
      'aria-current': isActive ? ('page' as const) : undefined,
      title: collapsed ? item.label : undefined,
      tabIndex: idx === this.rovingIndex ? 0 : -1,
      onClick: () => this.handleItemClick(item.id),
      onKeyDown: (e: KeyboardEvent) => this.handleItemKeyDown(e, idx),
      onFocus: () => { this.rovingIndex = idx; },
    };

    const useAnchor = this.routerMode === 'anchor' && item.href;

    return useAnchor
      ? <a {...sharedProps} href={item.href}>{itemContent}</a>
      : <button {...sharedProps} type="button">{itemContent}</button>;
  }

  render() {
    const isNavigation = this.renderedStyle === 'navigation';
    const collapsed = this.collapsed || this.viewportNarrow;
    const { userName, userInitial } = this;

    const navCls: Record<string, boolean> = {
      'panel-nav': true,
      'panel-nav--navigation': isNavigation,
      'panel-nav--default': !isNavigation,
      'panel-nav--collapsed': collapsed,
      'panel-nav--animating': this.isAnimating,
      'panel-nav--at-bottom': this.atBottom,
    };

    return (
      <Host style={{ display: 'block', position: 'relative' }}>
        <nav class={navCls} aria-label={isNavigation ? 'Main navigation' : 'Settings navigation'}>

          {/* ── Header: Motive logo, reveals collapse toggle on hover ── */}
          <div class="panel-nav__header">
            <button
              type="button"
              class="panel-nav__header-btn"
              onClick={() => this.handleToggle()}
              aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
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
          <div class="panel-nav__body" onScroll={e => this.handleBodyScroll(e)}>
            {(() => {
              let flatIdx = 0;
              return this.parsedGroups.map(group => (
                <div class="panel-nav__group">
                  {group.label && (
                    <span class="panel-nav__group-label">
                      <span class="panel-nav__item-label-text">
                        <ds-text as="span" variant="text-caption-emphasis" color="inherit">
                          {group.label}
                        </ds-text>
                      </span>
                    </span>
                  )}
                  {group.items.map(item => this.renderNavItem(item, flatIdx++, collapsed))}
                </div>
              ));
            })()}
          </div>

          {/* ── Footer ── */}
          <div class="panel-nav__footer">
            <ds-fade
              class="panel-nav__footer-fade"
              side="bottom"
              size="size-600"
              background="var(--_nav-bg)"
              visible={!this.atBottom}
            />

            {/* Left icon button — Gear in navigation style, Dashboard in default style */}
            <button
              type="button"
              class="panel-nav__footer-btn"
              title={isNavigation ? 'Settings' : 'Dashboard'}
              aria-label={isNavigation ? 'Open settings' : 'Go to dashboard'}
              onClick={() => this.handleFooterAction()}
            >
              <ds-icon name={isNavigation ? 'Gear' : 'Dashboard'} size="md" color="inherit" />
            </button>

            {/* Right user — label fades like nav items; right icon cross-fades chevron ↔ circle+initial */}
            <button
              type="button"
              id={PANEL_NAV_USER_MENU_ANCHOR_ID}
              class="panel-nav__item panel-nav__footer-user"
              aria-label={collapsed ? `User: ${userName}` : `User menu for ${userName}`}
              onClick={(e) => this.handleUserAction(e)}
            >
              <span class="panel-nav__item-label panel-nav__footer-user-label">
                <span class="panel-nav__item-label-text">
                  <ds-text as="span" variant="text-body-medium-emphasis" color="inherit">
                    {userName}
                  </ds-text>
                </span>
              </span>
              <span class="panel-nav__item-icon panel-nav__footer-user-icon" aria-hidden="true">
                <span class="panel-nav__footer-icon-expanded">
                  <ds-icon name="ChevronUpDown" size="md" color="inherit" />
                </span>
                <span class="panel-nav__footer-icon-collapsed">
                  <ds-icon name="Circle" size="md" color="inherit" />
                  <span class="panel-nav__user-initial">
                    <ds-text as="span" variant="text-caption-emphasis" color="inherit">
                      {userInitial}
                    </ds-text>
                  </span>
                </span>
              </span>
            </button>
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
