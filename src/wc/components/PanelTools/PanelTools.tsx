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
  PANEL_TOOLS_LABELS,
  PANEL_TOOLS_SHORTCUTS,
  type PanelToolsHeaderAction,
  type PanelToolsHeaderActionDetail,
  type PanelToolsHeaderConfig,
  type PanelToolsHeaders,
  type PanelToolsItem,
  type PanelToolsRailAccessory,
  type PanelToolsRailAccessoryAction,
  type PanelToolsRailAccessoryActionDetail,
  type PanelToolsRailShortcutAccessory,
  type PanelToolsRailTransientAccessory,
  type PanelToolsToolId,
} from './panel-tools-types';
import {
  isPanelToolsToolId,
  orderPanelToolsRailEntries,
  orderPanelToolsItems,
  panelToolsRailAccessoryActionDetail,
  panelToolsRailFocusKeys,
  panelToolsDrawerAtTerminal,
  panelToolsDrawerResting,
  panelToolsDrawerTransitionMs,
  panelToolsRailPlacement,
  reconcilePanelToolsAvailability,
  reconcilePanelToolsRovingIndex,
  resolvePanelToolActivation,
  type PanelToolsRailEntry,
} from './panel-tools-utils';

@Component({
  tag: 'ds-panel-tools',
  styleUrl: 'PanelTools.css',
  shadow: true,
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

  /**
   * Desktop/tablet-only application-owned rail boundaries and direct intents.
   * Set via JS property and replace the array reference to update.
   */
  @Prop() accessories: PanelToolsRailAccessory[] = [];

  @Prop() toolsLabel: string = 'Tools';
  @Prop() toolShortcutsLabel: string = 'Tool shortcuts';

  /** Active header state per tool. Replace the object when title, depth, or actions change. */
  @Prop() headers: PanelToolsHeaders = {};

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
  @Event({ bubbles: true, composed: true })
  dsHeaderAction!: EventEmitter<PanelToolsHeaderActionDetail>;

  /** Direct accessory intent. Emitting this event never changes the active tool or drawer. */
  @Event({ bubbles: true, composed: true })
  dsRailAccessoryAction!: EventEmitter<PanelToolsRailAccessoryActionDetail>;

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
  @State() private railBodyScrollable = false;

  private motionEnableGeneration = 0;
  private presentationMotionGeneration = 0;
  private transitionGeneration = 0;
  private transitionFallbackTimer: number | null = null;
  /** Ignores the old transition's terminal event when reversing direction. */
  private ignoreReplacementTerminal = false;
  private focusBeforeFullscreen: HTMLElement | null = null;
  private fullViewObserver: MutationObserver | null = null;
  private railBodyEl?: HTMLElement;
  private railBodyObserver?: ResizeObserver;

  private get railItems(): PanelToolsItem[] {
    return this.items ?? [];
  }

  private get orderedRailItems(): PanelToolsItem[] {
    return orderPanelToolsItems(this.railItems);
  }

  private get railAccessories(): PanelToolsRailAccessory[] {
    return this.accessories ?? [];
  }

  private get orderedRailEntries(): PanelToolsRailEntry[] {
    return orderPanelToolsRailEntries(this.railItems, this.railAccessories);
  }

  disconnectedCallback() {
    this.el.removeEventListener('transitionend', this.handleTransitionEnd);
    this.el.removeEventListener('transitioncancel', this.handleTransitionEnd);
    this.el.removeEventListener('dsAction', this.handleComposedHeaderAction);
    this.clearTransitionCompletion();
    this.motionEnableGeneration += 1;
    this.fullViewObserver?.disconnect();
    this.fullViewObserver = null;
    this.disconnectRailBodyObserver();
  }

  @Watch('presentation')
  presentationChanged(next: 'drawer' | 'fullscreen', previous?: 'drawer' | 'fullscreen') {
    if (next === previous) return;
    // Framework property bindings can update slotted master/detail content in
    // the same render that requests fullscreen. Reflect the host selector
    // immediately so that content cannot paint once in the drawer geometry
    // while Stencil waits to commit its next render.
    if (this.el.getAttribute('presentation') !== next) {
      this.el.setAttribute('presentation', next);
    }
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
    const detail = (event as CustomEvent<{ id?: string; anchor?: HTMLElement }>).detail;
    if (!this.activeTool || !detail?.id) return;
    event.stopPropagation();
    this.dsHeaderAction.emit({
      tool: this.activeTool,
      id: detail.id,
      anchor: detail.anchor,
    });
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
    this.connectRailBodyObserver();
    this.updateRailBodyScrollable();
    this.syncFullViewTools();
    this.fullViewObserver = new MutationObserver(() => this.syncFullViewTools());
    this.fullViewObserver.observe(this.el, {
      childList: true,
      attributes: true,
      attributeFilter: ['slot'],
    });
  }

  componentDidRender() {
    this.updateRailBodyScrollable();
  }

  private connectRailBodyObserver() {
    this.disconnectRailBodyObserver();
    if (!this.railBodyEl || typeof ResizeObserver === 'undefined') return;
    this.railBodyObserver = new ResizeObserver(() => this.updateRailBodyScrollable());
    this.railBodyObserver.observe(this.railBodyEl);
  }

  private disconnectRailBodyObserver() {
    this.railBodyObserver?.disconnect();
    this.railBodyObserver = undefined;
  }

  private updateRailBodyScrollable() {
    const next = Boolean(
      this.railBodyEl && this.railBodyEl.scrollHeight > this.railBodyEl.clientHeight + 1
    );
    if (next !== this.railBodyScrollable) this.railBodyScrollable = next;
  }

  @Watch('items')
  itemsChanged() {
    this.rovingIndex = 0;
    this.reconcileActiveTool();
    this.deferMotionEnable();
  }

  @Watch('accessories')
  accessoriesChanged(
    next: PanelToolsRailAccessory[] = [],
    previous: PanelToolsRailAccessory[] = []
  ) {
    const previousKeys = panelToolsRailFocusKeys(
      orderPanelToolsRailEntries(this.railItems, previous)
    );
    const nextKeys = panelToolsRailFocusKeys(orderPanelToolsRailEntries(this.railItems, next));
    const activeElement = (this.renderRoot as ShadowRoot).activeElement as HTMLElement | null;
    const focusedKey =
      activeElement?.closest<HTMLElement>('[data-rail-focus-key]')?.dataset.railFocusKey;
    const focusedIndex = focusedKey ? previousKeys.indexOf(focusedKey) : -1;
    const currentIndex = focusedIndex >= 0 ? focusedIndex : this.rovingIndex;
    const nextIndex = reconcilePanelToolsRovingIndex(previousKeys, nextKeys, currentIndex);
    const restoreFocus = focusedIndex >= 0 && !nextKeys.includes(focusedKey ?? '');
    this.rovingIndex = nextIndex;
    if (restoreFocus && nextKeys.length) {
      requestAnimationFrame(() => this.focusRailAt(nextIndex));
    }
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
    const drawer = this.renderRoot.querySelector('.panel-tools__drawer') as HTMLElement | null;
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
    const drawer = this.renderRoot.querySelector('.panel-tools__drawer') as HTMLElement | null;
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
    const ids = this.orderedRailItems.map(item => item.id);
    const next = ids.filter(id => Boolean(this.el.querySelector(`[slot="${id}-view"]`)));
    if (next.join('|') !== this.fullViewToolIds.join('|')) this.fullViewToolIds = next;
  }

  private get renderRoot(): ParentNode {
    return this.el.shadowRoot ?? this.el;
  }

  private headerLabel(): string {
    if (!this.isDrawerPresent() || !this.activeTool) return '';
    const item = this.railItems.find(candidate => candidate.id === this.activeTool);
    return (
      item?.label ??
      PANEL_TOOLS_LABELS[this.activeTool as keyof typeof PANEL_TOOLS_LABELS] ??
      this.activeTool
    );
  }

  private resolvedHeaders(): PanelToolsHeaders {
    return this.headers ?? {};
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
    const action = this.renderRoot.querySelector(`[data-header-action-id="${CSS.escape(id)}"]`) as
      | (HTMLElement & { setFocus?: () => Promise<void> })
      | null;
    await action?.setFocus?.();
  }

  private focusRailAt(index: number) {
    const keys = panelToolsRailFocusKeys(this.orderedRailEntries);
    if (!keys.length) return;
    const bounded = Math.max(0, Math.min(index, keys.length - 1));
    this.rovingIndex = bounded;
    const action = this.renderRoot.querySelector(
      `[data-rail-focus-key="${CSS.escape(keys[bounded])}"]`
    ) as (HTMLElement & { setFocus?: () => Promise<void> }) | null;
    if (action?.setFocus) {
      void action.setFocus();
    } else {
      action?.focus({ preventScroll: true });
    }
  }

  private handleRailKeyDown = (e: KeyboardEvent, index: number, activate?: () => void) => {
    const keys = panelToolsRailFocusKeys(this.orderedRailEntries);
    if (!keys.length) return;

    if ((e.key === 'Enter' || e.key === ' ') && activate) {
      e.preventDefault();
      activate();
      return;
    }

    if (e.key === 'ArrowDown') {
      if (index >= keys.length - 1) return;
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
    const focusKey = `tool:${item.id}`;
    const label =
      item.ariaLabel ??
      item.label ??
      PANEL_TOOLS_LABELS[item.id as keyof typeof PANEL_TOOLS_LABELS] ??
      item.id;
    return (
      <ds-tooltip
        key={item.id}
        label={label}
        shortcutKey={
          item.shortcutKey ?? PANEL_TOOLS_SHORTCUTS[item.id as keyof typeof PANEL_TOOLS_SHORTCUTS]
        }
        side="left"
        size="sm"
        boundary="viewport"
      >
        <ds-button-unfilled
          variant="icon"
          class="panel-tools__rail-action"
          icon={item.icon}
          isActive={this.isRailSelected(item.id)}
          activeFill={false}
          hasBorder={false}
          pressScale={false}
          dot={item.dot ?? false}
          isInactive={item.isInactive}
          focusTabIndex={index === this.rovingIndex ? 0 : -1}
          data-rail-focus-key={focusKey}
          aria-label={label}
          pressed={this.isRailSelected(item.id)}
          onFocusin={() => {
            this.rovingIndex = index;
          }}
          onKeyDown={(e: KeyboardEvent) =>
            this.handleRailKeyDown(e, index, () => this.handleToolChange(item.id))
          }
          onDsClick={() => this.handleToolChange(item.id)}
        />
      </ds-tooltip>
    );
  }

  private accessoryPrimaryLabel(accessory: PanelToolsRailTransientAccessory): string {
    const actionLabel = accessory.primaryAction.ariaLabel?.trim() || accessory.ariaLabel;
    const status = accessory.statusText.trim();
    return status ? `${actionLabel}. ${status}` : actionLabel;
  }

  private emitAccessoryAction(
    accessoryId: string,
    action: PanelToolsRailAccessoryAction,
    anchor: HTMLElement
  ) {
    if (action.isInactive) return;
    this.dsRailAccessoryAction.emit(
      panelToolsRailAccessoryActionDetail(accessoryId, action.id, anchor)
    );
  }

  private renderAccessoryVisual(accessory: PanelToolsRailTransientAccessory) {
    if (accessory.visual.type === 'image') {
      return (
        <img
          class="panel-tools__accessory-image"
          src={accessory.visual.src}
          alt=""
          aria-hidden="true"
        />
      );
    }
    if (accessory.visual.type === 'initial') {
      const initial = [...accessory.visual.initial.trim()].slice(0, 2).join('');
      return (
        <ds-text
          class="panel-tools__accessory-initial"
          as="span"
          variant="text-caption"
          emphasis
          color="inherit"
          aria-hidden="true"
        >
          {initial}
        </ds-text>
      );
    }
    return <ds-icon name={accessory.visual.icon} size="sm" aria-hidden="true" />;
  }

  private renderRailShortcut(
    accessory: PanelToolsRailShortcutAccessory,
    focusIndexes: Map<string, number>
  ) {
    const focusKey = `accessory:${accessory.id}:${accessory.action.id}`;
    const focusIndex = focusIndexes.get(focusKey);
    const label = accessory.action.ariaLabel?.trim() || accessory.ariaLabel;
    const initials = [...accessory.initials.trim()].slice(0, 2).join('');

    return (
      <div
        key={`accessory:${accessory.id}`}
        class="panel-tools__accessory panel-tools__accessory--shortcut"
      >
        <ds-tooltip label={label} side="left" size="sm" boundary="viewport">
          <button
            type="button"
            class="panel-tools__shortcut ds-focus-ring-inset ds-interaction-fill"
            disabled={accessory.action.isInactive}
            tabIndex={focusIndex === this.rovingIndex ? 0 : -1}
            data-rail-focus-key={focusKey}
            aria-label={label}
            onFocus={() => {
              if (focusIndex !== undefined) this.rovingIndex = focusIndex;
            }}
            onKeyDown={(event: KeyboardEvent) =>
              focusIndex === undefined ? undefined : this.handleRailKeyDown(event, focusIndex)
            }
            onClick={(event: MouseEvent) =>
              this.emitAccessoryAction(
                accessory.id,
                accessory.action,
                event.currentTarget as HTMLElement
              )
            }
          >
            <span class="panel-tools__shortcut-content ds-interaction-fill__content">
              <ds-text
                class="panel-tools__shortcut-orb"
                as="span"
                variant="text-caption"
                emphasis
                color="inherit"
              >
                {initials}
              </ds-text>
              {accessory.dot ? (
                <ds-badge
                  class="panel-tools__shortcut-dot"
                  variant="dot"
                  background="var(--color-background-secondary)"
                  aria-hidden="true"
                />
              ) : null}
            </span>
          </button>
        </ds-tooltip>
      </div>
    );
  }

  private renderRailAccessory(
    accessory: PanelToolsRailAccessory,
    focusIndexes: Map<string, number>
  ) {
    if (accessory.type === 'divider') {
      return (
        <div
          key={`accessory:${accessory.id}`}
          class="panel-tools__accessory-divider"
          aria-hidden="true"
        >
          <ds-divider />
        </div>
      );
    }

    if (accessory.type === 'shortcut') {
      return this.renderRailShortcut(accessory, focusIndexes);
    }

    const primaryKey = `accessory:${accessory.id}:${accessory.primaryAction.id}`;
    const primaryIndex = focusIndexes.get(primaryKey);
    const primaryLabel = this.accessoryPrimaryLabel(accessory);
    const secondary = accessory.secondaryAction;
    const secondaryKey = secondary ? `accessory:${accessory.id}:${secondary.id}` : '';
    const secondaryIndex = secondary ? focusIndexes.get(secondaryKey) : undefined;

    return (
      <div
        key={`accessory:${accessory.id}`}
        class={{
          'panel-tools__accessory': true,
          'panel-tools__accessory--transient': true,
          'panel-tools__accessory--transient-active': accessory.statusTone === 'active',
          'panel-tools__accessory--transient-positive': accessory.statusTone === 'positive',
        }}
      >
        <ds-tooltip label={primaryLabel} side="left" size="sm" boundary="viewport">
          <button
            type="button"
            class="panel-tools__accessory-primary ds-focus-ring-inset ds-interaction-fill ds-interaction-fill--on-bold"
            disabled={accessory.primaryAction.isInactive}
            tabIndex={primaryIndex === this.rovingIndex ? 0 : -1}
            data-rail-focus-key={primaryKey}
            aria-label={primaryLabel}
            onFocus={() => {
              if (primaryIndex !== undefined) this.rovingIndex = primaryIndex;
            }}
            onKeyDown={(event: KeyboardEvent) =>
              primaryIndex === undefined ? undefined : this.handleRailKeyDown(event, primaryIndex)
            }
            onClick={(event: MouseEvent) =>
              this.emitAccessoryAction(
                accessory.id,
                accessory.primaryAction,
                event.currentTarget as HTMLElement
              )
            }
          >
            <span class="panel-tools__accessory-primary-content ds-interaction-fill__content">
              {this.renderAccessoryVisual(accessory)}
            </span>
          </button>
        </ds-tooltip>
        {secondary ? (
          <ds-tooltip label={secondary.ariaLabel} side="left" size="sm" boundary="viewport">
            <ds-button-unfilled
              class="panel-tools__accessory-secondary"
              variant="icon"
              size="sm"
              rounded
              background="bold"
              hasBorder={false}
              icon={secondary.icon}
              isInactive={secondary.isInactive}
              focusTabIndex={secondaryIndex === this.rovingIndex ? 0 : -1}
              data-rail-focus-key={secondaryKey}
              aria-label={secondary.ariaLabel}
              onFocusin={() => {
                if (secondaryIndex !== undefined) this.rovingIndex = secondaryIndex;
              }}
              onKeyDown={(event: KeyboardEvent) =>
                secondaryIndex === undefined
                  ? undefined
                  : this.handleRailKeyDown(event, secondaryIndex)
              }
              onDsClick={(event: CustomEvent<MouseEvent>) =>
                this.emitAccessoryAction(
                  accessory.id,
                  secondary,
                  event.currentTarget as HTMLElement
                )
              }
            />
          </ds-tooltip>
        ) : null}
      </div>
    );
  }

  private renderRailEntry(entry: PanelToolsRailEntry, focusIndexes: Map<string, number>) {
    if (entry.type === 'tool') {
      return this.renderRailAction(entry.item, focusIndexes.get(`tool:${entry.id}`) ?? 0);
    }
    return this.renderRailAccessory(entry.accessory, focusIndexes);
  }

  render() {
    const headerLabel = this.headerLabel();
    const header = this.activeHeader();
    const headerTitle = header.title?.trim() || headerLabel;
    const headerActions = header.actions ?? [];
    const orderedRailItems = this.orderedRailItems;
    const orderedRailEntries = this.orderedRailEntries;
    const entryPlacement = (entry: PanelToolsRailEntry) =>
      entry.type === 'tool' ? panelToolsRailPlacement(entry.item) : entry.accessory.railPlacement;
    const headerEntries = orderedRailEntries.filter(entry => entryPlacement(entry) === 'header');
    const bodyEntries = orderedRailEntries.filter(entry => entryPlacement(entry) === 'body');
    const footerEntries = orderedRailEntries.filter(entry => entryPlacement(entry) === 'footer');
    const focusIndexes = new Map(
      panelToolsRailFocusKeys(orderedRailEntries).map((key, index) => [key, index])
    );
    const showDrawerChrome = this.isDrawerPresent();
    const drawerResting = panelToolsDrawerResting(this.open, this.motion);
    const activeFullView = Boolean(
      showDrawerChrome && this.activeTool && this.hasFullView(this.activeTool)
    );
    const toolIds = orderedRailItems.map(item => item.id);

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
            {headerEntries.length ? (
              <div
                class={{
                  'panel-tools__rail-header': true,
                  'panel-tools__rail-section--stacked': headerEntries.length > 1,
                  'ds-chrome-row': headerEntries.length === 1,
                  'ds-chrome-column': headerEntries.length > 1,
                  'ds-chrome-space--md': true,
                }}
              >
                {headerEntries.map(entry => this.renderRailEntry(entry, focusIndexes))}
              </div>
            ) : null}
            <div
              class={{
                'panel-tools__rail-body': true,
                'ds-chrome-column': true,
                'ds-chrome-space--md': true,
                'ds-scrollbar-hidden': true,
                'ds-focus-ring': this.railBodyScrollable,
              }}
              ref={element => {
                const next = (element as HTMLElement) ?? undefined;
                if (next === this.railBodyEl) return;
                this.railBodyEl = next;
                this.connectRailBodyObserver();
              }}
              role={this.railBodyScrollable ? 'region' : undefined}
              aria-label={this.railBodyScrollable ? this.toolShortcutsLabel : undefined}
              tabIndex={this.railBodyScrollable ? 0 : undefined}
            >
              <div class="panel-tools__rail-actions">
                {bodyEntries.map(entry => this.renderRailEntry(entry, focusIndexes))}
              </div>
            </div>
            {footerEntries.length ? (
              <div
                class={{
                  'panel-tools__rail-footer': true,
                  'panel-tools__rail-section--stacked': footerEntries.length > 1,
                  'ds-chrome-row': footerEntries.length === 1,
                  'ds-chrome-column': footerEntries.length > 1,
                  'ds-chrome-space--md': true,
                }}
              >
                {footerEntries.map(entry => this.renderRailEntry(entry, focusIndexes))}
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
