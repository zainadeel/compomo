import { Component, Element, Event, EventEmitter, h, Host, Method, Prop } from '@stencil/core';
import { controlWidthClass, CONTROL_TEXT_VARIANT, type ControlWidth } from '../../utils';

export type ButtonUnfilledBackground =
  | 'faint'
  | 'medium'
  | 'bold'
  | 'strong'
  | 'translucent'
  | 'inverted'
  | 'media'
  | 'always-dark';

export type ButtonUnfilledVariant = 'icon' | 'label' | 'icon-label';

export type ButtonUnfilledSize = 'md' | 'sm' | 'xs';

export type ButtonUnfilledWidth = ControlWidth;
export type ButtonUnfilledPopup = 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';

/**
 * `ds-icon` size prop matching control-density icon metrics
 * (md→20 / sm→16 / xs→12 via `--dimension-iconography-*`).
 */
const ICON_SIZE: Record<ButtonUnfilledSize, 'md' | 'sm' | 'xs'> = {
  md: 'md',
  sm: 'sm',
  xs: 'xs',
};

@Component({
  tag: 'ds-button-unfilled',
  styleUrl: 'ButtonUnfilled.css',
  scoped: true,
})
export class ButtonUnfilled {
  @Element() el!: HTMLElement;

  /**
   * Content layout. Default is label-only; pass `icon` for icon-only chrome
   * (nav / tool rails) or `icon-label` for leading icon + text.
   */
  @Prop() variant: ButtonUnfilledVariant = 'label';

  /** Control density (height, padding, icon, type). */
  @Prop() size: ButtonUnfilledSize = 'md';

  /** Width fit — hug content (default) or fill the parent. */
  @Prop() width: ButtonUnfilledWidth = 'hug';

  /** Visible text for `label` / `icon-label` variants. */
  @Prop() label: string = '';

  /** Icon name passed to <ds-icon> for `icon` / `icon-label` variants. */
  @Prop() icon: string = '';

  /** Active/selected visual state. Always promotes foreground to primary. */
  @Prop() isActive: boolean = false;

  /**
   * When active, render the selected interaction fill.
   * Default `true` for general UI. Shell chrome (nav / tool rails) should pass
   * `false` so selection is foreground-only (primary color, no fill).
   */
  @Prop() activeFill: boolean = true;

  /** Show a 1px secondary inset border. Default on; shell chrome can pass `false`. */
  @Prop() hasBorder: boolean = true;

  /** Use the half-radius treatment instead of the default control radius. */
  @Prop() rounded: boolean = false;

  /** Show a notification dot at the top-right of the icon zone (icon variant only). */
  @Prop() dot: boolean = false;

  /** Disables interaction. */
  @Prop() isInactive: boolean = false;

  /** Shows an inline loader and prevents interaction without applying inactive opacity. */
  @Prop() isLoading: boolean = false;

  /** Native button type. */
  @Prop() type: 'button' | 'submit' | 'reset' = 'button';

  /** Actual parent surface context. Omit on primary and secondary surfaces. */
  @Prop() background: ButtonUnfilledBackground | undefined;

  /** Accessible name override. Required for icon-only buttons. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;
  @Prop() controls: string | undefined;
  @Prop() expanded: boolean | undefined;
  @Prop() haspopup: ButtonUnfilledPopup | undefined;
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
    if (this.isInactive || this.isLoading) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.dsClick.emit(event);
    this.dsChange.emit(!this.isActive);
  };

  private get showIcon(): boolean {
    return this.variant === 'icon' || this.variant === 'icon-label';
  }

  private get showLabel(): boolean {
    return this.variant === 'label' || this.variant === 'icon-label';
  }

  private get showDot(): boolean {
    return this.variant === 'icon' && this.dot && !this.isLoading;
  }

  /** Knock-out ring: selected fill → active wash; otherwise surface token. */
  private get dotRing(): string {
    if (this.isActive && this.activeFill) {
      return 'var(--ds-interaction-active)';
    }
    return 'var(--ds-button-unfilled-dot-ring)';
  }

