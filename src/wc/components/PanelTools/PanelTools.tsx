import {
  Component,
  Prop,
  Event,
  EventEmitter,
  Element,
  State,
  Watch,
  Method,
  Listen,
  h,
  Host,
} from '@stencil/core';
import type { ChromeTransitionDetail } from '../../shell/chrome-transition';
import {
  PANEL_TOOLS_FOOTER_TOOL_ID,
  PANEL_TOOLS_LABELS,
  PANEL_TOOLS_PRIMARY_TOOL_ID,
  PANEL_TOOLS_SHORTCUTS,
  type PanelToolsHeaderAction,
  type PanelToolsHeaderConfig,
  type PanelToolsHeaders,
  type PanelToolsItem,
  type PanelToolsToolId,
} from './panel-tools-types';
import {
  isPanelToolsToolId,
  orderPanelToolsItems,
  panelToolsDrawerAtTerminal,
  parsePanelToolsItems,
  panelToolsDrawerResting,
  panelToolsDrawerTransitionMs,
  reconcilePanelToolsAvailability,
  resolvePanelToolActivation,
} from './panel-tools-utils';

@Component({
  tag: 'ds-panel-tools',
  styleUrl: 'PanelTools.css',
  scoped: true,
})
export class PanelTools {
  @Element() el!: HTMLElement;

  /** When false, only the icon rail is shown. */
  @Prop({ mutable: true, reflect: true }) open: boolean = false;

  /** Drawer presentation or viewport-covering presentation for the active tool. */
  @Prop({ mutable: true, reflect: true }) presentation: 'drawer' | 'fullscreen' = 'drawer';

  /** Let a fullscreen product supply independent master/detail headers inside its view. */
  @Prop({ attribute: 'fullscreen-header-mode', reflect: true })
  fullscreenHeaderMode: 'shared' | 'split' = 'shared';

  /** Active tool view — `search`, `agents`, `messages`, `stacks`, `activity`, or `help`. */
  @Prop({ mutable: true, attribute: 'active-tool', reflect: true })
  activeTool: PanelToolsToolId | '' = '';

  /**
   * Rail items rendered in the right column.
   * Set via JS property: `el.items = [...]`. Replace the array reference to update.
   */
  @Prop() items: PanelToolsItem[] = [];

  /** JSON fallback for `items` — useful when framework bindings don't propagate arrays. */
  @Prop({ attribute: 'items-json' }) itemsJson: string = '';
  @Prop() toolsLabel: string = 'Tools';
  @Prop() toolShortcutsLabel: string = 'Tool shortcuts';

  /** Active header state per tool. Replace the object when title, depth, or actions change. */
  @Prop() headers: PanelToolsHeaders = {};

  /** JSON fallback for `headers`. The `headers` property takes precedence when non-empty. */
  @Prop({ attribute: 'headers-json' }) headersJson: string = '';

  /**
   * Optional localStorage key for the last active tool. The drawer always starts
   * closed; only the tool identity is restored for continuity within this browser.
   */
  @Prop({ attribute: 'storage-key' }) storageKey: string = '';

  /** Emitted when a rail button is toggled. Detail = { id, selected }. */
  @Event({ bubbles: true, composed: true }) dsToolChange!: EventEmitter<{
    id: PanelToolsToolId;
    selected: boolean;
  }>;

  /** Emitted when fullscreen changes, including Escape-initiated exits. */
  @Event({ bubbles: true, composed: true }) dsPresentationChange!: EventEmitter<{
    presentation: 'drawer' | 'fullscreen';
  }>;

  /** Requests navigation to the active tool's parent view. */
  @Event({ bubbles: true, composed: true }) dsHeaderBack!: EventEmitter<{
    tool: PanelToolsToolId;
  }>;

  /** Requests one application-owned action from the active tool header. */
  @Event({ bubbles: true, composed: true }) dsHeaderAction!: EventEmitter<{
    tool: PanelToolsToolId;
    id: string;
  }>;

