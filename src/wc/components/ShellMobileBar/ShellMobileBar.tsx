import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Method,
  Prop,
} from '@stencil/core';
import {
  shouldEmitMobileDestinationChange,
  type ShellMobileDestination,
} from '../../shell/shell-responsive';
import type { PanelNavItem } from '../PanelNav/panel-nav-types';
import type { ShellMobileBarDestinationDetail } from './shell-mobile-bar-types';

interface DestinationConfig {
  id: ShellMobileDestination;
  icon: string;
  label: string;
  dot: boolean;
}

@Component({
  tag: 'ds-shell-mobile-bar',
  styleUrl: 'ShellMobileBar.css',
  scoped: true,
})
export class ShellMobileBar {
  @Element() el!: HTMLElement;

  @Prop() activeDestination: ShellMobileDestination = 'area';
  @Prop() currentArea: PanelNavItem = {
    id: 'tracking',
    icon: 'MapPage',
    label: 'Tracking',
  };
  @Prop() navigationExpanded: boolean = false;
  @Prop() menuLabel: string = 'Menu';
  @Prop() searchLabel: string = 'Search';
  @Prop() agentsLabel: string = 'Agents';
  @Prop() inboxLabel: string = 'Inbox';
  @Prop() searchDot: boolean = false;
  @Prop() agentsDot: boolean = false;
  @Prop() inboxDot: boolean = false;

  @Event() dsNavigationToggle!: EventEmitter<boolean>;
  @Event() dsDestinationChange!: EventEmitter<ShellMobileBarDestinationDetail>;

  private destinationConfig(): DestinationConfig[] {
    return [
      {
        id: 'area',
        icon: this.currentArea.icon || 'MapPage',
        label: this.currentArea.label || 'Area',
        dot: false,
      },
      { id: 'search', icon: 'MagnifyingGlass', label: this.searchLabel, dot: this.searchDot },
      { id: 'inbox', icon: 'Inbox', label: this.inboxLabel, dot: this.inboxDot },
      { id: 'agents', icon: 'AI', label: this.agentsLabel, dot: this.agentsDot },
    ];
  }

  private selectDestination(destination: ShellMobileDestination) {
    if (
      !shouldEmitMobileDestinationChange(
        this.activeDestination,
        destination,
        this.navigationExpanded
      )
    ) {
      return;
    }
    this.dsDestinationChange.emit({ destination });
  }

  @Method()
  async focusDestination(destination: ShellMobileDestination | 'navigation') {
    const target = this.el.querySelector<HTMLElement>(
      `#${
        destination === 'navigation'
          ? 'ds-shell-mobile-navigation-trigger'
          : `ds-shell-mobile-${destination}-trigger`
      }`
    );
    target?.focus({ preventScroll: true });
  }

  private renderDestination(item: DestinationConfig) {
    const selected = !this.navigationExpanded && item.id === this.activeDestination;
    return (
      <button
        id={`ds-shell-mobile-${item.id}-trigger`}
        type="button"
        class={{
          'shell-mobile-bar__item': true,
          'shell-mobile-bar__item--selected': selected,
          'ds-focus-ring-inset': true,
          'ds-interaction-fill': true,
        }}
        aria-label={item.label}
        aria-current={selected ? 'page' : undefined}
        onClick={() => this.selectDestination(item.id)}
      >
        <span class="shell-mobile-bar__icon ds-interaction-fill__content">
          <ds-icon name={item.icon} size="lg" color="inherit" />
          {item.dot && (
            <ds-badge class="shell-mobile-bar__dot" variant="dot" label="" aria-hidden="true" />
          )}
        </span>
      </button>
    );
  }

  render() {
    const [currentArea, ...tools] = this.destinationConfig();

    return (
      <Host>
        <nav class="shell-mobile-bar" aria-label="Primary">
          <div class="shell-mobile-bar__group shell-mobile-bar__group--context">
            <button
              id="ds-shell-mobile-navigation-trigger"
              type="button"
              class={{
                'shell-mobile-bar__item': true,
                'shell-mobile-bar__item--selected': this.navigationExpanded,
                'ds-focus-ring-inset': true,
                'ds-interaction-fill': true,
              }}
              aria-label={this.menuLabel}
              aria-expanded={String(this.navigationExpanded)}
              aria-controls="ds-shell-mobile-navigation"
              onClick={() => this.dsNavigationToggle.emit(!this.navigationExpanded)}
            >
              <span class="shell-mobile-bar__icon ds-interaction-fill__content">
                <ds-icon
                  name={this.navigationExpanded ? 'Cross' : 'Hamburger'}
                  size="lg"
                  color="inherit"
                />
              </span>
            </button>
            <span class="shell-mobile-bar__divider" aria-hidden="true" />
            {this.renderDestination(currentArea)}
          </div>
          <div class="shell-mobile-bar__group shell-mobile-bar__group--tools">
            {tools.map(item => this.renderDestination(item))}
          </div>
        </nav>
      </Host>
    );
  }
}
