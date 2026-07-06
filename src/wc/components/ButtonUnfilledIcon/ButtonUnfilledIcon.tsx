import { Component, Element, Event, EventEmitter, h, Host, Method, Prop } from '@stencil/core';

export type ButtonUnfilledIconBackground =
  | 'faint'
  | 'medium'
  | 'bold'
  | 'strong'
  | 'always-dark'
  | 'navigation';

@Component({
  tag: 'ds-button-unfilled-icon',
  styleUrl: 'ButtonUnfilledIcon.css',
  scoped: true,
})
export class ButtonUnfilledIcon {
  @Element() el!: HTMLElement;

  /** Icon name passed to <ds-icon>. */
  @Prop() icon: string = '';

  /** Active/selected visual state. */
  @Prop() isActive: boolean = false;

  /** When active, render the active interaction fill. Shell chrome can disable this while keeping active icon colour. */
  @Prop() activeFill: boolean = true;

  /** Show a 1px tertiary border without changing the interaction model. */
  @Prop() hasBorder: boolean = false;

  /** Show a notification dot at the top-right of the icon zone. */
  @Prop() dot: boolean = false;

  /** Disables interaction. */
  @Prop() inactive: boolean = false;

  /** Native button type. */
  @Prop() type: 'button' | 'submit' | 'reset' = 'button';

  /** Parent surface context — adjusts hover/press/focus colours for coloured backgrounds. */
  @Prop() background: ButtonUnfilledIconBackground | undefined;

  @Prop({ attribute: 'aria-label' }) ariaLabel: string = 'action';
  @Prop() controls: string | undefined;
  @Prop() expanded: boolean | undefined;
  @Prop() haspopup: string | undefined;
  @Prop() pressed: boolean | undefined;

  @Event() dsClick!: EventEmitter<MouseEvent>;
  @Event() dsChange!: EventEmitter<boolean>;

  private buttonEl: HTMLButtonElement | null = null;

  @Method()
  async setFocus() {
    this.buttonEl?.focus();
  }

  private handleClick = (event: MouseEvent) => {
    if (this.inactive) return;
    this.dsClick.emit(event);
    this.dsChange.emit(!this.isActive);
  };

  render() {
    const bg = this.background;

    const cls: Record<string, boolean> = {
      'button-icon': true,
      'ds-focus-ring-inset': true,
      'button-icon--active': this.isActive,
      'button-icon--active-fill': this.isActive && this.activeFill,
      'button-icon--bordered': this.hasBorder,
      'button-icon--inactive': this.inactive,
      'button-icon--on-medium': bg === 'medium',
      'button-icon--on-bold': bg === 'bold',
      'button-icon--on-strong': bg === 'strong',
      'button-icon--on-always-dark': bg === 'always-dark',
      'button-icon--on-navigation': bg === 'navigation',
    };

    return (
      <Host tabIndex={-1}>
        <button
          ref={el => {
            this.buttonEl = el ?? null;
          }}
          type={this.type}
          class={cls}
          disabled={this.inactive}
          aria-label={this.ariaLabel}
          aria-controls={this.controls}
          aria-expanded={this.expanded === undefined ? undefined : String(this.expanded)}
          aria-haspopup={this.haspopup}
          aria-pressed={this.pressed === undefined ? undefined : String(this.pressed)}
          onClick={this.handleClick}
        >
          <span class="button-icon__icon-wrap">
            <ds-icon name={this.icon} size="md" color="inherit" />
            {this.dot && (
              <ds-badge
                class="button-icon__dot"
                variant="dot"
                background="var(--ds-button-unfilled-icon-dot-ring)"
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
