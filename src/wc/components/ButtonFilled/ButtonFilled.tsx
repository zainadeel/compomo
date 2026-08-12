import { Component, Element, Event, EventEmitter, h, Host, Method, Prop } from '@stencil/core';
import { controlWidthClass } from '../../utils';
import type { ChoiceBackground } from '../../utils/choice-list';
import { beginElevatedControlPress } from '../../utils/control-press';
import { renderButtonContent } from '../../utils/button-render';
import type { ControlInsetDepth } from '../../utils/control-text';
import type {
  ButtonPopup,
  ButtonSize,
  ButtonVariant,
  ButtonWidth,
} from '../../utils/button-types';

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

export type ButtonFilledVariant = ButtonVariant;
export type ButtonFilledSize = ButtonSize;
export type ButtonFilledWidth = ButtonWidth;
export type ButtonFilledPopup = ButtonPopup;

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

  /** Use reduced outer geometry when nested inside a control of the same size. */
  @Prop() isInset: boolean = false;

  /** Single removes 4px overall; double removes 8px overall (xs stays single). */
  @Prop() insetDepth: ControlInsetDepth = 'single';

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

  private get resolvedHaspopup(): ButtonFilledPopup | undefined {
    return this.haspopup ?? (this.hasMenu ? 'menu' : undefined);
  }

  private get accessibleName(): string | undefined {
    if (this.ariaLabel) return this.ariaLabel;
    if (this.isLoading && this.variant === 'label' && this.label) return this.label;
    return undefined;
  }

  private get doubleInset(): boolean {
    return this.isInset && this.insetDepth === 'double' && this.size !== 'xs';
  }

  render() {
    const cls: Record<string, boolean> = {
      'button-filled': true,
      'ds-button': true,
      'ds-focus-ring-inset': true,
      'ds-control-press-scale': this.pressScale,
      'ds-interaction-fill': !this.isInactive,
      /* Bold is the default filled contrast — on-bold interaction tokens. */
      'ds-interaction-fill--on-bold': this.contrast === 'bold',
      'ds-interaction-fill--on-strong': this.contrast === 'strong',
      'ds-interaction-fill--on-medium': this.contrast === 'medium',
      /* faint → default app interaction tokens (no --on-*). */
      'button-filled--bordered': this.hasBorder,
      'ds-button--bordered': this.hasBorder,
      'button-filled--expanded': this.expanded === true && !this.isInactive,
      'ds-button--expanded': this.expanded === true && !this.isInactive,
      'ds-control-inactive': this.isInactive,
      'ds-control--lg': this.size === 'lg',
      'ds-control--md': this.size === 'md',
      'ds-control--sm': this.size === 'sm',
      'ds-control--xs': this.size === 'xs',
      'ds-control--inset': this.isInset && !this.doubleInset,
      'ds-control--inset-double': this.doubleInset,
      'ds-control-frame': true,
      'button-filled--icon': this.variant === 'icon',
      'ds-button--icon': this.variant === 'icon',
      'button-filled--label': this.variant === 'label',
      'button-filled--icon-label': this.variant === 'icon-label',
      'button-filled--rounded': this.rounded,
      'ds-button--rounded': this.rounded,
      [`button-filled--background-${this.background}`]: this.background !== undefined,
      [`button-filled--intent-${this.intent}`]: true,
      [`button-filled--contrast-${this.contrast}`]: true,
    };

    return (
      <Host
        class={{
          'button-filled-host': true,
          'button-filled-host--icon': this.variant === 'icon',
          'ds-button-host--icon': this.variant === 'icon',
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
          onPointerDown={event =>
            beginElevatedControlPress(
              event,
              this.pressScale && !this.isInactive && !this.isLoading,
            )
          }
          onClick={this.handleClick}
        >
          {renderButtonContent({
            namespace: 'button-filled',
            variant: this.variant,
            size: this.size,
            label: this.label,
            icon: this.icon,
            hasMenu: this.hasMenu,
            isLoading: this.isLoading,
          })}
        </button>
      </Host>
    );
  }
}
