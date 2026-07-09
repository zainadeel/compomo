import { Component, Element, Event, EventEmitter, h, Host, Method, Prop } from '@stencil/core';
import { controlWidthClass, type ControlWidth } from '../../utils/control-width';

export type ButtonUnfilledOnBackgroundContrast = 'default' | 'medium' | 'bold' | 'strong';

export type ButtonUnfilledBackground = 'always-dark' | 'navigation';

export type ButtonUnfilledVariant = 'icon' | 'label' | 'icon-label';

export type ButtonUnfilledSize = 'md' | 'sm' | 'xs';

export type ButtonUnfilledWidth = ControlWidth;

/** Emphasis text per control-density size (buttons use emphasis, unlike Tag). */
const TEXT_VARIANT: Record<ButtonUnfilledSize, string> = {
  md: 'text-body-medium-emphasis',
  sm: 'text-body-small-emphasis',
  xs: 'text-caption-emphasis',
};

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

  /** Show a notification dot at the top-right of the icon zone (icon variant only). */
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
  backgroundContrast?: ButtonUnfilledOnBackgroundContrast;

  /** Parent surface context for navigation and always-dark chrome. */
  @Prop() background: ButtonUnfilledBackground | undefined;

  @Prop({ attribute: 'aria-label' }) ariaLabel: string | undefined;
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

  private effectiveContrast(): ButtonUnfilledOnBackgroundContrast {
    return this.backgroundContrast ?? 'default';
  }

  private get showIcon(): boolean {
    return this.variant === 'icon' || this.variant === 'icon-label';
  }

  private get showLabel(): boolean {
    return this.variant === 'label' || this.variant === 'icon-label';
  }

  private get showDot(): boolean {
    return this.variant === 'icon' && this.dot;
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
    if (this.showLabel && this.label) return undefined;
    if (this.variant === 'icon') return this.icon || 'action';
    return this.label || 'action';
  }

  render() {
    const bg = this.background;
    const contrast = this.effectiveContrast();
    const textVariant = TEXT_VARIANT[this.size];
    const iconSize = ICON_SIZE[this.size];

    const cls: Record<string, boolean> = {
      'button-unfilled': true,
      'ds-focus-ring-inset': true,
      'ds-interaction-fill': true,
      'ds-interaction-fill--selected': this.isActive && this.activeFill && !this.isInactive,
      'ds-interaction-fill--on-medium': contrast === 'medium',
      'ds-interaction-fill--on-bold': contrast === 'bold',
      'ds-interaction-fill--on-strong': contrast === 'strong',
      'ds-interaction-fill--on-always-dark': bg === 'always-dark',
      'ds-interaction-fill--on-navigation': bg === 'navigation',
      'button-unfilled--active': this.isActive,
      'button-unfilled--bordered': this.hasBorder,
      'ds-control-inactive': this.isInactive,
      'ds-control--md': this.size === 'md',
      'ds-control--sm': this.size === 'sm',
      'ds-control--xs': this.size === 'xs',
      'button-unfilled--icon': this.variant === 'icon',
      'button-unfilled--label': this.variant === 'label',
      'button-unfilled--icon-label': this.variant === 'icon-label',
      'button-unfilled--contrast-medium': contrast === 'medium',
      'button-unfilled--contrast-bold': contrast === 'bold',
      'button-unfilled--contrast-strong': contrast === 'strong',
      'button-unfilled--on-always-dark': bg === 'always-dark',
      'button-unfilled--on-navigation': bg === 'navigation',
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
          aria-controls={this.controls}
          aria-expanded={this.expanded === undefined ? undefined : String(this.expanded)}
          aria-haspopup={this.haspopup}
          aria-pressed={this.pressed === undefined ? undefined : String(this.pressed)}
          onClick={this.handleClick}
        >
          {this.showIcon && (
            <span class="button-unfilled__icon-wrap ds-interaction-fill__content">
              <ds-icon name={this.icon} size={iconSize} color="inherit" />
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
            <span class={{ 'button-unfilled__label': true, [textVariant]: true, 'ds-interaction-fill__content': true }}>
              {this.label}
            </span>
          )}
        </button>
      </Host>
    );
  }
}