  private get accessibleName(): string | undefined {
    if (this.ariaLabel) return this.ariaLabel;
    if (this.isLoading && this.variant === 'label' && this.label) return this.label;
    return undefined;
  }

  render() {
    const bg = this.background;
    const textVariant = CONTROL_TEXT_VARIANT[this.size];
    const iconSize = ICON_SIZE[this.size];

    const cls: Record<string, boolean> = {
      'button-unfilled': true,
      'ds-focus-ring-inset': true,
      'ds-interaction-fill': true,
      'ds-interaction-fill--selected': this.isActive && this.activeFill && !this.isInactive,
      'ds-interaction-fill--on-faint': bg === 'faint',
      'ds-interaction-fill--on-medium': bg === 'medium',
      'ds-interaction-fill--on-bold': bg === 'bold',
      'ds-interaction-fill--on-strong': bg === 'strong',
      'ds-interaction-fill--on-translucent': bg === 'translucent',
      'ds-interaction-fill--on-inverted': bg === 'inverted',
      'ds-interaction-fill--on-media': bg === 'media',
      'ds-interaction-fill--on-always-dark': bg === 'always-dark',
      'button-unfilled--active': this.isActive,
      'button-unfilled--bordered': this.hasBorder,
      'button-unfilled--rounded': this.rounded,
      'ds-control-inactive': this.isInactive,
      'ds-control--md': this.size === 'md',
      'ds-control--sm': this.size === 'sm',
      'ds-control--xs': this.size === 'xs',
      'button-unfilled--icon': this.variant === 'icon',
      'button-unfilled--label': this.variant === 'label',
      'button-unfilled--icon-label': this.variant === 'icon-label',
      'button-unfilled--background-faint': bg === 'faint',
      'button-unfilled--background-medium': bg === 'medium',
      'button-unfilled--background-bold': bg === 'bold',
      'button-unfilled--background-strong': bg === 'strong',
      'button-unfilled--background-translucent': bg === 'translucent',
      'button-unfilled--background-inverted': bg === 'inverted',
      'button-unfilled--background-media': bg === 'media',
      'button-unfilled--on-always-dark': bg === 'always-dark',
    };

    return (
      <Host
        class={{
          'button-unfilled-host': true,
          'button-unfilled-host--icon': this.variant === 'icon',
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
          tabIndex={this.focusTabIndex ?? 0}
          aria-label={this.accessibleName}
          aria-busy={this.isLoading ? 'true' : undefined}
          aria-disabled={this.isLoading ? 'true' : undefined}
          aria-controls={this.controls}
          aria-expanded={this.expanded === undefined ? undefined : String(this.expanded)}
          aria-haspopup={this.haspopup}
          aria-pressed={this.pressed === undefined ? undefined : String(this.pressed)}
          onClick={this.handleClick}
        >
          {this.showIcon && (
            <span class="button-unfilled__icon-wrap ds-interaction-fill__content">
              {this.isLoading
                ? <ds-loader size={iconSize} color="inherit" />
                : <ds-icon name={this.icon} size={iconSize} color="inherit" />
              }
              {this.showDot && (
                <ds-badge
                  class="button-unfilled__dot"
                  variant="dot"
                  background={this.dotRing}
                  label=""
                  aria-hidden="true"
                />
              )}
            </span>
          )}
          {this.showLabel && (
            <ds-text
              class={{
                'button-unfilled__label': true,
                'button-unfilled__label--loading': this.isLoading && this.variant === 'label',
                'ds-interaction-fill__content': true,
              }}
              as="span"
              variant={textVariant}
              emphasis
              color="inherit"
            >
              {this.label}
            </ds-text>
          )}
          {this.isLoading && this.variant === 'label' && (
            <span class="button-unfilled__loader-overlay ds-interaction-fill__content">
              <ds-loader size={iconSize} color="inherit" />
            </span>
          )}
        </button>
      </Host>
    );
  }
}
