import {
  Component,
  Prop,
  Event,
  EventEmitter,
  Watch,
  State,
  Element,
  Method,
  h,
  Host,
} from '@stencil/core';
import type { ChromeTransitionDetail } from '../../shell/chrome-transition';
import type { NavChromeStyle } from '../../shell/nav-chrome';
import {
  derivePanelNavSelectionFromUrl,
  firstEnabledPanelNavChild,
  panelNavWidthTransitionMs,
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
  type PanelNavChildItem,
  type PanelNavChildSelectDetail,
  type PanelNavGroup,
  type PanelNavItem,
  type PanelNavPresentation,
  type PanelNavRouterMode,
  type PanelNavUserActionDetail,
} from './panel-nav-types';
import { PANEL_NAV_CHILD_MENU_PLACEMENT } from '../Menu/menu-placement';
import type { MenuItemData } from '../Menu/menu-types';
import { scrollEdgeFadeClassMap } from '../../utils/scroll-edge-fade';
import { prefersReducedMotion } from '../../utils/resolve-css-time-ms';
import { resolveSafeUrl } from '../../utils/safe-url';

type PanelNavRovingEntry =
  | { kind: 'parent'; item: PanelNavItem }
  | { kind: 'child'; parent: PanelNavItem; child: PanelNavChildItem };

let nextPanelNavInstanceId = 0;

@Component({
  tag: 'ds-panel-nav',
  styleUrl: 'PanelNav.css',
  styleUrls: ['../../utils/scroll-edge-fade.css'],
  scoped: true,
})
export class PanelNav {
  private readonly instanceId = nextPanelNavInstanceId++;
  /** Style slot: `dashboard` or `settings`. Colors match for now;
   *  class hooks reserved for texture/glyph layers. Property: `navStyle`. Attribute: `nav-style`. */
  @Prop({ attribute: 'nav-style', reflect: true }) navStyle: NavChromeStyle = 'dashboard';

  /** When `true`, style changes apply synchronously — host app owns view transitions. */
  @Prop() disableViewTransition: boolean = false;

  /** Nav groups — set via JS property (`el.groups = [...]`) or JSON string attribute. */
  @Prop() groups: string | PanelNavGroup[] = '[]';

  /** Flat primary destinations, or nested child-route disclosure. */
  @Prop({ reflect: true }) presentation: PanelNavPresentation = 'flat';

  /** How items with `href` render:
   *  - `anchor` (default): native `<a href>` — works with routers that intercept anchors.
   *  - `event`: always `<button>`; host handles navigation via `dsNavSelect`. */
  @Prop() routerMode: PanelNavRouterMode = 'anchor';

  /** ID of the currently active/selected nav item. Overridden by `currentUrl` matching when set. */
  @Prop() activeId: string = '';

  /** ID of the active child route when URL matching is unavailable. */
  @Prop() activeChildId: string = '';

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
  /** Keep the account-menu trigger visually pressed while its popup is open or closing. */
  @Prop() accountMenuExpanded: boolean = false;
  @Prop() dashboardNavigationLabel: string = 'Dashboard navigation';
  @Prop() settingsNavigationLabel: string = 'Settings navigation';
  @Prop() expandNavigationLabel: string = 'Expand navigation';
  @Prop() collapseNavigationLabel: string = 'Collapse navigation';
  /** Localized name for the body when overflow makes it a keyboard-scrollable region. */
  @Prop() navigationItemsLabel: string = 'Navigation items';

  /** Emitted when a nav item is clicked. Detail = the item's `id`. */
  @Event() dsNavSelect!: EventEmitter<string>;

  /** Emitted when a nested child route is selected. */
  @Event() dsNavChildSelect!: EventEmitter<PanelNavChildSelectDetail>;

  /** Emitted when the collapse toggle is clicked. Detail = new collapsed state. */
  @Event() dsNavToggle!: EventEmitter<boolean>;

  /** Bubbling lifecycle — `ds-shell-app` pauses chrome metrics during width motion. */
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
  @State() private urlDerivedActiveChildId: string = '';
  @State() private bodyScrollable = false;
  @State() private expandedParentId: string = '';
  @State() private inlineChildrenExpansionReady = true;
  @State() private flyoutParentId: string = '';
  @State() private flyoutOpen = false;
  @State() private flyoutInitialFocusVisible = false;