  /** Bubbling lifecycle — `ds-bar-nav` defers overflow checks during drawer motion. */
  @Event({ bubbles: true, composed: true })
  dsChromeTransitionStart!: EventEmitter<ChromeTransitionDetail>;

  @Event({ bubbles: true, composed: true })
  dsChromeTransitionEnd!: EventEmitter<ChromeTransitionDetail>;

  /** Arms open vs close easing for the in-flight width transition. */
  @State() private motion: 'opening' | 'closing' | 'idle' = 'idle';

  /** Keeps header and slotted content painted until the closing clip transition completes. */
  @State() private drawerSurfaceRetained = false;

  /** Suppresses width transition until the host has painted its initial open state. */
  @State() private readyForMotion = false;

  /** Fullscreen presentation changes snap without borrowing drawer width motion. */
  @State() private presentationMotionSuppressed = false;

  @State() private rovingIndex = 0;
  @State() private fullViewToolIds: PanelToolsToolId[] = [];

  private motionEnableGeneration = 0;
  private presentationMotionGeneration = 0;
  private transitionGeneration = 0;
  private transitionFallbackTimer: number | null = null;
  /** Ignores the old transition's terminal event when reversing direction. */
  private ignoreReplacementTerminal = false;
  private focusBeforeFullscreen: HTMLElement | null = null;
  private fullViewObserver: MutationObserver | null = null;

  private get railItems(): PanelToolsItem[] {
    return parsePanelToolsItems(this.items, this.itemsJson);
  }

  private get orderedRailItems(): PanelToolsItem[] {
    const railItems = orderPanelToolsItems(this.railItems);
    const headerItem = railItems.find(item => item.id === PANEL_TOOLS_PRIMARY_TOOL_ID);
    const footerItem = railItems.find(item => item.id === PANEL_TOOLS_FOOTER_TOOL_ID);
    const bodyItems = railItems.filter(
      item => item.id !== PANEL_TOOLS_PRIMARY_TOOL_ID && item.id !== PANEL_TOOLS_FOOTER_TOOL_ID
    );
    const ordered: PanelToolsItem[] = [];
    if (headerItem) ordered.push(headerItem);
    ordered.push(...bodyItems);
    if (footerItem) ordered.push(footerItem);
    return ordered;
  }

  disconnectedCallback() {
    this.el.removeEventListener('transitionend', this.handleTransitionEnd);
    this.el.removeEventListener('transitioncancel', this.handleTransitionEnd);
    this.el.removeEventListener('dsAction', this.handleComposedHeaderAction);
    this.clearTransitionCompletion();
    this.motionEnableGeneration += 1;
    this.fullViewObserver?.disconnect();
    this.fullViewObserver = null;
  }

