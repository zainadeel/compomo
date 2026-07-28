import { Component, Element, Event, EventEmitter, h, Host, Method, Prop } from '@stencil/core';
import { controlWidthClass, CONTROL_TEXT_VARIANT, type ControlWidth } from '../../utils';
import type { ChoiceBackground } from '../../utils/choice-list';
import { beginElevatedControlPress } from '../../utils/control-press';

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

export type ButtonFilledBackground = ChoiceBackground;

export type ButtonFilledVariant = 'icon' | 'label' | 'icon-label';

export type ButtonFilledSize = 'lg' | 'md' | 'sm' | 'xs';

export type ButtonFilledWidth = ControlWidth;

export type ButtonFilledPopup = 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';

/**
 * `ds-icon` size prop matching control-density icon metrics
 * (lg→24 / md→20 / sm→16 / xs→12 via `--dimension-iconography-*`).
 */
const ICON_SIZE: Record<ButtonFilledSize, 'lg' | 'md' | 'sm' | 'xs'> = {
  lg: 'lg',
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

  /** Show a 1px secondary inset border. */
  @Prop() hasBorder: boolean = false;

  /**
   * Actual parent surface context for the optional inset border color only.
   * Omit on primary and secondary surfaces.
   */
  @Prop() background: ButtonFilledBackground | undefined;

  /** Use the half-radius treatment instead of the default control radius. */
  @Prop() rounded: boolean = false;

  /**
   * Scale down during a physical pointer press.
   * Disable when an owning composite requires fixed child or background geometry.
   */
  @Prop() pressScale: boolean = true;

  /** Disables interaction. */
  @Prop() isInactive: boolean = false;

  /** Shows an inline loader and prevents interaction without applying inactive opacity. */
  @Prop() isLoading: boolean = false;

  /** Native button type. */
  @Prop() type: 'button' | 'submit' | 'reset' = 'button';

  /** Accessible name override. Required for icon-only buttons. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;

  /** ID of the popup this button controls. */
  @Prop() controls: string | undefined;

  /**
   * Controlled open state of the popup this button triggers. Holds the pressed
   * wash for the popup's rendered lifecycle. ButtonFilled has no selected state,
   * so an open popup never promotes to an active treatment.
   */
  @Prop() expanded: boolean | undefined;

  /** Popup type exposed to assistive technology. */
  @Prop() haspopup: ButtonFilledPopup | undefined;

  /** Pressed semantics for a toggle command that reports state elsewhere. */
  @Prop() pressed: boolean | undefined;

  /**
   * This action *has* a menu: implies `aria-haspopup="menu"` and adds the trailing
   * chevron that carries the affordance.
   *
   * Only `label` and `icon-label` are supported. A filled button is never the
   * overflow / more-options control — that role belongs to ButtonUnfilled with an
   * `Ellipses` glyph, which conveys the menu without a chevron.
   *
   * Use `haspopup` directly for non-menu popups.
   */
  @Prop() hasMenu: boolean = false;

  @Event() dsClick!: EventEmitter<MouseEvent>;

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
  };

  private get showIcon(): boolean {
    return this.variant === 'icon' || this.variant === 'icon-label';
  }

  private get showLabel(): boolean {
    return this.variant === 'label' || this.variant === 'icon-label';
  }

  /** Icon-only triggers rely on their own glyph, so the chevron is label-bound. */
  private get showChevron(): boolean {
    return this.hasMenu && this.variant !== 'icon';
  }

  private get resolvedHaspopup(): ButtonFilledPopup | undefined {
    return this.haspopup ?? (this.hasMenu ? 'menu' : undefined);
  }

  private get accessibleName(): string | undefined {
    if (this.ariaLabel) return this.ariaLabel;
    if (this.isLoading && this.variant === 'label' && this.label) return this.label;
    return undefined;
  }

  render() {
    const textVariant = CONTROL_TEXT_VARIANT[this.size];
    const iconSize = ICON_SIZE[this.size];

    const cls: Record<string, boolean> = {
      'button-filled': true,
      'ds-focus-ring-inset': true,
      'ds-control-press-scale': this.pressScale,
      'ds-interaction-fill': !this.isInactive,
      /* Bold is the default filled contrast — on-bold interaction tokens. */
      'ds-interaction-fill--on-bold': this.contrast === 'bold',
      'ds-interaction-fill--on-strong': this.contrast === 'strong',
      'ds-interaction-fill--on-medium': this.contrast === 'medium',
      /* faint → default app interaction tokens (no --on-*). */
      'button-filled--bordered': this.hasBorder,
      'button-filled--expanded': this.expanded === true && !this.isInactive,
      'ds-control-inactive': this.isInactive,
      'ds-control--lg': this.size === 'lg',
      'ds-control--md': this.size === 'md',
      'ds-control--sm': this.size === 'sm',
      'ds-control--xs': this.size === 'xs',
      'ds-control-frame': true,
      'button-filled--icon': this.variant === 'icon',
      'button-filled--label': this.variant === 'label',
      'button-filled--icon-label': this.variant === 'icon-label',
      'button-filled--rounded': this.rounded,
      [`button-filled--background-${this.background}`]: this.background !== undefined,
      [`button-filled--intent-${this.intent}`]: true,
      [`button-filled--contrast-${this.contrast}`]: this.contrast !== 'bold',
    };

    return (
      <Host
        class={{
          'button-filled-host': true,
          'button-filled-host--icon': this.variant === 'icon',
          'ds-control--lg': this.size === 'lg',
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
          aria-busy={this.isLoading ? 'true' : undefined}
          aria-disabled={this.isLoading ? 'true' : undefined}
          aria-controls={this.controls}
          aria-expanded={this.expanded === undefined ? undefined : String(this.expanded)}
          aria-haspopup={this.resolvedHaspopup}
          aria-pressed={this.pressed === undefined ? undefined : String(this.pressed)}
          onPointerDown={event =>
            beginElevatedControlPress(
              event,
              this.pressScale && !this.isInactive && !this.isLoading,
            )
          }
          onClick={this.handleClick}
        >
          {this.showIcon && (
            <span class="button-filled__icon-wrap ds-control-icon-box ds-interaction-fill__content">
              {this.isLoading
                ? <ds-loader size={iconSize} color="inherit" />
                : <ds-icon name={this.icon} size={iconSize} color="inherit" />
              }
            </span>
          )}
          {this.showLabel && (
            <ds-text
              class={{
                'button-filled__label': true,
                'ds-control-label-box': true,
                'button-filled__label--loading': this.isLoading && this.variant === 'label',
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
          {this.showChevron && (
            <span
              class={{
                'button-filled__chevron': true,
                'ds-control-icon-box': true,
                'ds-interaction-fill__content': true,
                'button-filled__chevron--loading': this.isLoading && this.variant === 'label',
              }}
              aria-hidden="true"
            >
              <ds-icon name="ChevronDown" size={iconSize} color="inherit" />
            </span>
          )}
          {this.isLoading && this.variant === 'label' && (
            <span class="button-filled__loader-overlay ds-interaction-fill__content">
              <ds-loader size={iconSize} color="inherit" />
            </span>
          )}
        </button>
      </Host>
    );
  }
}