  private transitionCompletionHandler?: (e: TransitionEvent) => void;
  private transitionFallbackTimer: number | null = null;
  private resizeObserver?: ResizeObserver;
  private scrollRegionObserver?: ResizeObserver;
  private bodyEl?: HTMLElement;
  private initialRenderComplete = false;
  private inlineChildrenExpansionFrame: number | null = null;

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

  private get effectiveActiveChildId(): string {
    return this.urlDerivedActiveChildId || this.activeChildId;
  }

  private get collapsedPresentation(): boolean {
    return this.collapsed || this.viewportNarrow;
  }

  private get effectiveDisableViewTransition(): boolean {
    return resolvePanelNavDisableVt(
      this.disableViewTransition,
      this.el.getAttribute('disable-view-transition')
    );
  }

  @Watch('collapsed')
  onCollapsedChange(next: boolean, prev: boolean | undefined) {
    if (prev === undefined || !this.initialRenderComplete) return;
    this.stageInlineChildrenExpansion(
      prev && !next && !this.viewportNarrow && this.presentation === 'nested'
    );
    this.flyoutParentId = '';
    this.flyoutOpen = false;
    this.syncExpandedParent();
    this.rovingIndex = this.getFirstRovingIndex();
    this.startCollapseAnimation();
  }

  @Watch('viewportNarrow')
  onViewportNarrowChange(next: boolean, prev: boolean | undefined) {
    if (prev === undefined || !this.initialRenderComplete) return;
    this.stageInlineChildrenExpansion(
      prev && !next && !this.collapsed && this.presentation === 'nested'
    );
    this.flyoutParentId = '';
    this.flyoutOpen = false;
    if (next || this.rovingIndex > this.getVisibleRovingEntries().length) {
      this.rovingIndex = this.getFirstRovingIndex();
    }
    this.startCollapseAnimation();
  }

  @Watch('breakpoint')
  onBreakpointChange() {
    this.disconnectResizeObserver();
    if (this.effectiveBreakpoint() > 0) this.connectResizeObserver();
  }

  @Watch('groups')
  onGroupsChange(val: string | PanelNavGroup[]) {
    this.parsedGroups = parsePanelNavGroups(val);
    this.rovingIndex = 0;
    this.syncActiveFromUrl();
    this.syncExpandedParent();
  }

  @Watch('presentation')
  onPresentationChange() {
    this.stageInlineChildrenExpansion(false);
    this.flyoutParentId = '';
    this.flyoutOpen = false;
    this.syncExpandedParent();
    this.rovingIndex = this.getFirstRovingIndex();
  }