  @Watch('presentation')
  presentationChanged(next: 'drawer' | 'fullscreen', previous?: 'drawer' | 'fullscreen') {
    if (next === previous) return;
    const presentationGeneration = ++this.presentationMotionGeneration;
    this.presentationMotionSuppressed = true;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (presentationGeneration !== this.presentationMotionGeneration) return;
        this.presentationMotionSuppressed = false;
      });
    });
    if (next === 'fullscreen') {
      this.focusBeforeFullscreen =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      this.open = true;
    } else if (previous === 'fullscreen') {
      const focusBeforeFullscreen = this.focusBeforeFullscreen;
      const fallbackActionId = this.activeHeader().actions?.[0]?.id;
      requestAnimationFrame(async () => {
        if (focusBeforeFullscreen?.isConnected) {
          focusBeforeFullscreen.focus({ preventScroll: true });
        }
        const focusRestored = focusBeforeFullscreen
          ? document.activeElement === focusBeforeFullscreen ||
            focusBeforeFullscreen.contains(document.activeElement)
          : false;
        if (!focusRestored && fallbackActionId) await this.focusHeaderAction(fallbackActionId);
        this.focusBeforeFullscreen = null;
      });
    }
    this.dsPresentationChange.emit({ presentation: next });
  }

  @Listen('keydown', { target: 'window', capture: true })
  handleFullscreenEscape(event: KeyboardEvent) {
    if (this.presentation !== 'fullscreen' || event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    this.presentation = 'drawer';
  }

  private deferMotionEnable() {
    if (this.readyForMotion) return;
    const generation = ++this.motionEnableGeneration;
    requestAnimationFrame(() => {
      if (generation !== this.motionEnableGeneration) return;
      requestAnimationFrame(() => {
        if (generation !== this.motionEnableGeneration) return;
        this.readyForMotion = true;
      });
    });
  }

  connectedCallback() {
    this.el.addEventListener('transitionend', this.handleTransitionEnd);
    this.el.addEventListener('transitioncancel', this.handleTransitionEnd);
    this.el.addEventListener('dsAction', this.handleComposedHeaderAction);
  }

  private handleComposedHeaderAction = (event: Event) => {
    const detail = (event as CustomEvent<{ id?: string }>).detail;
    if (!this.activeTool || !detail?.id) return;
    event.stopPropagation();
    this.dsHeaderAction.emit({ tool: this.activeTool, id: detail.id });
  };

  componentWillLoad() {
    this.restoreLastActiveTool();
    this.drawerSurfaceRetained = this.open;
  }

  @Watch('open')
  openChanged(isOpen: boolean, wasOpen?: boolean) {
    if (isOpen) this.drawerSurfaceRetained = true;
    if (this.readyForMotion && wasOpen !== undefined && wasOpen !== isOpen) {
      this.startDrawerTransition(isOpen ? 'opening' : 'closing');
    } else if (!isOpen) {
      this.drawerSurfaceRetained = false;
    }
    this.deferMotionEnable();
  }

  @Watch('activeTool')
  activeToolChanged() {
    this.persistLastActiveTool();
    this.deferMotionEnable();
  }

  @Watch('storageKey')
  storageKeyChanged() {
    this.restoreLastActiveTool();
  }

  componentDidLoad() {
    this.deferMotionEnable();
    this.syncFullViewTools();
    this.fullViewObserver = new MutationObserver(() => this.syncFullViewTools());
    this.fullViewObserver.observe(this.el, {
      childList: true,
      attributes: true,
      attributeFilter: ['slot'],
    });
  }

  @Watch('items')
  @Watch('itemsJson')
  itemsChanged() {
    this.rovingIndex = 0;
    this.reconcileActiveTool();
    this.deferMotionEnable();
  }

  private restoreLastActiveTool() {
    if (!this.storageKey || this.activeTool) return;
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (isPanelToolsToolId(stored)) this.activeTool = stored;
    } catch {
      /* localStorage unavailable */
    }
  }

  private persistLastActiveTool() {
    if (!this.storageKey || !this.activeTool) return;
    try {
      localStorage.setItem(this.storageKey, this.activeTool);
    } catch {
      /* unavailable */
    }
  }

  private clearPersistedTool() {
    if (!this.storageKey) return;
    try {
      localStorage.removeItem(this.storageKey);
    } catch {
      /* unavailable */
    }
  }

  private reconcileActiveTool() {
    const next = reconcilePanelToolsAvailability(this.railItems, this.open, this.activeTool);
    if (!next.removedTool) return;
    this.clearPersistedTool();
    this.open = next.open;
    this.activeTool = next.activeTool;
    this.dsToolChange.emit({ id: next.removedTool, selected: false });
  }

  private startDrawerTransition(phase: 'opening' | 'closing') {
    const drawer = this.el.querySelector('.panel-tools__drawer') as HTMLElement | null;
    if (this.motion !== 'idle') {
      this.finishDrawerTransition();
      this.ignoreReplacementTerminal = true;
    }
    this.motion = phase;
    this.dsChromeTransitionStart.emit({ source: 'panel-tools', phase });
    const generation = ++this.transitionGeneration;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (generation !== this.transitionGeneration || this.motion !== phase) return;
        if (!drawer) {
          this.finishDrawerTransition();
          return;
        }

        if (this.drawerTransitionAtTerminal(drawer, phase)) {
          this.finishDrawerTransition();
          return;
        }

        const fallbackMs = panelToolsDrawerTransitionMs(getComputedStyle(drawer));
        if (fallbackMs <= 0) {
          this.finishDrawerTransition();
          return;
        }
        this.transitionFallbackTimer = window.setTimeout(() => {
          this.finishDrawerTransition();
        }, fallbackMs);
      });
    });
  }

  private handleTransitionEnd = (event: TransitionEvent) => {
    const drawer = this.el.querySelector('.panel-tools__drawer') as HTMLElement | null;
    if (event.target !== drawer) return;
    if (event.propertyName !== 'max-width') return;
    if (this.ignoreReplacementTerminal) {
      this.ignoreReplacementTerminal = false;
      return;
    }
    // Changing from the neutral transition recipe to the direction-specific
    // easing can cancel the transition that the reflected `open` class began.
    // The replacement transition and its watchdog still own completion; ending
    // motion here would hide the fixed-width tool surface while it is visible.
    if (event.type === 'transitioncancel') return;
    if (drawer && !this.drawerTransitionAtTerminal(drawer, this.motion)) return;
    this.finishDrawerTransition();
  };

  private drawerTransitionAtTerminal(
    drawer: HTMLElement,
    phase: 'opening' | 'closing' | 'idle'
  ): boolean {
    const width = drawer.getBoundingClientRect().width;
    const surface = drawer.querySelector('.panel-tools__drawer-surface') as HTMLElement | null;
    const targetWidth = surface?.getBoundingClientRect().width ?? 0;
    return panelToolsDrawerAtTerminal(width, targetWidth, phase);
  }

  private finishDrawerTransition() {
    const completedPhase = this.motion;
    const wasTransitioning = completedPhase !== 'idle';
    this.clearTransitionCompletion();
    if (!wasTransitioning) return;
    this.ignoreReplacementTerminal = false;
    this.motion = 'idle';
    if (completedPhase === 'closing' && !this.open) {
      this.drawerSurfaceRetained = false;
    }
    this.dsChromeTransitionEnd.emit({ source: 'panel-tools' });
  }

  private clearTransitionCompletion() {
    this.transitionGeneration += 1;
    if (this.transitionFallbackTimer !== null) {
      window.clearTimeout(this.transitionFallbackTimer);
      this.transitionFallbackTimer = null;
    }
  }

  /** Rail selection follows `open` immediately — independent of the slide animation. */
  private isRailSelected(id: PanelToolsToolId): boolean {
    return this.open && this.activeTool === id;
  }

  /** Drawer body stays mounted while the clip frame animates closed. */
  private isDrawerPresent(): boolean {
    return this.open || this.drawerSurfaceRetained;
  }

  private isViewActive(id: PanelToolsToolId): boolean {
    return this.isDrawerPresent() && this.activeTool === id;
  }

  private hasFullView(id: PanelToolsToolId): boolean {
    return this.fullViewToolIds.includes(id);
  }

  private syncFullViewTools() {
    const ids: PanelToolsToolId[] = ['search', 'messages', 'stacks', 'activity', 'agents', 'help'];
    const next = ids.filter(id => Boolean(this.el.querySelector(`[slot="${id}-view"]`)));
    if (next.join('|') !== this.fullViewToolIds.join('|')) this.fullViewToolIds = next;
  }

  private headerLabel(): string {
    if (!this.isDrawerPresent() || !this.activeTool) return '';
    return PANEL_TOOLS_LABELS[this.activeTool as PanelToolsToolId] ?? '';
  }

  private resolvedHeaders(): PanelToolsHeaders {
    if (Object.keys(this.headers).length) return this.headers;
    if (!this.headersJson.trim()) return {};
    try {
      const parsed = JSON.parse(this.headersJson);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as PanelToolsHeaders)
        : {};
    } catch {
      return {};
    }
  }

  private activeHeader(): PanelToolsHeaderConfig {
    if (!this.activeTool) return {};
    return this.resolvedHeaders()[this.activeTool] ?? {};
  }

  private handleToolChange = (id: PanelToolsToolId) => {
    const next = resolvePanelToolActivation(this.open, this.activeTool, id);
    this.open = next.open;
    this.activeTool = next.activeTool;
    this.dsToolChange.emit({ id, selected: next.selected });
  };

  /** Toggle any rail tool open/closed — shell shortcuts K/A/S/M/N call this. */
  @Method()
  async activateTool(id: PanelToolsToolId) {
    const item = this.railItems.find(entry => entry.id === id);
    if (!item || item.isInactive) return;
    this.handleToolChange(id);
  }

  /** Close the tools drawer when open — used by shell keyboard shortcuts. */
  @Method()
  async closeDrawer() {
    if (!this.open) return;
    const id = this.activeTool;
    this.open = false;
    if (id) {
      this.dsToolChange.emit({ id, selected: false });
    }
  }

  /** Focus an active tool-header action by its application-owned id. */
  @Method()
  async focusHeaderAction(id: string) {
    const action = this.el.querySelector(`[data-header-action-id="${CSS.escape(id)}"]`) as
      | (HTMLElement & { setFocus?: () => Promise<void> })
      | null;
    await action?.setFocus?.();
  }

  private focusRailAt(index: number) {
    const items = this.orderedRailItems;
    if (!items.length) return;
    const bounded = Math.max(0, Math.min(index, items.length - 1));
    if (bounded === this.rovingIndex) return;
    this.rovingIndex = bounded;
    const actions = Array.from(
      this.el.querySelectorAll<HTMLElement>('.panel-tools__rail-action .button-icon')
    );
    actions[bounded]?.focus({ preventScroll: true });
  }

  private handleRailKeyDown = (e: KeyboardEvent, index: number) => {
    const items = this.orderedRailItems;
    if (!items.length) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.handleToolChange(items[index].id);
      return;
    }

    if (e.key === 'ArrowDown') {
      if (index >= items.length - 1) return;
      e.preventDefault();
      this.focusRailAt(index + 1);
      return;
    }

    if (e.key === 'ArrowUp') {
      if (index <= 0) return;
      e.preventDefault();
      this.focusRailAt(index - 1);
    }
  };

  private renderRailAction(item: PanelToolsItem, index: number) {
    const label = item.ariaLabel ?? PANEL_TOOLS_LABELS[item.id];
    return (
      <ds-tooltip
        key={item.id}
        label={label}
        shortcutKey={PANEL_TOOLS_SHORTCUTS[item.id]}
        side="left"
        size="sm"
      >
        <ds-button-unfilled
          variant="icon"
          class="panel-tools__rail-action"
          icon={item.icon}
          isActive={this.isRailSelected(item.id)}
          activeFill={false}
          hasBorder={false}
          dot={item.dot ?? false}
          isInactive={item.isInactive}
          focusTabIndex={index === this.rovingIndex ? 0 : -1}
          aria-label={label}
          pressed={this.isRailSelected(item.id)}
          onFocusin={() => {
            this.rovingIndex = index;
          }}
          onKeyDown={(e: KeyboardEvent) => this.handleRailKeyDown(e, index)}
          onDsClick={() => this.handleToolChange(item.id)}
        />
      </ds-tooltip>
    );
  }

  render() {
    const headerLabel = this.headerLabel();
    const header = this.activeHeader();
    const headerTitle = header.title?.trim() || headerLabel;
    const headerActions = header.actions ?? [];
    const orderedRailItems = this.orderedRailItems;
    const headerItem = orderedRailItems.find(item => item.id === PANEL_TOOLS_PRIMARY_TOOL_ID);
    const footerItem = orderedRailItems.find(item => item.id === PANEL_TOOLS_FOOTER_TOOL_ID);
    const bodyItems = orderedRailItems.filter(
      item => item.id !== PANEL_TOOLS_PRIMARY_TOOL_ID && item.id !== PANEL_TOOLS_FOOTER_TOOL_ID
    );
    const footerIndex = footerItem ? (headerItem ? 1 : 0) + bodyItems.length : -1;
    const showDrawerChrome = this.isDrawerPresent();
    const drawerResting = panelToolsDrawerResting(this.open, this.motion);
    const activeFullView = Boolean(
      showDrawerChrome && this.activeTool && this.hasFullView(this.activeTool)
    );
    const toolIds: PanelToolsToolId[] = [
      'search',
      'messages',
      'stacks',
      'activity',
      'agents',
      'help',
    ];

    return (
      <Host
        class={{
          'panel-tools': true,
          'panel-tools--open': this.open,
          'panel-tools--ready': this.readyForMotion,
          'panel-tools--motion-opening': this.motion === 'opening',
          'panel-tools--motion-closing': this.motion === 'closing',
          'panel-tools--drawer-resting': drawerResting,
          'panel-tools--fullscreen': this.presentation === 'fullscreen',
          'panel-tools--presentation-snap': this.presentationMotionSuppressed,
        }}
        role={this.presentation === 'fullscreen' ? 'dialog' : 'complementary'}
        aria-modal={this.presentation === 'fullscreen' ? 'true' : undefined}
        aria-label={this.toolsLabel}
      >
        <div class="panel-tools__layout">
          <nav class="panel-tools__rail" aria-label={this.toolShortcutsLabel}>
            {headerItem ? (
              <div class="panel-tools__rail-header">{this.renderRailAction(headerItem, 0)}</div>
            ) : null}
            <div class="panel-tools__rail-body ds-scrollbar-hidden">
              {bodyItems.map((item, bodyIdx) =>
                this.renderRailAction(item, headerItem ? bodyIdx + 1 : bodyIdx)
              )}
            </div>
            {footerItem ? (
              <div class="panel-tools__rail-footer">
                {this.renderRailAction(footerItem, footerIndex)}
              </div>
            ) : null}
          </nav>

          <div
            class={{
              'panel-tools__drawer': true,
              'panel-tools__drawer--visible': showDrawerChrome,
            }}
            aria-hidden={showDrawerChrome ? null : 'true'}
            inert={showDrawerChrome ? undefined : true}
          >
            <div class="panel-tools__drawer-surface">
              {this.presentation !== 'fullscreen' || this.fullscreenHeaderMode === 'shared' ? (
                <ds-panel-tool-header
                  class="panel-tools__header"
                  heading={headerTitle}
                  showBack={header.showBack ?? false}
                  backIcon={header.backIcon || 'ChevronLeft'}
                  backAriaLabel={header.backAriaLabel || 'Back'}
                  showMenu={false}
                  ref={element => {
                    const toolHeader = element as
                      | (HTMLDsPanelToolHeaderElement & {
                          actions: PanelToolsHeaderAction[];
                        })
                      | undefined;
                    if (toolHeader) toolHeader.actions = headerActions;
                  }}
                  onDsBack={() => {
                    if (this.activeTool) this.dsHeaderBack.emit({ tool: this.activeTool });
                  }}
                />
              ) : null}
              <div class="panel-tools__body" hidden={activeFullView}>
                {toolIds.map(id => {
                  const active = this.isViewActive(id);
                  return (
                    <div
                      class={{
                        'panel-tools__view': true,
                        'panel-tools__view--active': active,
                      }}
                      hidden={!active}
                    >
                      <slot name={id} />
                    </div>
                  );
                })}
              </div>
              <div class="panel-tools__full-views" hidden={!activeFullView}>
                {toolIds.map(id => (
                  <div
                    class={{
                      'panel-tools__full-view': true,
                      'panel-tools__full-view--active':
                        this.isViewActive(id) && this.hasFullView(id),
                    }}
                    hidden={!(this.isViewActive(id) && this.hasFullView(id))}
                  >
                    <slot name={`${id}-view`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
