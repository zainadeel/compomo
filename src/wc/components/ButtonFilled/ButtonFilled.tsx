import { Component, Element, Event, EventEmitter, h, Host, Method, Prop } from '@stencil/core';

export type ButtonFilledIntent =
  | 'neutral'
  | 'brand'
  | 'ai'
  | 'negative'
  | 'warning'
  | 'caution'
  | 'positive'
  | 'guide'
  | 'walkthrough';

export type ButtonFilledContrast = 'bold' | 'strong' | 'medium' | 'faint';

@Component({
  tag: 'ds-button-filled',
  styleUrl: 'ButtonFilled.css',
  scoped: true,
})
export class ButtonFilled {
  @Element() el!: HTMLElement;

  /** Icon name passed to <ds-icon>. */
  @Prop() icon: string = '';

  /** Semantic colour intent. */
  @Prop() intent: ButtonFilledIntent = 'brand';

  /**
   * Background fill weight. Foreground uses the paired contrast token:
   * bold → faint, strong → medium, medium → strong, faint → bold.
   */
  @Prop() contrast: ButtonFilledContrast = 'bold';

  /** Disables interaction. */
  @Prop() inactive: boolean = false;

  /** Native button type. */
  @Prop() type: 'button' | 'submit' | 'reset' = 'button';

  @Prop({ attribute: 'aria-label' }) ariaLabel: string = 'action';

  @Event() dsClick!: EventEmitter<MouseEvent>;

  private buttonEl: HTMLButtonElement | null = null;

  @Method()
  async setFocus() {
    this.buttonEl?.focus();
  }

  private handleClick = (event: MouseEvent) => {
    if (this.inactive) return;
    this.dsClick.emit(event);
  };

  render() {
    const cls: Record<string, boolean> = {
      'button-filled': true,
      'ds-focus-ring-inset': true,
      'button-filled--inactive': this.inactive,
      [`button-filled--intent-${this.intent}`]: true,
      [`button-filled--contrast-${this.contrast}`]: this.contrast !== 'bold',
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
          onClick={this.handleClick}
        >
          <span class="button-filled__icon-wrap">
            <ds-icon name={this.icon} size="md" color="inherit" />
          </span>
        </button>
      </Host>
    );
  }
}
