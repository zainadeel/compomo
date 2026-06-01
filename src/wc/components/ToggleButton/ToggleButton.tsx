import { Component, Prop, Event, EventEmitter, h, Host } from '@stencil/core';
import type { IconSize } from '../Icon/Icon';

export type ToggleButtonElevation  = 'none' | 'flat' | 'elevated' | 'floating';
export type ToggleButtonSize       = 'md' | 'sm' | 'xs';
export type ToggleButtonBackground = 'faint' | 'medium' | 'bold' | 'strong' | 'always-dark';

const ICON_SIZE: Record<ToggleButtonSize, IconSize> = { md: 'md', sm: 'sm', xs: 'xs' };

// Pixel size reference for internal layout (icon span font-size)
const ICON_PX: Record<ToggleButtonSize, number> = { md: 20, sm: 16, xs: 12 };

const TEXT_CLASS: Record<ToggleButtonSize, string> = {
  md: 'text-body-medium-emphasis',
  sm: 'text-body-small-emphasis',
  xs: 'text-caption-emphasis',
};

@Component({
  tag: 'ds-toggle-button',
  styleUrl: 'ToggleButton.css',
  scoped: true,
})
export class ToggleButton {
  /**
   * Chrome level.
   *   none     — ghost (transparent, no border, no shadow)
   *   flat     — border only, transparent bg
   *   elevated — bg-primary + shadow  [default]
   *   floating — bg-primary + FAB-strength shadow
   */
  @Prop() elevation: ToggleButtonElevation = 'elevated';

  /** Label text. */
  @Prop() label: string | undefined;

  /**
   * Icon name for <ds-icon>. Set via JS property.
   * @example el.icon = 'GridView';
   */
  @Prop() icon: string | undefined;

  /** Size: md (32px), sm (24px), xs (16px). */
  @Prop() size: ToggleButtonSize = 'md';

  /** Pill shape. */
  @Prop() rounded: boolean = false;

  /** Parent surface context — adjusts hover tokens for colored backgrounds. */
  @Prop() background: ToggleButtonBackground | undefined;

  /** Controlled pressed state. */
  @Prop({ mutable: true }) pressed: boolean = false;

  /** Disables interaction. */
  @Prop() inactive: boolean = false;

  @Prop({ attribute: 'aria-label' }) ariaLabel: string | undefined;

  /** Emits the new pressed value (!pressed) on click. */
  @Event() dsChange!: EventEmitter<boolean>;

  private handleClick = () => {
    if (this.inactive) return;
    this.dsChange.emit(!this.pressed);
  };

  render() {
    const size = this.size;
    const iconSize = ICON_SIZE[size];
    const iconPx = ICON_PX[size];
    const textClass = TEXT_CLASS[size];
    const hasIcon = !!this.icon;
    const hasLabel = !!this.label;
    const isIconOnly = hasIcon && !hasLabel;
    const isLabelOnly = hasLabel && !hasIcon;
    const isIconAndLabel = hasIcon && hasLabel;
    const bg = this.background;
    const elevKey = this.elevation.charAt(0).toUpperCase() + this.elevation.slice(1);

    const cls: Record<string, boolean> = {
      'toggle-btn': true,
      [`elevation${elevKey}`]: true,
      sizeSM: size === 'sm',
      sizeXS: size === 'xs',
      rounded: this.rounded,
      inactive: this.inactive,
      pressed: this.pressed,
      iconOnly: isIconOnly,
      labelOnly: isLabelOnly,
      iconAndLabel: isIconAndLabel,
      onMedium: bg === 'medium',
      onBold: bg === 'bold',
      onStrong: bg === 'strong',
      onAlwaysDark: bg === 'always-dark',
    };

    return (
      <Host>
        <button
          type="button"
          class={cls}
          disabled={this.inactive}
          aria-label={this.ariaLabel ?? this.label ?? 'toggle'}
          aria-pressed={this.pressed}
          onClick={this.handleClick}
        >
          {hasIcon && (
            <span class="toggle-btn__icon" style={{ fontSize: `${iconPx}px` }}>
              <ds-icon name={this.icon} size={iconSize} />
            </span>
          )}
          {hasLabel && (
            <span class={`toggle-btn__label ${textClass}`}>{this.label}</span>
          )}
        </button>
      </Host>
    );
  }
}
