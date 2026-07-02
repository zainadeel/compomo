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

  /** Mirrors panel-nav: selection follows `open` immediately, not the in-flight clip animation. */
  private isToolActive(id: PanelToolsToolId): boolean {
    return this.open && this.activeTool === id;
  }

  private headerLabel(): string {
    if (!this.open || !this.activeTool) return '';
    return PANEL_TOOLS_LABELS[this.activeTool as PanelToolsToolId] ?? '';
  }

  private handleToolChange = (id: PanelToolsToolId) => {
    const selected = !this.isToolActive(id);
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
        selected={this.isToolActive(item.id)}
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
    const showDrawerChrome = this.open || this.motion === 'closing';

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
            aria-hidden={this.open ? null : 'true'}
          >
            <div class="panel-tools__drawer-surface">
              <header class="panel-tools__header">
                <span class="panel-tools__title text-body-medium-emphasis">{headerLabel}</span>
              </header>
              <div class="panel-tools__body">
                <div
                  class={{
                    'panel-tools__view': true,
                    'panel-tools__view--active': this.isToolActive('search'),
                    'text-body-medium': true,
                  }}
                  hidden={!this.isToolActive('search')}
                >
                  <slot name="search" />
                </div>
                <div
                  class={{
                    'panel-tools__view': true,
                    'panel-tools__view--active': this.isToolActive('messages'),
                    'text-body-medium': true,
                  }}
                  hidden={!this.isToolActive('messages')}
                >
                  <slot name="messages" />
                </div>
                <div
                  class={{
                    'panel-tools__view': true,
                    'panel-tools__view--active': this.isToolActive('stacks'),
                    'text-body-medium': true,
                  }}
                  hidden={!this.isToolActive('stacks')}
                >
                  <slot name="stacks" />
                </div>
                <div
                  class={{
                    'panel-tools__view': true,
                    'panel-tools__view--active': this.isToolActive('activity'),
                    'text-body-medium': true,
                  }}
                  hidden={!this.isToolActive('activity')}
                >
                  <slot name="activity" />
                </div>
                <div
                  class={{
                    'panel-tools__view': true,
                    'panel-tools__view--active': this.isToolActive('agents'),
                    'text-body-medium': true,
                  }}
                  hidden={!this.isToolActive('agents')}
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
