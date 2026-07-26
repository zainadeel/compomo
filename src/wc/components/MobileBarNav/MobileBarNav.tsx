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
  type MobileDestination,
} from '../../shell/shell-responsive';
import type { PanelNavItem } from '../PanelNav/panel-nav-types';
import type { MobileBarNavDestinationDetail } from './mobile-bar-nav-types';

interface DestinationConfig {
  id: MobileDestination;
  icon: string;
  label: string;
  dot: boolean;
}

@Component({
  tag: 'ds-mobile-bar-nav',
  styleUrl: 'MobileBarNav.css',
  scoped: true,
})
export class MobileBarNav {
  @Element() el!: HTMLElement;

  @Prop() activeDestination: MobileDestination = 'area';
  @Prop() currentArea: PanelNavItem = {
    id: 'tracking',
    icon: 'MapPage',
    label: 'Tracking',
  };
  @Prop() sheetNavExpanded: boolean = false;
  @Prop() menuLabel: string = 'Menu';
  @Prop() searchLabel: string = 'Search';
  @Prop() agentsLabel: string = 'Agents';
  @Prop() inboxLabel: string = 'Inbox';
  @Prop() helpLabel: string = 'Help & Support';
  @Prop() searchDot: boolean = false;
  @Prop() agentsDot: boolean = false;
  @Prop() inboxDot: boolean = false;

  @Event() dsSheetNavToggle!: EventEmitter<boolean>;
  @Event() dsDestinationChange!: EventEmitter<MobileBarNavDestinationDetail>;

  private destinationConfig(): DestinationConfig[] {
    const currentArea =
      this.activeDestination === 'help'
        ? {
            id: 'help' as const,
            icon: 'CircleQuestion',
            label: this.helpLabel,
            dot: false,
          }
        : {
            id: 'area' as const,
            icon: this.currentArea.icon || 'MapPage',
            label: this.currentArea.label || 'Area',
            dot: false,
          };

    return [
      currentArea,
      { id: 'search', icon: 'MagnifyingGlass', label: this.searchLabel, dot: this.searchDot },
      { id: 'inbox', icon: 'Inbox', label: this.inboxLabel, dot: this.inboxDot },
      { id: 'agents', icon: 'AI', label: this.agentsLabel, dot: this.agentsDot },
    ];
  }

  private selectDestination(destination: MobileDestination) {
    if (
      !shouldEmitMobileDestinationChange(
        this.activeDestination,
        destination,
        this.sheetNavExpanded
      )
    ) {
      return;
    }
    this.dsDestinationChange.emit({ destination });
  }

  @Method()
  async focusDestination(destination: MobileDestination | 'sheet-nav') {
    const target = this.el.querySelector<HTMLElement>(
      `#${
        destination === 'sheet-nav'
          ? 'ds-mobile-sheet-nav-trigger'
          : `ds-mobile-bar-${destination}-trigger`
      }`
    );
    target?.focus({ preventScroll: true });
  }

  private renderDestination(item: DestinationConfig) {
    const selected = !this.sheetNavExpanded && item.id === this.activeDestination;
    return (
      <button
        id={`ds-mobile-bar-${item.id}-trigger`}
        type="button"
        class={{
          'mobile-bar-nav__item': true,
          'mobile-bar-nav__item--selected': selected,
          'ds-focus-ring-inset': true,
          'ds-interaction-fill': true,
        }}
        aria-label={item.label}
        aria-current={selected ? 'page' : undefined}
        onClick={() => this.selectDestination(item.id)}
      >
        <span class="mobile-bar-nav__icon ds-interaction-fill__content">
          <ds-icon name={item.icon} size="lg" color="inherit" />
          {item.dot && (
            <ds-badge class="mobile-bar-nav__dot" variant="dot" label="" aria-hidden="true" />
          )}
        </span>
      </button>
    );
  }

  render() {
    const [currentArea, ...tools] = this.destinationConfig();

    return (
      <Host>
        <nav class="mobile-bar-nav" aria-label="Primary">
          <div class="mobile-bar-nav__group mobile-bar-nav__group--context">
            <button
              id="ds-mobile-sheet-nav-trigger"
              type="button"
              class={{
                'mobile-bar-nav__item': true,
                'mobile-bar-nav__item--selected': this.sheetNavExpanded,
                'ds-focus-ring-inset': true,
                'ds-interaction-fill': true,
              }}
              aria-label={this.menuLabel}
              aria-expanded={String(this.sheetNavExpanded)}
              aria-controls="ds-mobile-sheet-nav"
              onClick={() => this.dsSheetNavToggle.emit(!this.sheetNavExpanded)}
            >
              <span class="mobile-bar-nav__icon ds-interaction-fill__content">
                <ds-icon
                  name={this.sheetNavExpanded ? 'Cross' : 'Hamburger'}
                  size="lg"
                  color="inherit"
                />
              </span>
            </button>
            <span class="mobile-bar-nav__divider" aria-hidden="true" />
            {this.renderDestination(currentArea)}
          </div>
          <div class="mobile-bar-nav__group mobile-bar-nav__group--tools">
            {tools.map(item => this.renderDestination(item))}
          </div>
        </nav>
      </Host>
    );
  }
}
