import { Component, Prop, Event, EventEmitter, h, Host } from '@stencil/core';
import type { BarNavActionBackground } from '../BarNavAction/BarNavAction';
import type { TabItem } from '../TabGroup/TabGroup';

export type BarNavBackground = 'primary' | 'secondary' | 'transparent' | 'translucent';

export interface BarNavTab {
  id: string;
  label: string;
  disabled?: boolean;
  /** Notification dot on this tab. */
  dot?: boolean;
}

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
   * Set via JS property: `el.tabs = [...]`
   */
  @Prop() tabs: BarNavTab[] = [];

  /** ID of the currently active tab. */
  @Prop({ mutable: true }) value: string = '';

  /**
   * Action items rendered in the right section.
   * Set via JS property: `el.actions = [...]`
   */
  @Prop() actions: BarNavActionItem[] = [];

  /**
   * Fallback heading shown when no tabs are provided.
   * When tabs are present the heading is hidden.
   */
  @Prop() heading: string | undefined;

  /** Surface background variant. */
  @Prop() background: BarNavBackground = 'secondary';

  /** Emitted when the active tab changes. Detail = tab id. */
  @Event() dsTabChange!: EventEmitter<string>;

  /** Emitted when an action button is toggled. Detail = { id, selected }. */
  @Event() dsActionChange!: EventEmitter<{ id: string; selected: boolean }>;

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
    const hasTabs = this.tabs.length > 0;

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
                  tabs={this.tabs as TabItem[]}
                  value={this.value}
                  onDsChange={(e: Event) => this.handleTabChange(e)}
                />
              )
              : this.heading && (
                <span class="bar-nav__heading text-title-small">{this.heading}</span>
              )
            }
          </div>

          {this.actions.length > 0 && (
            <div class="bar-nav__actions">
              {this.actions.map(action => (
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
