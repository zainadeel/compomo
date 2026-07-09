import { Component, Element, Event, EventEmitter, h, Host, Method, Prop } from '@stencil/core';

export type ButtonUnfilledIconOnBackgroundContrast = 'default' | 'medium' | 'bold' | 'strong';

export type ButtonUnfilledIconBackground = 'always-dark' | 'navigation';

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
  @Prop() isInactive: boolean = false;

  /** Native button type. */
  @Prop() type: 'button' | 'submit' | 'reset' = 'button';

  /**
   * Foreground and interaction tokens when the button sits on a contrasting parent
   * background (default, medium, bold, or strong).
   */
  @Prop({ attribute: 'on-background-contrast' })
  backgroundContrast?: ButtonUnfilledIconOnBackgroundContrast;

  /** Parent surface context for navigation and always-dark chrome. */
  @Prop() background: ButtonUnfilledIconBackground | undefined;

  @Prop({ attribute: 'aria-label' }) ariaLabel: string = 'action';
  @Prop() controls: string | undefined;
  @Prop() expanded: boolean | undefined;
  @Prop() haspopup: string | undefined;
  @Prop() pressed: boolean | undefined;

  /**
   * Native `tabindex` for roving keyboard groups in shell chrome.
   * Omit for the default button tab stop (`0`).
   */
  @Prop({ attribute: 'tab-index' }) focusTabIndex?: number;

  @Event() dsClick!: EventEmitter<MouseEvent>;
  @Event() dsChange!: EventEmitter<boolean>;

  private buttonEl: HTMLButtonElement | null = null;

  @Method()
  async setFocus() {
    this.buttonEl?.focus();
  }

  private handleClick = (event: MouseEvent) => {
    if (this.isInactive) return;
    this.dsClick.emit(event);
    this.dsChange.emit(!this.isActive);
  };

  private effectiveContrast(): ButtonUnfilledIconOnBackgroundContrast {
    return this.backgroundContrast ?? 'default';
  }

  render() {
    const bg = this.background;
    const contrast = this.effectiveContrast();

    const cls: Record<string, boolean> = {
      'button-icon': true,
      'ds-focus-ring-inset': true,
      'ds-interaction-fill': !this.isInactive,
      'ds-interaction-fill--selected': this.isActive && this.activeFill && !this.isInactive,
      'ds-interaction-fill--on-medium': contrast === 'medium',
      'ds-interaction-fill--on-bold': contrast === 'bold',
      'ds-interaction-fill--on-strong': contrast === 'strong',
      'ds-interaction-fill--on-always-dark': bg === 'always-dark',
      'ds-interaction-fill--on-navigation': bg === 'navigation',
      'button-icon--active': this.isActive,
      'button-icon--bordered': this.hasBorder,
      'ds-control-inactive': this.isInactive,
      'button-icon--contrast-medium': contrast === 'medium',
      'button-icon--contrast-bold': contrast === 'bold',
      'button-icon--contrast-strong': contrast === 'strong',
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
          disabled={this.isInactive}
          tabIndex={this.focusTabIndex ?? 0}
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
