import { Component, Prop, Event, EventEmitter, Element, State, Watch, Method, h, Host } from '@stencil/core';
import type { ChromeTransitionDetail } from '../../nav/chrome-transition';
import {
  PANEL_TOOLS_FOOTER_TOOL_ID,
  PANEL_TOOLS_LABELS,
  PANEL_TOOLS_PRIMARY_TOOL_ID,
  PANEL_TOOLS_SHORTCUTS,
  type PanelToolsItem,
  type PanelToolsToolId,
} from './panel-tools-types';
import {
  isPanelToolsToolId,
  orderPanelToolsItems,
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

  /** Bubbling lifecycle — `ds-bar-nav` defers overflow checks during drawer motion. */
  @Event({ bubbles: true, composed: true })
  dsChromeTransitionStart!: EventEmitter<ChromeTransitionDetail>;

  @Event({ bubbles: true, composed: true })
  dsChromeTransitionEnd!: EventEmitter<ChromeTransitionDetail>;

  /** Arms open vs close easing for the in-flight width transition. */
  @State() private motion: 'opening' | 'closing' | 'idle' = 'idle';

  /** Suppresses width transition until the host has painted its initial open state. */
  @State() private readyForMotion = false;

  @State() private rovingIndex = 0;

  private motionEnableGeneration = 0;
  private transitionGeneration = 0;
  private transitionFallbackTimer: number | null = null;

  private get railItems(): PanelToolsItem[] {
    return parsePanelToolsItems(this.items, this.itemsJson);
  }

  private get orderedRailItems(): PanelToolsItem[] {
    const railItems = orderPanelToolsItems(this.railItems);
    const headerItem = railItems.find(item => item.id === PANEL_TOOLS_PRIMARY_TOOL_ID);
    const footerItem = railItems.find(item => item.id === PANEL_TOOLS_FOOTER_TOOL_ID);
    const bodyItems = railItems.filter(
      item => item.id !== PANEL_TOOLS_PRIMARY_TOOL_ID && item.id !== PANEL_TOOLS_FOOTER_TOOL_ID,
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
    this.clearTransitionCompletion();
    this.motionEnableGeneration += 1;
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
  }

  componentWillLoad() {
    this.restoreLastActiveTool();
  }

  @Watch('open')
  openChanged(isOpen: boolean, wasOpen?: boolean) {
    if (this.readyForMotion && wasOpen !== undefined && wasOpen !== isOpen) {
      this.startDrawerTransition(isOpen ? 'opening' : 'closing');
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
    } catch { /* localStorage unavailable */ }
  }

  private persistLastActiveTool() {
    if (!this.storageKey || !this.activeTool) return;
    try { localStorage.setItem(this.storageKey, this.activeTool); } catch { /* unavailable */ }
  }

  private clearPersistedTool() {
    if (!this.storageKey) return;
    try { localStorage.removeItem(this.storageKey); } catch { /* unavailable */ }
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
    const widthBefore = drawer?.getBoundingClientRect().width ?? 0;
    if (this.motion !== 'idle') this.finishDrawerTransition();
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

        const widthAfter = drawer.getBoundingClientRect().width;
        if (Math.abs(widthAfter - widthBefore) < 1) {
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
    if (event.target !== this.el.querySelector('.panel-tools__drawer')) return;
    if (event.propertyName !== 'max-width') return;
    this.finishDrawerTransition();
  };

  private finishDrawerTransition() {
    const wasTransitioning = this.motion !== 'idle';
    this.clearTransitionCompletion();
    if (!wasTransitioning) return;
    this.motion = 'idle';
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
    return this.open || this.motion === 'closing';
  }

  private isViewActive(id: PanelToolsToolId): boolean {
    return this.isDrawerPresent() && this.activeTool === id;
  }

  private headerLabel(): string {
    if (!this.isDrawerPresent() || !this.activeTool) return '';
    return PANEL_TOOLS_LABELS[this.activeTool as PanelToolsToolId] ?? '';
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

  private focusRailAt(index: number) {
    const items = this.orderedRailItems;
    if (!items.length) return;
    const bounded = Math.max(0, Math.min(index, items.length - 1));
    if (bounded === this.rovingIndex) return;
    this.rovingIndex = bounded;
    const actions = Array.from(
      this.el.querySelectorAll<HTMLElement>('.panel-tools__rail-action .button-icon'),
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
        <ds-button-unfilled variant="icon"
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
          onFocusin={() => { this.rovingIndex = index; }}
          onKeyDown={(e: KeyboardEvent) => this.handleRailKeyDown(e, index)}
          onDsClick={() => this.handleToolChange(item.id)}
        />
      </ds-tooltip>
    );
  }

  render() {
    const headerLabel = this.headerLabel();
    const orderedRailItems = this.orderedRailItems;
    const headerItem = orderedRailItems.find(item => item.id === PANEL_TOOLS_PRIMARY_TOOL_ID);
    const footerItem = orderedRailItems.find(item => item.id === PANEL_TOOLS_FOOTER_TOOL_ID);
    const bodyItems = orderedRailItems.filter(
      item => item.id !== PANEL_TOOLS_PRIMARY_TOOL_ID && item.id !== PANEL_TOOLS_FOOTER_TOOL_ID,
    );
    const footerIndex = footerItem
      ? (headerItem ? 1 : 0) + bodyItems.length
      : -1;
    const showDrawerChrome = this.isDrawerPresent();
    const drawerResting = panelToolsDrawerResting(this.open, this.motion);

    return (
      <Host
        class={{
          'panel-tools': true,
          'panel-tools--open': this.open,
          'panel-tools--ready': this.readyForMotion,
          'panel-tools--motion-opening': this.motion === 'opening',
          'panel-tools--motion-closing': this.motion === 'closing',
          'panel-tools--drawer-resting': drawerResting,
        }}
        role="complementary"
        aria-label={this.toolsLabel}
      >
        <div class="panel-tools__layout">
          <nav class="panel-tools__rail" aria-label={this.toolShortcutsLabel}>
            {headerItem ? (
              <div class="panel-tools__rail-header">
                {this.renderRailAction(headerItem, 0)}
              </div>
            ) : null}
            <div class="panel-tools__rail-body">
              {bodyItems.map((item, bodyIdx) =>
                this.renderRailAction(item, headerItem ? bodyIdx + 1 : bodyIdx),
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
              <header class="panel-tools__header">
                <ds-text
                  class="panel-tools__title"
                  as="span"
                  variant="text-body-medium"
                  emphasis
                  color="primary"
                  wrap="nowrap"
                >
                  {headerLabel}
                </ds-text>
              </header>
              <div class="panel-tools__body">
                <div
                  class={{
                    'panel-tools__view': true,
                    'panel-tools__view--active': this.isViewActive('search'),
                  }}
                  hidden={!this.isViewActive('search')}
                >
                  <slot name="search" />
                </div>
                <div
                  class={{
                    'panel-tools__view': true,
                    'panel-tools__view--active': this.isViewActive('messages'),
                  }}
                  hidden={!this.isViewActive('messages')}
                >
                  <slot name="messages" />
                </div>
                <div
                  class={{
                    'panel-tools__view': true,
                    'panel-tools__view--active': this.isViewActive('stacks'),
                  }}
                  hidden={!this.isViewActive('stacks')}
                >
                  <slot name="stacks" />
                </div>
                <div
                  class={{
                    'panel-tools__view': true,
                    'panel-tools__view--active': this.isViewActive('activity'),
                  }}
                  hidden={!this.isViewActive('activity')}
                >
                  <slot name="activity" />
                </div>
                <div
                  class={{
                    'panel-tools__view': true,
                    'panel-tools__view--active': this.isViewActive('agents'),
                  }}
                  hidden={!this.isViewActive('agents')}
                >
                  <slot name="agents" />
                </div>
                <div
                  class={{
                    'panel-tools__view': true,
                    'panel-tools__view--active': this.isViewActive('help'),
                  }}
                  hidden={!this.isViewActive('help')}
                >
                  <slot name="help" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
