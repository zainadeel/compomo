import { Component, Prop, Event, EventEmitter, Watch, State, Element, h, Host } from '@stencil/core';

// Injected once per document to suppress the browser default cross-fade and
// pin the new-state snapshot to a 0px circle so the WAAPI reveal has no flash.
let vtStyleInjected = false;

// Module-level WeakMaps for per-instance VT state. Using WeakMaps instead of
// class fields avoids Stencil generating getter-only property descriptors on
// the host element for private fields, which throws in strict environments.
const vtTransitions = new WeakMap<object, { skipTransition: () => void }>();
const vtResolvers = new WeakMap<object, () => void>();
function ensureVtStyle() {
  if (vtStyleInjected) return;
  const id = 'ds-panel-nav-vt-style';
  if (document.getElementById(id)) { vtStyleInjected = true; return; }
  const style = document.createElement('style');
  style.id = id;
  style.textContent = [
    '::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal}',
    '::view-transition-new(root){clip-path:circle(0px at var(--vt-x,50%) var(--vt-y,50%))}',
  ].join('\n');
  document.head.appendChild(style);
  vtStyleInjected = true;
}

export type PanelNavVariant = 'dashboard' | 'settings';

export interface PanelNavItem {
  id: string;
  icon: string;
  label: string;
  /** Show a notification dot badge on the item */
  dot?: boolean;
  flag?: boolean;
  /** When set, the item renders as an `<a>` element so any router that
   *  intercepts anchor clicks (Angular Router, React Router, etc.) handles
   *  navigation automatically. `dsNavSelect` still fires on click. */
  href?: string;
}

export interface PanelNavGroup {
  id?: string;
  label?: string;
  items: PanelNavItem[];
}

@Component({
  tag: 'ds-panel-nav',
  styleUrl: 'PanelNav.css',
  scoped: true,
})
export class PanelNav {
  /** Visual variant: `dashboard` = always-dark surface, `settings` = light surface */
  @Prop() variant: PanelNavVariant = 'dashboard';

  /** When `true`, the component does not run its own View Transition on variant
   *  change — it just updates the rendered surface synchronously. Use this when
   *  the host app orchestrates the page transition itself (e.g. Angular Router's
   *  `withViewTransitions`), so the two don't fight or nest. */
  @Prop() disableViewTransition: boolean = false;

  /** JSON string of `PanelNavGroup[]` */
  @Prop() groups: string = '[]';

  /** ID of the currently active/selected nav item. Overridden by `currentUrl` matching when set. */
  @Prop() activeId: string = '';

  /** Whether the nav is in collapsed (icon-only) state.
   *  When `storageKey` is set the component manages this internally —
   *  do not also bind it from outside in that mode. */
  @Prop({ mutable: true }) collapsed: boolean = false;

  /** Viewport width (px) below which the nav auto-collapses to icon-only mode. 0 = disabled. */
  @Prop() breakpoint: number = 0;

  /** `localStorage` key used to persist the collapsed state across page loads.
   *  When set the component is self-managing for collapsed state; `dsNavToggle`
   *  still fires for consumers that want to observe the change. */
  @Prop() storageKey: string = '';

  /** Current route URL (e.g. `window.location.pathname` or the router's active URL).
   *  When set the component derives the active item by matching item `href` values
   *  against this string (longest prefix wins), overriding `activeId`. */
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

  @Element() el!: HTMLElement;

  /** Mirrors `variant` but is only updated inside the VT callback so the
   *  View Transition captures a clean before/after snapshot. */
  @State() private renderedVariant: PanelNavVariant = 'dashboard';

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

