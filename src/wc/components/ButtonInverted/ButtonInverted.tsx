import { Component, Event, EventEmitter, h, Host, Method, Prop } from '@stencil/core';
import { controlWidthClass } from '../../utils';
import { beginElevatedControlPress } from '../../utils/control-press';
import { renderButtonContent } from '../../utils/button-render';
import type { ControlInsetDepth } from '../../utils/control-text';
import type { ButtonPopup, ButtonSize, ButtonVariant, ButtonWidth } from '../../utils/button-types';

export type ButtonInvertedVariant = ButtonVariant;
export type ButtonInvertedSize = ButtonSize;
export type ButtonInvertedWidth = ButtonWidth;
export type ButtonInvertedPopup = ButtonPopup;

@Component({
  tag: 'ds-button-inverted',
  styleUrl: 'ButtonInverted.css',
  scoped: true,
})
export class ButtonInverted {
  /**
   * Content layout. Default is label-only; pass `icon` for icon-only chrome
   * or `icon-label` for leading icon + text.
   */
  @Prop() variant: ButtonInvertedVariant = 'label';

  /** Control density (height, padding, icon, type). */
  @Prop() size: ButtonInvertedSize = 'md';

  /** Use reduced outer geometry when nested inside a control of the same size. */
  @Prop() isInset: boolean = false;

  /** Single removes 4px overall; double removes 8px overall (xs stays single). */
  @Prop() insetDepth: ControlInsetDepth = 'single';

  /** Width fit — hug content (default) or fill the parent. */
  @Prop() width: ButtonInvertedWidth = 'hug';

  /** Visible text for `label` / `icon-label` variants. */
  @Prop() label: string = '';

  /** Whether the visible label uses the emphasized weight. */
  @Prop() labelEmphasis: boolean = true;

  /** Icon name passed to <ds-icon> for `icon` / `icon-label` variants. */
  @Prop() icon: string = '';

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

  /** Controlled disclosure state forwarded to aria-expanded. */
  @Prop() expanded: boolean | undefined;

  /**
   * The associated menu, picker, or panel is visible, including its exit motion.
   * Holds only the pressed wash and does not set ARIA or selection state.
   */
  @Prop() surfaceOpen: boolean | undefined;

  /** Popup type exposed to assistive technology. */
  @Prop() haspopup: ButtonInvertedPopup | undefined;

  /**
   * Append a separate ChevronDown menu segment while preserving the inverted
   * recipe, variant, size, loading, inactive, and width treatment.
   */
  @Prop() split: boolean = false;

  /** Accessible name for the appended menu segment in split mode. */
  @Prop() menuAriaLabel: string = 'More options';

  /**
   * This action has a menu: implies `aria-haspopup="menu"` and adds the
   * trailing chevron that carries the affordance.
   *
   * Only `label` and `icon-label` are supported. Icon-only menu triggers belong
   * to ButtonUnfilled so the glyph can communicate the overflow affordance.
   */
  @Prop() hasMenu: boolean = false;

  @Event() dsClick!: EventEmitter<MouseEvent>;
  @Event() dsMenuClick!: EventEmitter<MouseEvent>;

  private buttonEl: HTMLButtonElement | null = null;
  private menuButtonEl: HTMLButtonElement | null = null;

  @Method()
  async setFocus(segment: 'primary' | 'menu' = 'primary') {
    (segment === 'menu' ? this.menuButtonEl : this.buttonEl)?.focus();
  }

  private handleClick = (event: MouseEvent) => {
    if (this.isInactive || this.isLoading) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.dsClick.emit(event);
  };

  private handleMenuClick = (event: MouseEvent) => {
    if (this.isInactive || this.isLoading) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.dsMenuClick.emit(event);
  };

  private get resolvedHaspopup(): ButtonInvertedPopup | undefined {
    return this.haspopup ?? (this.hasMenu ? 'menu' : undefined);
  }

  private get resolvedSurfaceOpen(): boolean {
    return (this.surfaceOpen ?? this.expanded === true) && !this.isInactive;
  }

  private get accessibleName(): string | undefined {
    if (this.ariaLabel) return this.ariaLabel;
    if (this.isLoading && this.variant === 'label' && this.label) return this.label;
    return undefined;
  }

  private get doubleInset(): boolean {
    return this.isInset && this.insetDepth === 'double' && this.size !== 'xs';
  }

