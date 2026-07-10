import { Component, Element, Event, EventEmitter, h, Host, Method, Prop } from '@stencil/core';
import { controlWidthClass, CONTROL_TEXT_VARIANT, type ControlWidth } from '../../utils';

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

export type ButtonFilledVariant = 'icon' | 'label' | 'icon-label';

export type ButtonFilledSize = 'md' | 'sm' | 'xs';

export type ButtonFilledWidth = ControlWidth;

/**
 * `ds-icon` size prop matching control-density icon metrics
 * (md→20 / sm→16 / xs→12 via `--dimension-iconography-*`).
 */
const ICON_SIZE: Record<ButtonFilledSize, 'md' | 'sm' | 'xs'> = {
  md: 'md',
  sm: 'sm',
  xs: 'xs',
};

@Component({
  tag: 'ds-button-filled',
  styleUrl: 'ButtonFilled.css',
  scoped: true,
})
export class ButtonFilled {
  @Element() el!: HTMLElement;

  /**
   * Content layout. Default is label-only; pass `icon` for icon-only chrome
   * (nav / tool rails) or `icon-label` for leading icon + text.
   */
  @Prop() variant: ButtonFilledVariant = 'label';

  /** Control density (height, padding, icon, type). */
  @Prop() size: ButtonFilledSize = 'md';

  /** Width fit — hug content (default) or fill the parent. */
  @Prop() width: ButtonFilledWidth = 'hug';

  /** Visible text for `label` / `icon-label` variants. */
  @Prop() label: string = '';

  /** Icon name passed to <ds-icon> for `icon` / `icon-label` variants. */
  @Prop() icon: string = '';

  /** Semantic colour intent. */
  @Prop() intent: ButtonFilledIntent = 'brand';

  /**
   * Background fill weight. Foreground uses the paired contrast token:
   * bold → faint, strong → medium, medium → strong, faint → bold.
   */
  @Prop() contrast: ButtonFilledContrast = 'bold';

  /** Disables interaction. */
  @Prop() isInactive: boolean = false;

  /** Native button type. */
  @Prop() type: 'button' | 'submit' | 'reset' = 'button';

  @Prop({ attribute: 'aria-label' }) ariaLabel: string | undefined;

  @Event() dsClick!: EventEmitter<MouseEvent>;

  private buttonEl: HTMLButtonElement | null = null;

  @Method()
  async setFocus() {
    this.buttonEl?.focus();
  }

  private handleClick = (event: MouseEvent) => {
    if (this.isInactive) return;
    this.dsClick.emit(event);
  };

  private get showIcon(): boolean {
    return this.variant === 'icon' || this.variant === 'icon-label';
  }

  private get showLabel(): boolean {
    return this.variant === 'label' || this.variant === 'icon-label';
  }

  private get accessibleName(): string | undefined {
    if (this.ariaLabel) return this.ariaLabel;
    if (this.showLabel && this.label) return undefined;
    if (this.variant === 'icon') return this.icon || 'action';
    return this.label || 'action';
  }

  render() {
    const textVariant = CONTROL_TEXT_VARIANT[this.size];
    const iconSize = ICON_SIZE[this.size];

    const cls: Record<string, boolean> = {
      'button-filled': true,
      'ds-focus-ring-inset': true,
      'ds-interaction-fill': !this.isInactive,
      /* Bold is the default filled contrast — on-bold interaction tokens. */
      'ds-interaction-fill--on-bold': this.contrast === 'bold',
      'ds-interaction-fill--on-strong': this.contrast === 'strong',
      'ds-interaction-fill--on-medium': this.contrast === 'medium',
      /* faint → default app interaction tokens (no --on-*). */
      'ds-control-inactive': this.isInactive,
      'ds-control--md': this.size === 'md',
      'ds-control--sm': this.size === 'sm',
      'ds-control--xs': this.size === 'xs',
      'button-filled--icon': this.variant === 'icon',
      'button-filled--label': this.variant === 'label',
      'button-filled--icon-label': this.variant === 'icon-label',
      [`button-filled--intent-${this.intent}`]: true,
      [`button-filled--contrast-${this.contrast}`]: this.contrast !== 'bold',
    };

    return (
      <Host
        class={{
          'button-filled-host': true,
          'button-filled-host--icon': this.variant === 'icon',
          'ds-control--md': this.size === 'md',
          'ds-control--sm': this.size === 'sm',
          'ds-control--xs': this.size === 'xs',
          ...controlWidthClass(this.width),
        }}
        tabIndex={-1}
      >
        <button
          ref={el => {
            this.buttonEl = el ?? null;
          }}
          type={this.type}
          class={cls}
          disabled={this.isInactive}
          aria-label={this.accessibleName}
          onClick={this.handleClick}
        >
          {this.showIcon && (
            <span class="button-filled__icon-wrap ds-interaction-fill__content">
              <ds-icon name={this.icon} size={iconSize} color="inherit" />
            </span>
          )}
          {this.showLabel && (
            <ds-text
              class="button-filled__label ds-interaction-fill__content"
              as="span"
              variant={textVariant}
              emphasis
              color="inherit"
            >
              {this.label}
            </ds-text>
          )}
        </button>
      </Host>
    );
  }
}
