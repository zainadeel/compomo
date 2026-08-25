import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Method,
  Prop,
  State,
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

const MINIMUM_DIRECT_PRESS_MS = 120;

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
  /** Render Activity directly, or retain the optional grouped Inbox destination. */
  @Prop() activityMode: 'direct' | 'inbox' = 'direct';
  @Prop() activityLabel: string = 'Activity';
  @Prop() inboxLabel: string = 'Inbox';
  @Prop() messagesLabel: string = 'Messages';
  @Prop() agentsLabel: string = 'Agents';
  @Prop() helpLabel: string = 'Help & Support';
  @Prop() searchDot: boolean = false;
  @Prop() activityDot: boolean = false;
  @Prop() inboxDot: boolean = false;
  @Prop() messagesDot: boolean = false;
  @Prop() agentsDot: boolean = false;

  @State() private pressedItemId: string | null = null;

  @Event() dsSheetNavToggle!: EventEmitter<boolean>;
  @Event() dsDestinationChange!: EventEmitter<MobileBarNavDestinationDetail>;

  private activePointerId: number | null = null;
  private pressedAt = 0;
  private pressClearTimer: ReturnType<typeof setTimeout> | null = null;

  disconnectedCallback() {
    this.clearPressedItem();
  }

  private clearPressTimer() {
    if (this.pressClearTimer === null) return;
    clearTimeout(this.pressClearTimer);
    this.pressClearTimer = null;
  }

  private clearPressedItem() {
    this.clearPressTimer();
    this.activePointerId = null;
    this.pressedItemId = null;
  }

  private beginDirectPress(itemId: string, event: PointerEvent) {
    if (!event.isPrimary || event.pointerType === 'mouse' || event.button !== 0) return;

    this.clearPressTimer();
    this.activePointerId = event.pointerId;
    this.pressedAt = performance.now();
    this.pressedItemId = itemId;

    const target = event.currentTarget as HTMLElement;
    try {
      target.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture can fail if Safari has already cancelled the stream.
    }
  }

  private finishDirectPress(event: PointerEvent) {
    if (event.pointerId !== this.activePointerId) return;

    this.activePointerId = null;
    const remaining = Math.max(
      0,
      MINIMUM_DIRECT_PRESS_MS - (performance.now() - this.pressedAt)
    );

    this.clearPressTimer();
    this.pressClearTimer = setTimeout(() => {
      this.pressClearTimer = null;
      this.pressedItemId = null;
    }, remaining);
  }

  private cancelDirectPress(event: PointerEvent) {
    if (event.pointerId !== this.activePointerId) return;
    this.clearPressedItem();
  }

  private pressHandlers(itemId: string) {
    return {
      onPointerDown: (event: PointerEvent) => this.beginDirectPress(itemId, event),
      onPointerUp: (event: PointerEvent) => this.finishDirectPress(event),
      onPointerCancel: (event: PointerEvent) => this.cancelDirectPress(event),
      onLostPointerCapture: (event: PointerEvent) => this.finishDirectPress(event),
    };
  }

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

    const activity =
      this.activityMode === 'direct'
        ? {
            id: 'activity' as const,
            icon: 'Bell',
            label: this.activityLabel,
            dot: this.activityDot,
          }
        : {
            id: 'inbox' as const,
            icon: 'Inbox',
            label: this.inboxLabel,
            dot: this.inboxDot,
          };

    return [
      currentArea,
      { id: 'search', icon: 'MagnifyingGlass', label: this.searchLabel, dot: this.searchDot },
      activity,
      {
        id: 'messages',
        icon: 'MessageBubbleStack',
        label: this.messagesLabel,
        dot: this.messagesDot,
      },
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
    // Owners may replace the visible mobile stage (and transiently drop focus
    // in WebKit) while handling the controlled destination change.
    requestAnimationFrame(() => {
      void this.focusDestination(destination);
    });
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
          'mobile-bar-nav__item--pressed': this.pressedItemId === item.id,
          'ds-focus-ring-inset': true,
          'ds-interaction-fill': true,
        }}
        aria-label={item.label}
        aria-current={selected ? 'page' : undefined}
        onClick={() => this.selectDestination(item.id)}
        {...this.pressHandlers(item.id)}
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
        <nav class="mobile-bar-nav ds-chrome-row ds-chrome-space--md" aria-label="Primary">
          <div class="mobile-bar-nav__group mobile-bar-nav__group--context">
            <button
              id="ds-mobile-sheet-nav-trigger"
              type="button"
              class={{
                'mobile-bar-nav__item': true,
                'mobile-bar-nav__item--selected': this.sheetNavExpanded,
                'mobile-bar-nav__item--pressed':
                  this.pressedItemId === 'sheet-nav',
                'ds-focus-ring-inset': true,
                'ds-interaction-fill': true,
              }}
              aria-label={this.menuLabel}
              aria-expanded={String(this.sheetNavExpanded)}
              aria-controls="ds-mobile-sheet-nav"
              onClick={() => this.dsSheetNavToggle.emit(!this.sheetNavExpanded)}
              {...this.pressHandlers('sheet-nav')}
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