  /** The ID that should be treated as active. `currentUrl` matching takes precedence
   *  over `activeId` when both are present. */
  private get effectiveActiveId(): string {
    return this.urlDerivedActiveId || this.activeId;
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
  onGroupsChange(val: string) {
    try {
      this.parsedGroups = JSON.parse(val);
    } catch {
      this.parsedGroups = [];
    }
    this.syncRovingIndex();
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

  @Watch('variant')
  async onVariantChange(newVal: PanelNavVariant) {
    // Host app drives the transition (e.g. Angular Router withViewTransitions):
    // just reflect the new surface so the app's transition captures it.
    if (this.disableViewTransition) {
      this.renderedVariant = newVal;
      return;
    }

    // Skip any in-progress transition immediately so rapid variant changes
    // (e.g. quick dashboard → settings → dashboard) never leave the nav stuck.
    vtTransitions.get(this)?.skipTransition();
    vtTransitions.delete(this);

    if (typeof (document as any).startViewTransition !== 'function') {
      this.renderedVariant = newVal;
      return;
    }

    ensureVtStyle();

    const btn = this.el.querySelector('.panel-nav__footer-btn') as HTMLElement | null;
    const rect = btn?.getBoundingClientRect();
    const x = rect ? Math.round(rect.left + rect.width / 2) : Math.round(window.innerWidth / 2);
    const y = rect ? Math.round(rect.top + rect.height / 2) : Math.round(window.innerHeight / 2);
    const maxR = Math.ceil(Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    ));

    document.documentElement.style.setProperty('--vt-x', `${x}px`);
    document.documentElement.style.setProperty('--vt-y', `${y}px`);

    const transition = (document as any).startViewTransition(() =>
      new Promise<void>(resolve => {
        vtResolvers.set(this, resolve);
        this.renderedVariant = newVal;
      })
    );

    vtTransitions.set(this, transition);
    transition.finished.finally(() => {
      if (vtTransitions.get(this) === transition) vtTransitions.delete(this);
      vtResolvers.delete(this);
    });

    transition.ready.then(() => {
      const durToken = getComputedStyle(document.documentElement)
        .getPropertyValue('--effect-animation-duration-long-1').trim();
      const duration = parseFloat(durToken) || 750;
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxR}px at ${x}px ${y}px)`] },
        { duration, easing: 'ease-in-out', fill: 'forwards', pseudoElement: '::view-transition-new(root)' },
      );
    }).catch(() => { /* transition was skipped or aborted */ });
  }

  componentWillLoad() {
    this.renderedVariant = this.variant;
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
    this.checkScroll();
    if (this.breakpoint > 0) this.connectResizeObserver();
    // Re-sync groups in case componentWillLoad ran before host bindings were applied
    // (common with Angular's property binding timing)
    this.onGroupsChange(this.groups);
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
   *  Uses longest-prefix match so `/fleet/detail` correctly activates `/fleet`. */
  private syncActiveFromUrl() {
    if (!this.currentUrl) {
      this.urlDerivedActiveId = '';
      return;
    }
    let best: PanelNavItem | undefined;
    let bestLen = 0;
    for (const item of this.getAllItems()) {
      if (item.href && this.currentUrl.startsWith(item.href) && item.href.length > bestLen) {
        best = item;
        bestLen = item.href.length;
      }
    }
    this.urlDerivedActiveId = best?.id ?? '';
  }

  /** Centralised toggle: always emits `dsNavToggle`; when `storageKey` is set
   *  also mutates `collapsed` directly and persists to `localStorage`. */
  private applyToggle(next: boolean) {
    this.dsNavToggle.emit(next);
    if (this.storageKey) {
      this.collapsed = next;
      try { localStorage.setItem(this.storageKey, String(next)); } catch { /* unavailable */ }
    }
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
    let next = index;
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
      item.dot && <span class="panel-nav__item-dot" aria-hidden="true" />,
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

    return item.href
      ? <a {...sharedProps} href={item.href}>{itemContent}</a>
      : <button {...sharedProps} type="button">{itemContent}</button>;
  }

  render() {
    const isDashboard = this.renderedVariant === 'dashboard';
    const collapsed = this.collapsed || this.viewportNarrow;
    const { userName, userInitial } = this;

    const navCls: Record<string, boolean> = {
      'panel-nav': true,
      'panel-nav--dashboard': isDashboard,
      'panel-nav--settings': !isDashboard,
      'panel-nav--collapsed': collapsed,
      'panel-nav--animating': this.isAnimating,
      'panel-nav--at-bottom': this.atBottom,
    };

    return (
      <Host style={{ display: 'block', position: 'relative' }}>
        <nav class={navCls} aria-label={isDashboard ? 'Main navigation' : 'Settings navigation'}>

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
            {/* Left icon button — Gear in dashboard, Dashboard in settings */}
            <button
              type="button"
              class="panel-nav__footer-btn"
              title={isDashboard ? 'Settings' : 'Dashboard'}
              aria-label={isDashboard ? 'Open settings' : 'Go to dashboard'}
              onClick={() => this.handleFooterAction()}
            >
              <ds-icon name={isDashboard ? 'Gear' : 'Dashboard'} size="md" color="inherit" />
            </button>

            {/* Right user — label fades like nav items; right icon cross-fades chevron ↔ circle+initial */}
            <button
              type="button"
              class="panel-nav__item panel-nav__footer-user"
              aria-label={collapsed ? `User: ${userName}` : `User menu for ${userName}`}
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
