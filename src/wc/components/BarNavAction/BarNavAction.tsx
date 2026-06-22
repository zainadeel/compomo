import { Component, Prop, Event, EventEmitter, h, Host } from '@stencil/core';

export type BarNavActionBackground = 'faint' | 'medium' | 'bold' | 'strong' | 'always-dark' | 'navigation';

@Component({
  tag: 'ds-bar-nav-action',
  styleUrl: 'BarNavAction.css',
  scoped: true,
})
export class BarNavAction {
  /** Icon name passed to <ds-icon>. */
  @Prop() icon: string = '';

  /** Controlled toggle/selected state. */
  @Prop() selected: boolean = false;

  /** Show a notification dot (brand colour) at the top-right of the icon. */
  @Prop() dot: boolean = false;

  /** Disables interaction. */
  @Prop() inactive: boolean = false;

  @Prop({ attribute: 'aria-label' }) ariaLabel: string = 'action';

  /** Parent surface context — adjusts hover/press colours for coloured backgrounds. */
  @Prop() background: BarNavActionBackground | undefined;

  /** Emits the new selected value (!selected) on click. */
  @Event() dsChange!: EventEmitter<boolean>;

  private handleClick = () => {
    if (this.inactive) return;
    this.dsChange.emit(!this.selected);
  };

  render() {
    const bg = this.background;

    const cls: Record<string, boolean> = {
      'action-btn': true,
      selected: this.selected,
      inactive: this.inactive,
      onMedium: bg === 'medium',
      onBold: bg === 'bold',
      onStrong: bg === 'strong',
      onAlwaysDark: bg === 'always-dark',
      onNavigation: bg === 'navigation',
    };

    return (
      <Host>
        <button
          type="button"
          class={cls}
          disabled={this.inactive}
          aria-pressed={this.selected}
          aria-label={this.ariaLabel}
          onClick={this.handleClick}
        >
          <span class="action-btn__icon-wrap">
            <ds-icon name={this.icon} size="md" color="inherit" />
            {this.dot && (
              <ds-badge
                class="action-btn__dot"
                variant="dot"
                background="var(--_dot-ring)"
                label=""
                aria-hidden="true"
              />
            )}
          </span>
        </button>
      </Host>
    );
  }
}