  @Watch('activeId')
  @Watch('activeChildId')
  @Watch('urlDerivedActiveId')
  @Watch('urlDerivedActiveChildId')
  onActiveIdChange() {
    this.syncExpandedParent();
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
    this.viewportNarrow = this.isViewportNarrow();
    if (this.storageKey) {
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (stored !== null) this.collapsed = stored === 'true';
      } catch {
        /* localStorage unavailable */
      }
    }
    this.onGroupsChange(this.groups);
    this.syncActiveFromUrl();
  }

  componentDidLoad() {
    this.syncHostPropsIfNeeded();
    this.scheduleDeferredHostPropSync();
    if (this.effectiveBreakpoint() > 0) this.connectResizeObserver();
    this.connectScrollRegionObserver();
    this.updateBodyScrollable();
    this.initialRenderComplete = true;
  }

  componentDidRender() {
    this.updateBodyScrollable();
    this.scheduleInlineChildrenExpansion();
  }

  disconnectedCallback() {
    this.disconnectResizeObserver();
    this.disconnectScrollRegionObserver();
    this.clearInlineChildrenExpansionFrame();
    this.clearCollapseAnimationCompletion(
      this.el.querySelector('.panel-nav') as HTMLElement | null
    );
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
    this.clearCollapseAnimationCompletion(panel);
    this.transitionCompletionHandler = (e: TransitionEvent) => {
      if (e.target === panel && (e.propertyName === 'width' || e.propertyName === 'min-width')) {
        this.finishCollapseAnimation(panel);
      }
    };
    panel?.addEventListener('transitionend', this.transitionCompletionHandler);
    panel?.addEventListener('transitioncancel', this.transitionCompletionHandler);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!this.isAnimating) return;
        if (!panel) {
          this.finishCollapseAnimation(panel);
          return;
        }

        const fallbackMs = panelNavWidthTransitionMs(getComputedStyle(panel));
        if (fallbackMs <= 0) {
          this.finishCollapseAnimation(panel);
          return;
        }
        this.transitionFallbackTimer = window.setTimeout(() => {
          this.finishCollapseAnimation(panel);
        }, fallbackMs);
      });
    });
  }

  private stageInlineChildrenExpansion(stage: boolean) {
    this.clearInlineChildrenExpansionFrame();
    this.inlineChildrenExpansionReady = !stage;
  }

  private scheduleInlineChildrenExpansion() {
    if (this.inlineChildrenExpansionReady || this.collapsedPresentation) return;
    this.clearInlineChildrenExpansionFrame();
    this.inlineChildrenExpansionFrame = requestAnimationFrame(() => {
      this.inlineChildrenExpansionFrame = null;
      if (this.collapsedPresentation) return;

      // Commit the newly mounted accordion's closed geometry before opening it.
      // Without this read, the browser can insert it directly at 1fr and skip motion.
      this.el.querySelector<HTMLElement>('.panel-nav__children-accordion')?.getBoundingClientRect();
      this.inlineChildrenExpansionReady = true;
    });
  }

  private clearInlineChildrenExpansionFrame() {
    if (this.inlineChildrenExpansionFrame === null) return;
    cancelAnimationFrame(this.inlineChildrenExpansionFrame);
    this.inlineChildrenExpansionFrame = null;
  }

  private finishCollapseAnimation(panel: HTMLElement | null) {
    const wasAnimating = this.isAnimating;
    this.clearCollapseAnimationCompletion(panel);
    if (!wasAnimating) return;
    this.isAnimating = false;
    this.dsChromeTransitionEnd.emit({ source: 'panel-nav' });
  }

  private clearCollapseAnimationCompletion(panel: HTMLElement | null) {
    if (this.transitionCompletionHandler) {
      panel?.removeEventListener('transitionend', this.transitionCompletionHandler);
      panel?.removeEventListener('transitioncancel', this.transitionCompletionHandler);
      this.transitionCompletionHandler = undefined;
    }
    if (this.transitionFallbackTimer !== null) {
      window.clearTimeout(this.transitionFallbackTimer);
      this.transitionFallbackTimer = null;
    }
  }

  private effectiveBreakpoint(): number {
    if (this.breakpoint > 0) return this.breakpoint;
    const attributeValue = Number(this.el.getAttribute('breakpoint') ?? 0);
    return Number.isFinite(attributeValue) && attributeValue > 0 ? attributeValue : 0;
  }

  private isViewportNarrow(): boolean {
    const breakpoint = this.effectiveBreakpoint();
    return typeof window !== 'undefined' && breakpoint > 0 && window.innerWidth < breakpoint;
  }

  private connectResizeObserver() {
    this.viewportNarrow = this.isViewportNarrow();
    this.resizeObserver = new ResizeObserver(() => {
      this.viewportNarrow = this.isViewportNarrow();
    });
    this.resizeObserver.observe(document.documentElement);
  }

  private disconnectResizeObserver() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
  }

  private connectScrollRegionObserver() {
    this.disconnectScrollRegionObserver();
    if (!this.bodyEl || typeof ResizeObserver === 'undefined') return;
    this.scrollRegionObserver = new ResizeObserver(() => this.updateBodyScrollable());
    this.scrollRegionObserver.observe(this.bodyEl);
  }

  private disconnectScrollRegionObserver() {
    this.scrollRegionObserver?.disconnect();
    this.scrollRegionObserver = undefined;
  }

  private updateBodyScrollable() {
    const next = Boolean(this.bodyEl && this.bodyEl.scrollHeight > this.bodyEl.clientHeight + 1);
    if (next !== this.bodyScrollable) this.bodyScrollable = next;
  }

  /** Derive active ID from the current URL by matching item `href` values.
   *  Uses longest segment-boundary prefix match. */
  private syncActiveFromUrl() {
    if (!this.currentUrl) {
      this.urlDerivedActiveId = '';
      this.urlDerivedActiveChildId = '';
      return;
    }
    const selection = derivePanelNavSelectionFromUrl(this.currentUrl, this.getAllItems());
    this.urlDerivedActiveId = selection.parentId;
    this.urlDerivedActiveChildId = selection.childId;
  }

  private syncExpandedParent() {
    const active = this.getAllItems().find(item => item.id === this.effectiveActiveId);
    this.expandedParentId =
      this.presentation === 'nested' && active?.children?.length ? active.id : '';
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
      try {
        localStorage.setItem(this.storageKey, String(next));
      } catch {
        /* unavailable */
      }
    }
    this.dsNavToggle.emit(next);
  }

  private getAllItems(): PanelNavItem[] {
    return this.parsedGroups.flatMap(g => g.items);
  }

  private getVisibleRovingEntries(): PanelNavRovingEntry[] {
    return this.getAllItems().flatMap<PanelNavRovingEntry>(item => {
      const parent: PanelNavRovingEntry = { kind: 'parent', item };
      if (
        this.presentation !== 'nested' ||
        this.collapsedPresentation ||
        item.id !== this.expandedParentId ||
        !item.children?.length
      ) {
        return [parent];
      }
      return [
        parent,
        ...item.children
          .filter(child => !child.isInactive)
          .map<PanelNavRovingEntry>(child => ({ kind: 'child', parent: item, child })),
      ];
    });
  }

  private getFirstRovingIndex(): number {
    return this.viewportNarrow ? 1 : 0;
  }

  private getFooterRovingIndex(): number {
    return 1 + this.getVisibleRovingEntries().length;
  }

  private getUserRovingIndex(): number {
    return this.getFooterRovingIndex() + 1;
  }

  private getRovingElement(index: number): HTMLElement | null {
    const itemCount = this.getVisibleRovingEntries().length;
    if (index === 0) {
      return this.viewportNarrow ? null : this.el.querySelector('.panel-nav__header-btn');
    }
    if (index >= 1 && index <= itemCount) {
      const items = this.el.querySelectorAll<HTMLElement>(
        '.panel-nav__body [data-panel-nav-roving]'
      );
      return items[index - 1] ?? null;
    }
    if (index === this.getFooterRovingIndex()) {
      return this.el.querySelector('.panel-nav__footer-btn .button-unfilled');
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

  private activateRovingIndex(index: number, keyboard = false) {
    const entries = this.getVisibleRovingEntries();
    const itemCount = entries.length;
    if (index === 0) {
      this.handleToggle();
      return;
    }
    if (index >= 1 && index <= itemCount) {
      const entry = entries[index - 1];
      if (!entry) return;
      if (entry.kind === 'child') {
        this.emitChildSelect(entry.parent, entry.child);
      } else if (entry.item.children?.length) {
        this.activateParent(entry.item, keyboard);
      } else {
        this.handleItemClick(entry.item.id);
      }
      return;
    }
    if (index === this.getFooterRovingIndex()) {
      this.handleFooterAction();
      return;
    }
    if (index === this.getUserRovingIndex()) {
      const anchor = this.el.querySelector(
        `#${PANEL_NAV_USER_MENU_ANCHOR_ID}`
      ) as HTMLElement | null;
      if (anchor)
        this.dsNavUserAction.emit({ anchor, menuPlacement: PANEL_NAV_USER_MENU_PLACEMENT });
    }
  }

  private handleRovingKeyDown(e: KeyboardEvent, index: number) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.activateRovingIndex(index, true);
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

  private emitChildSelect(parent: PanelNavItem, child: PanelNavChildItem) {
    if (child.isInactive) return;
    this.dsNavChildSelect.emit({
      parentId: parent.id,
      childId: child.id,
      href: child.href,
    });
  }

  private followFlyoutAnchor(child: PanelNavChildItem) {
    const href = resolveSafeUrl(child.href);
    if (this.routerMode !== 'anchor' || !href) return;
    const anchor = this.el.ownerDocument.createElement('a');
    anchor.href = href;
    anchor.hidden = true;
    this.el.append(anchor);
    anchor.click();
    anchor.remove();
  }

  private activateParent(parent: PanelNavItem, keyboard = false) {
    if (this.presentation === 'nested') {
      this.expandedParentId = parent.id;
      if (this.collapsedPresentation) {
        if (this.flyoutParentId === parent.id && this.flyoutOpen) {
          this.closeFlyout();
          return;
        }
        this.flyoutInitialFocusVisible = keyboard;
        this.flyoutParentId = parent.id;
        this.flyoutOpen = true;
        return;
      }
    }

    const child = firstEnabledPanelNavChild(parent.children);
    if (child) this.emitChildSelect(parent, child);
  }

  private parentAnchorId(parentId: string): string {
    return `panel-nav-parent-${this.instanceId}-${parentId.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  }

  private childListId(parentId: string): string {
    return `panel-nav-children-${this.instanceId}-${parentId.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  }

  private closeFlyout = () => {
    this.flyoutOpen = false;
    this.flyoutInitialFocusVisible = false;
  };

  private handleFlyoutAfterClose = () => {
    if (!this.flyoutOpen) this.flyoutParentId = '';
  };

  private handleFlyoutSelect = (event: CustomEvent<MenuItemData>) => {
    const parent = this.getAllItems().find(item => item.id === this.flyoutParentId);
    const child = parent?.children?.find(item => item.id === event.detail?.value);
    if (!parent || !child) return;
    this.emitChildSelect(parent, child);
    this.followFlyoutAnchor(child);
    this.closeFlyout();
  };

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
    if (prefersReducedMotion()) {
      this.showEdgeOverlay = true;
      return;
    }
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
        <ds-button-unfilled
          variant="icon"
          class="panel-nav__footer-btn"
          icon={isDashboardChrome ? 'Gear' : 'Dashboard'}
          activeFill={false}
          hasBorder={false}
          focusTabIndex={this.rovingIndex === this.getFooterRovingIndex() ? 0 : -1}
          aria-label={footerLabel}
          onDsClick={() => this.handleFooterAction()}
          onKeyDown={(e: KeyboardEvent) => this.handleRovingKeyDown(e, this.getFooterRovingIndex())}
          onFocusin={() => {
            this.rovingIndex = this.getFooterRovingIndex();
          }}
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
        class={{
          'panel-nav__item': true,
          'panel-nav__footer-user': true,
          'panel-nav__footer-user--menu-expanded': this.accountMenuExpanded,
          'ds-focus-ring-inset': true,
          'ds-interaction-fill': true,
        }}
        tabIndex={this.rovingIndex === this.getUserRovingIndex() ? 0 : -1}
        aria-label={this.accountLabel}
        aria-haspopup="menu"
        aria-expanded={String(this.accountMenuExpanded)}
        onClick={e => this.handleUserAction(e)}
        onKeyDown={(e: KeyboardEvent) => this.handleRovingKeyDown(e, this.getUserRovingIndex())}
        onFocus={() => {
          this.rovingIndex = this.getUserRovingIndex();
        }}
      >
        <ds-text
          class="panel-nav__item-label panel-nav__footer-user-label panel-nav__item-label-text ds-control--md"
          as="span"
          variant="text-body-medium"
          emphasis
          color="inherit"
          lineTruncation={1}
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

  private renderParentItem(item: PanelNavItem, rovingPosition: number, collapsed: boolean) {
    const isActive = item.id === this.effectiveActiveId;
    const hasChildRoutes = (item.children?.length ?? 0) > 0;
    const disclosure = this.presentation === 'nested' && hasChildRoutes;
    const expanded = disclosure
      ? collapsed
        ? this.flyoutParentId === item.id
        : this.expandedParentId === item.id
      : false;

    const itemContent = [
      <span class="panel-nav__item-icon">
        <ds-icon name={item.icon} size="md" color="inherit" />
      </span>,
      <ds-text
        class="panel-nav__item-label panel-nav__item-label-text ds-control--md"
        as="span"
        variant="text-body-medium"
        emphasis={isActive}
        color="inherit"
        lineTruncation={1}
      >
        {item.label}
      </ds-text>,
      item.dot && (
        <span class="panel-nav__item-dot-box" aria-hidden="true">
          <ds-badge class="panel-nav__item-dot" variant="dot" hasRing={collapsed} label="" />
        </span>
      ),
    ];

    const sharedProps = {
      id: disclosure ? this.parentAnchorId(item.id) : undefined,
      class: {
        'panel-nav__item': true,
        'panel-nav__parent': disclosure,
        'panel-nav__parent--expanded': expanded,
        'panel-nav__parent--flyout-active': collapsed && this.flyoutParentId === item.id,
        'panel-nav__parent--muted':
          this.presentation === 'nested' &&
          !collapsed &&
          this.expandedParentId !== '' &&
          this.expandedParentId !== item.id,
        'panel-nav__item--active': isActive,
        'ds-focus-ring-inset': true,
        'ds-interaction-fill': true,
      },
      'aria-current': !disclosure && isActive ? ('page' as const) : undefined,
      'aria-expanded': disclosure ? String(expanded) : undefined,
      'aria-controls': disclosure && expanded ? this.childListId(item.id) : undefined,
      'aria-haspopup': disclosure && collapsed ? ('menu' as const) : undefined,
      'data-panel-nav-roving': '',
      tabIndex: rovingPosition === this.rovingIndex ? 0 : -1,
      onClick: (event: MouseEvent) =>
        hasChildRoutes
          ? this.activateParent(item, event.detail === 0)
          : this.handleItemClick(item.id),
      onKeyDown: (e: KeyboardEvent) => this.handleRovingKeyDown(e, rovingPosition),
      onFocus: () => {
        this.rovingIndex = rovingPosition;
      },
    };

    const href = resolveSafeUrl(
      hasChildRoutes ? firstEnabledPanelNavChild(item.children)?.href : item.href
    );
    const useAnchor = this.routerMode === 'anchor' && href && !(disclosure && collapsed);
    const control = useAnchor ? (
      <a {...sharedProps} href={href}>
        {itemContent}
      </a>
    ) : (
      <button {...sharedProps} type="button">
        {itemContent}
      </button>
    );

    // Always wrap so label fade CSS can transition on a stable item node.
    // Tip only when collapsed (empty label → ds-tooltip skips show).
    return (
      <ds-tooltip label={collapsed ? item.label : ''} side="right" size="sm">
        {control}
      </ds-tooltip>
    );
  }

  private renderChildItem(
    parent: PanelNavItem,
    child: PanelNavChildItem,
    rovingPosition: number | undefined,
    childIndex: number,
    childReverseIndex: number
  ) {
    const isActive =
      parent.id === this.effectiveActiveId && child.id === this.effectiveActiveChildId;
    const inactive = child.isInactive === true;
    const content = [
      <ds-text
        class="panel-nav__item-label panel-nav__item-label-text ds-control--md"
        as="span"
        variant="text-body-medium"
        emphasis={isActive}
        color="inherit"
        lineTruncation={1}
      >
        {child.label}
      </ds-text>,
      child.dot && (
        <span class="panel-nav__child-dot" aria-hidden="true">
          <ds-badge variant="dot" label="" />
        </span>
      ),
    ];
    const sharedProps = {
      class: {
        'panel-nav__item': true,
        'panel-nav__child': true,
        'ds-nav-disclosure__item': true,
        'panel-nav__child--active': isActive,
        'panel-nav__child--inactive': inactive,
        'panel-nav__item--active': isActive,
        'ds-focus-ring-inset': !inactive,
        'ds-interaction-fill': !inactive,
      },
      'aria-current': isActive ? ('page' as const) : undefined,
      'aria-disabled': inactive ? 'true' : undefined,
      'data-panel-nav-roving': inactive || rovingPosition === undefined ? undefined : '',
      style: {
        '--_panel-nav-child-index': String(childIndex),
        '--_panel-nav-child-reverse-index': String(childReverseIndex),
        '--ds-nav-disclosure-index': String(childIndex),
        '--ds-nav-disclosure-reverse-index': String(childReverseIndex),
      },
      tabIndex: !inactive && rovingPosition === this.rovingIndex ? 0 : -1,
      onClick: () => this.emitChildSelect(parent, child),
      onKeyDown: (event: KeyboardEvent) =>
        rovingPosition === undefined ? undefined : this.handleRovingKeyDown(event, rovingPosition),
      onFocus: () => {
        if (rovingPosition !== undefined) this.rovingIndex = rovingPosition;
      },
    };
    const href = resolveSafeUrl(child.href);
    const useAnchor = !inactive && this.routerMode === 'anchor' && href;

    return useAnchor ? (
      <a {...sharedProps} href={href}>
        {content}
      </a>
    ) : (
      <button {...sharedProps} type="button" disabled={inactive}>
        {content}
      </button>
    );
  }

  private renderFlyout() {
    const parent = this.getAllItems().find(item => item.id === this.flyoutParentId);
    if (!parent?.children?.length) return null;
    return (
      <ds-menu
        id={this.childListId(parent.id)}
        open={this.flyoutOpen}
        side={PANEL_NAV_CHILD_MENU_PLACEMENT.side}
        align={PANEL_NAV_CHILD_MENU_PLACEMENT.align}
        anchorAlignment={PANEL_NAV_CHILD_MENU_PLACEMENT.anchorAlignment}
        sideOffset={PANEL_NAV_CHILD_MENU_PLACEMENT.sideOffset}
        alignOffset={PANEL_NAV_CHILD_MENU_PLACEMENT.alignOffset}
        anchorId={this.parentAnchorId(parent.id)}
        selectionMode="single"
        menuLabel={`${parent.label} sections`}
        initialFocusVisible={this.flyoutInitialFocusVisible}
        sections={[
          {
            items: parent.children.map(child => ({
              label: child.label,
              value: child.id,
              dot: child.dot,
              isInactive: child.isInactive,
              isSelected:
                parent.id === this.effectiveActiveId && child.id === this.effectiveActiveChildId,
            })),
          },
        ]}
        onDsSelect={this.handleFlyoutSelect}
        onDsClose={this.closeFlyout}
        onDsAfterClose={this.handleFlyoutAfterClose}
      />
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
      'ds-control--md': true,
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
          aria-label={
            isDashboardChrome ? this.dashboardNavigationLabel : this.settingsNavigationLabel
          }
        >
          {/* ── Header: Motive logo, reveals collapse toggle on hover ── */}
          <div class="panel-nav__header ds-chrome-row ds-chrome-space--md">
            <button
              type="button"
              class="panel-nav__header-btn ds-focus-ring-inset ds-interaction-fill"
              disabled={this.viewportNarrow}
              tabIndex={!this.viewportNarrow && this.rovingIndex === 0 ? 0 : -1}
              onClick={() => this.handleToggle()}
              onKeyDown={(e: KeyboardEvent) => this.handleRovingKeyDown(e, 0)}
              onFocus={() => {
                this.rovingIndex = 0;
              }}
              aria-label={collapsed ? this.expandNavigationLabel : this.collapseNavigationLabel}
              aria-expanded={collapsed ? 'false' : 'true'}
            >
              {/* Motive M mark — fades out on hover to reveal collapse toggle */}
              <span class="panel-nav__header-logo" aria-hidden="true">
                <svg
                  class="panel-nav__m-mark"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  focusable="false"
                  aria-hidden="true"
                >
                  <path
                    d="M11.1159 4.31537H7.67021L2.53401 13.0703H0V15.6875H4.02716L8.24319 8.49978V15.6846H11.6342L15.8289 8.47829V15.6846H18.7122V4.3125H15.2559L11.1159 11.3648V4.31537Z"
                    fill="currentColor"
                  />
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
              'ds-chrome-column': true,
              'ds-chrome-space--md': true,
              'ds-scrollbar-hidden': true,
              'ds-focus-ring': this.bodyScrollable,
              ...scrollEdgeFadeClassMap({ edges: 'bottom' }),
            }}
            ref={element => {
              const next = (element as HTMLElement) ?? undefined;
              if (next === this.bodyEl) return;
              this.bodyEl = next;
              this.connectScrollRegionObserver();
            }}
            role={this.bodyScrollable ? 'region' : undefined}
            aria-label={this.bodyScrollable ? this.navigationItemsLabel : undefined}
            tabIndex={this.bodyScrollable ? 0 : undefined}
          >
            <div class="panel-nav__sections">
              {(() => {
                let rovingPosition = 1;
                return this.parsedGroups.map(group => (
                  <div class="panel-nav__group" key={group.id ?? group.label}>
                    {group.label && (
                      <ds-text
                        class="panel-nav__group-label ds-control--md"
                        as="span"
                        variant="text-caption"
                        emphasis
                        color="inherit"
                      >
                        {group.label}
                      </ds-text>
                    )}
                    {group.items.map((item, itemIndex) => {
                      const parentPosition = rovingPosition++;
                      const expanded =
                        !collapsed &&
                        this.inlineChildrenExpansionReady &&
                        item.id === this.expandedParentId &&
                        (item.children?.length ?? 0) > 0;
                      const hasGroupSiblings = group.items.length > 1;
                      const hasDividerBefore = hasGroupSiblings && itemIndex > 0;
                      const hasDividerAfter =
                        hasGroupSiblings && itemIndex < group.items.length - 1;
                      const showBranchDividers = expanded && hasGroupSiblings;
                      const hasInlineChildren =
                        this.presentation === 'nested' &&
                        (!collapsed || this.isAnimating) &&
                        (item.children?.length ?? 0) > 0;
                      const children = hasInlineChildren
                        ? item.children?.map((child, childIndex) => {
                            const childPosition =
                              !expanded || child.isInactive ? undefined : rovingPosition++;
                            return this.renderChildItem(
                              item,
                              child,
                              childPosition,
                              childIndex,
                              (item.children?.length ?? 0) - childIndex - 1
                            );
                          })
                        : null;
                      return (
                        <div class="panel-nav__branch" key={item.id}>
                          {hasDividerBefore ? (
                            <div
                              key={`${item.id}-divider-before`}
                              class={{
                                'panel-nav__branch-divider': true,
                                'panel-nav__branch-divider--before': true,
                                'panel-nav__branch-divider--open': showBranchDividers,
                                'ds-nav-disclosure-divider': true,
                                'ds-nav-disclosure-divider--open': showBranchDividers,
                              }}
                              aria-hidden="true"
                            >
                              <div class="panel-nav__branch-divider-clip ds-nav-disclosure-divider__clip">
                                <span class="panel-nav__branch-divider-line"></span>
                              </div>
                            </div>
                          ) : null}
                          {this.renderParentItem(item, parentPosition, collapsed)}
                          {hasInlineChildren ? (
                            <div
                              key={`${item.id}-children`}
                              class={{
                                'panel-nav__children-accordion': true,
                                'panel-nav__children-accordion--open': expanded,
                                'ds-nav-disclosure': true,
                                'ds-nav-disclosure--open': expanded,
                              }}
                              aria-hidden={expanded ? undefined : 'true'}
                              inert={expanded ? undefined : true}
                            >
                              <div
                                id={this.childListId(item.id)}
                                class="panel-nav__children"
                                role="group"
                                aria-labelledby={this.parentAnchorId(item.id)}
                              >
                                {children}
                              </div>
                            </div>
                          ) : null}
                          {hasDividerAfter ? (
                            <div
                              key={`${item.id}-divider-after`}
                              class={{
                                'panel-nav__branch-divider': true,
                                'panel-nav__branch-divider--after': true,
                                'panel-nav__branch-divider--open': showBranchDividers,
                                'ds-nav-disclosure-divider': true,
                                'ds-nav-disclosure-divider--open': showBranchDividers,
                              }}
                              aria-hidden="true"
                            >
                              <div class="panel-nav__branch-divider-clip ds-nav-disclosure-divider__clip">
                                <span class="panel-nav__branch-divider-line"></span>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* ── Footer ── */}
          <div class="panel-nav__footer">
            {this.renderFooterAction(isDashboardChrome)}
            {this.renderFooterUser(collapsed, userName, userInitial)}
          </div>
        </nav>

        {this.renderFlyout()}

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