  private buttonClass(variant: ButtonInvertedVariant, expanded: boolean): Record<string, boolean> {
    return {
      'button-inverted': true,
      'ds-button': true,
      'ds-focus-ring-inset': true,
      'ds-control-press-scale': this.pressScale && !this.split,
      'ds-interaction-fill': !this.isInactive,
      'ds-interaction-fill--on-inverted': true,
      'button-inverted--expanded': expanded,
      'ds-interaction-fill--surface-open': expanded,
      'ds-button--expanded': expanded,
      'ds-control-inactive': this.isInactive,
      'ds-control--lg': this.size === 'lg',
      'ds-control--md': this.size === 'md',
      'ds-control--sm': this.size === 'sm',
      'ds-control--xs': this.size === 'xs',
      'ds-control--inset': this.isInset && !this.doubleInset,
      'ds-control--inset-double': this.doubleInset,
      'ds-control-frame': true,
      'button-inverted--icon': variant === 'icon',
      'ds-button--icon': variant === 'icon',
      'button-inverted--label': variant === 'label',
      'button-inverted--icon-label': variant === 'icon-label',
      'button-inverted--rounded': this.rounded,
      'ds-button--rounded': this.rounded,
    };
  }

  render() {
    const primaryButton = (
      <button
        ref={el => {
          this.buttonEl = el ?? null;
        }}
        type={this.type}
        class={{
          ...this.buttonClass(this.variant, !this.split && this.resolvedSurfaceOpen),
          'ds-button-split__primary': this.split,
        }}
        disabled={this.isInactive}
        aria-label={this.accessibleName}
        aria-busy={this.isLoading ? 'true' : undefined}
        aria-disabled={this.isLoading ? 'true' : undefined}
        aria-controls={this.split ? undefined : this.controls}
        aria-expanded={
          this.split || this.expanded === undefined ? undefined : String(this.expanded)
        }
        aria-haspopup={this.split ? undefined : this.resolvedHaspopup}
        onPointerDown={event =>
          beginElevatedControlPress(
            event,
            this.pressScale && !this.split && !this.isInactive && !this.isLoading
          )
        }
        onClick={this.handleClick}
      >
        {renderButtonContent({
          namespace: 'button-inverted',
          variant: this.variant,
          size: this.size,
          label: this.label,
          labelEmphasis: this.labelEmphasis,
          icon: this.icon,
          hasMenu: !this.split && this.hasMenu,
          isLoading: this.isLoading,
        })}
      </button>
    );

    const control = this.split ? (
      <div
        class={{
          'ds-button-split': true,
          'ds-button-split--rounded': this.rounded,
        }}
      >
        {primaryButton}
        <span class="ds-button-split__divider" aria-hidden="true" />
        <button
          ref={el => {
            this.menuButtonEl = el ?? null;
          }}
          class={{
            ...this.buttonClass('icon', this.resolvedSurfaceOpen),
            'ds-button-split__menu': true,
          }}
          type="button"
          disabled={this.isInactive || this.isLoading}
          aria-label={this.menuAriaLabel}
          aria-controls={this.controls}
          aria-expanded={String(this.expanded === true)}
          aria-haspopup="menu"
          onClick={this.handleMenuClick}
        >
          {renderButtonContent({
            namespace: 'button-inverted',
            variant: 'icon',
            size: this.size,
            label: '',
            labelEmphasis: true,
            icon: 'ChevronDown',
            hasMenu: false,
            isLoading: false,
          })}
        </button>
      </div>
    ) : (
      primaryButton
    );

    return (
      <Host
        class={{
          'button-inverted-host': true,
          'button-inverted-host--icon': this.variant === 'icon' && !this.split,
          'ds-button-host--icon': this.variant === 'icon' && !this.split,
          'ds-button-split-host': this.split,
          'ds-button-split-host--primary-icon': this.split && this.variant === 'icon',
          'ds-control--lg': this.size === 'lg',
          'ds-control--md': this.size === 'md',
          'ds-control--sm': this.size === 'sm',
          'ds-control--xs': this.size === 'xs',
          'ds-control--inset': this.isInset && !this.doubleInset,
          'ds-control--inset-double': this.doubleInset,
          ...controlWidthClass(this.width),
        }}
        tabIndex={-1}
      >
        {control}
      </Host>
    );
  }
}
