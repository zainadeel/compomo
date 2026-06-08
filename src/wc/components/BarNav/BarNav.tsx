import { Component, Prop, Event, EventEmitter, Watch, State, h, Host } from '@stencil/core';
import type { BarNavActionBackground } from '../BarNavAction/BarNavAction';
import type { TabItem } from '../TabGroup/tab-item-utils';
import {
  deriveBarNavValueFromUrl,
  parseJsonArrayProp,
  shouldResyncBarNavProps,
} from './bar-nav-utils';

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

  private static readonly HOST_PROP_SYNC_BUDGET = 8;

  private get effectiveValue(): string {
    if (this.currentUrl && this.basePath) {
      return this.urlDerivedValue;
    }
    return this.value;
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
  }

  @Watch('currentUrl')
  @Watch('basePath')
  onUrlChange() {
    this.syncValueFromUrl();
  }

  componentWillLoad() {
    this.onPropsChange();
  }

  componentDidLoad() {
    this.syncHostPropsIfNeeded();
    this.scheduleDeferredHostPropSync();
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

  private handleTabChange(e: Event) {
    const id = (e as CustomEvent<string>).detail;
    this.value = id;
    this.dsTabChange.emit(id);
  }

  private handleActionChange(actionId: string, e: Event) {
    const selected = (e as CustomEvent<boolean>).detail;
    this.dsActionChange.emit({ id: actionId, selected });
  }

  render() {
    const hasTabs = this.resolvedTabs.length > 0 && !this.hideTabsForDetailRoute;

    // Map BarNavBackground → BarNavActionBackground for context pass-through.
    // primary/secondary/transparent/translucent are all light — no override needed.
    const bgToActionBg: Partial<Record<BarNavBackground, BarNavActionBackground>> = {};
    const actionBg: BarNavActionBackground | undefined = bgToActionBg[this.background];

    return (
      <Host>
        <header class={{ 'bar-nav': true, [`bg-${this.background}`]: true }}>

          <div class="bar-nav__left">
            {hasTabs
              ? (
                <ds-tab-group
                  tabs={this.resolvedTabs as TabItem[]}
                  value={this.effectiveValue}
                  onDsChange={(e: Event) => this.handleTabChange(e)}
                />
              )
              : this.heading && (
                <span class="bar-nav__heading text-body-medium-emphasis">{this.heading}</span>
              )
            }
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
      </Host>
    );
  }
}
