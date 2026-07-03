import { Component, Prop, Event, EventEmitter, Element, State, Watch, h, Host } from '@stencil/core';
import {
  PANEL_TOOLS_LABELS,
  PANEL_TOOLS_PRIMARY_TOOL_ID,
  type PanelToolsItem,
  type PanelToolsToolId,
} from './panel-tools-types';
import { parsePanelToolsItems } from './panel-tools-utils';

@Component({
  tag: 'ds-panel-tools',
  styleUrl: 'PanelTools.css',
  scoped: true,
})
export class PanelTools {
  @Element() el!: HTMLElement;

  /** When false, only the icon rail is shown. */
  @Prop({ mutable: true, reflect: true }) open: boolean = false;

  /** Active tool view — `search`, `agents`, `messages`, `stacks`, or `activity`. */
  @Prop({ mutable: true, attribute: 'active-tool', reflect: true })
  activeTool: PanelToolsToolId | '' = '';

  /**
   * Rail items rendered in the right column.
   * Set via JS property: `el.items = [...]`. Replace the array reference to update.
   */
  @Prop() items: PanelToolsItem[] = [];

  /** JSON fallback for `items` — useful when framework bindings don't propagate arrays. */
  @Prop({ attribute: 'items-json' }) itemsJson: string = '';

  /** Emitted when a rail button is toggled. Detail = { id, selected }. */
  @Event({ bubbles: true, composed: true }) dsToolChange!: EventEmitter<{
    id: PanelToolsToolId;
    selected: boolean;
  }>;

  /** Arms open vs close easing for the in-flight width transition. */
  @State() private motion: 'opening' | 'closing' | 'idle' = 'idle';

  /** Suppresses width transition until the host has painted its initial open state. */
  @State() private readyForMotion = false;

  private motionEnableGeneration = 0;

  private get railItems(): PanelToolsItem[] {
    return parsePanelToolsItems(this.items, this.itemsJson);
  }

  disconnectedCallback() {
    this.el.removeEventListener('transitionend', this.handleTransitionEnd);
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
  }

  @Watch('open')
  openChanged(isOpen: boolean, wasOpen?: boolean) {
    if (this.readyForMotion && wasOpen !== undefined && wasOpen !== isOpen) {
      this.motion = isOpen ? 'opening' : 'closing';
    }
    this.deferMotionEnable();
  }

  @Watch('activeTool')
  activeToolChanged() {
    this.deferMotionEnable();
  }

  componentDidLoad() {
    this.deferMotionEnable();
  }

  @Watch('items')
  @Watch('itemsJson')
  itemsChanged() {
    this.deferMotionEnable();
  }

  private handleTransitionEnd = (event: TransitionEvent) => {
    if (event.target !== this.el.querySelector('.panel-tools__drawer')) return;
    if (event.propertyName !== 'max-width') return;
    this.motion = 'idle';
  };

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
    const selected = !this.isRailSelected(id);
    if (selected) {
      this.open = true;
      this.activeTool = id;
    } else {
      this.open = false;
    }
    this.dsToolChange.emit({ id, selected });
  };

  private renderRailAction(item: PanelToolsItem) {
    return (
      <ds-bar-nav-action
        key={item.id}
        class="panel-tools__rail-action"
        icon={item.icon}
        selected={this.isRailSelected(item.id)}
        dot={item.dot ?? false}
        inactive={item.inactive}
        aria-label={item.ariaLabel ?? PANEL_TOOLS_LABELS[item.id]}
        onDsChange={() => this.handleToolChange(item.id)}
      />
    );
  }

  render() {
    const headerLabel = this.headerLabel();
    const railItems = this.railItems;
    const headerItem = railItems.find(item => item.id === PANEL_TOOLS_PRIMARY_TOOL_ID);
    const bodyItems = railItems.filter(item => item.id !== PANEL_TOOLS_PRIMARY_TOOL_ID);
    const showDrawerChrome = this.isDrawerPresent();

    return (
      <Host
        class={{
          'panel-tools': true,
          'panel-tools--open': this.open,
          'panel-tools--ready': this.readyForMotion,
          'panel-tools--motion-opening': this.motion === 'opening',
          'panel-tools--motion-closing': this.motion === 'closing',
        }}
        role="complementary"
        aria-label="Tools"
      >
        <div class="panel-tools__layout">
          <div
            class={{
              'panel-tools__drawer': true,
              'panel-tools__drawer--visible': showDrawerChrome,
            }}
            aria-hidden={showDrawerChrome ? null : 'true'}
          >
            <div class="panel-tools__drawer-surface">
              <header class="panel-tools__header">
                <span class="panel-tools__title text-body-medium-emphasis">{headerLabel}</span>
              </header>
              <div class="panel-tools__body">
                <div
                  class={{
                    'panel-tools__view': true,
                    'panel-tools__view--active': this.isViewActive('search'),
                    'text-body-medium': true,
                  }}
                  hidden={!this.isViewActive('search')}
                >
                  <slot name="search" />
                </div>
                <div
                  class={{
                    'panel-tools__view': true,
                    'panel-tools__view--active': this.isViewActive('messages'),
                    'text-body-medium': true,
                  }}
                  hidden={!this.isViewActive('messages')}
                >
                  <slot name="messages" />
                </div>
                <div
                  class={{
                    'panel-tools__view': true,
                    'panel-tools__view--active': this.isViewActive('stacks'),
                    'text-body-medium': true,
                  }}
                  hidden={!this.isViewActive('stacks')}
                >
                  <slot name="stacks" />
                </div>
                <div
                  class={{
                    'panel-tools__view': true,
                    'panel-tools__view--active': this.isViewActive('activity'),
                    'text-body-medium': true,
                  }}
                  hidden={!this.isViewActive('activity')}
                >
                  <slot name="activity" />
                </div>
                <div
                  class={{
                    'panel-tools__view': true,
                    'panel-tools__view--active': this.isViewActive('agents'),
                    'text-body-medium': true,
                  }}
                  hidden={!this.isViewActive('agents')}
                >
                  <slot name="agents" />
                </div>
              </div>
            </div>
          </div>

          <nav class="panel-tools__rail" aria-label="Tool shortcuts">
            {headerItem ? (
              <div class="panel-tools__rail-header">{this.renderRailAction(headerItem)}</div>
            ) : null}
            <div class="panel-tools__rail-body">
              {bodyItems.map(item => this.renderRailAction(item))}
            </div>
          </nav>
        </div>
      </Host>
    );
  }
}
