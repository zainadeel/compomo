import { Component, Prop, Event, EventEmitter, h, Host } from '@stencil/core';

export type ChipIntent     = 'neutral' | 'brand' | 'ai' | 'negative' | 'warning' | 'caution' | 'positive';
export type ChipContrast   = 'strong' | 'bold' | 'medium' | 'faint';
export type ChipElevation  = 'none' | 'flat' | 'elevated';
export type ChipSize       = 'md' | 'sm' | 'xs';
export type ChipBackground = 'faint' | 'medium' | 'bold' | 'strong' | 'always-dark';

const TEXT_VARIANT: Record<ChipSize, string> = {
  md: 'text-body-medium',
  sm: 'text-body-small',
  xs: 'text-caption',
};

const ICON_SIZE: Record<ChipSize, number> = { md: 20, sm: 16, xs: 12 };

@Component({
  tag: 'ds-chip',
  styleUrl: 'Chip.css',
  scoped: true,
})
export class Chip {
  @Prop() label!: string;
  @Prop() intent: ChipIntent = 'neutral';
  @Prop() contrast: ChipContrast = 'faint';
  @Prop() elevation: ChipElevation = 'none';
  @Prop() size: ChipSize = 'md';
  @Prop() rounded: boolean = false;
  @Prop() removable: boolean = false;
  @Prop() maxWidth: string | number | undefined;
  @Prop() inactive: boolean = false;
  @Prop() background: ChipBackground | undefined;
  @Prop({ mutable: true }) pressed: boolean = false;

  /** Fired when the remove button is clicked. */
  @Event() dsRemove!: EventEmitter<void>;
  /** Fired when an interactive chip is clicked. */
  @Event() dsClick!: EventEmitter<void>;
  /** Fired when the pressed state toggles. */
  @Event() dsPressedChange!: EventEmitter<boolean>;

  private handleClick = () => {
    if (this.inactive) return;
    this.pressed = !this.pressed;
    this.dsPressedChange.emit(this.pressed);
    this.dsClick.emit();
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (this.inactive) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.handleClick();
    }
  };

  private handleRemove = (e: MouseEvent) => {
    e.stopPropagation();
    this.dsRemove.emit();
  };

  render() {
    const sz = this.size.toUpperCase() as 'MD' | 'SM' | 'XS';
    const textVariant = TEXT_VARIANT[this.size];
    const iconSize = ICON_SIZE[this.size];

    const maxWidthStyle = this.maxWidth != null
      ? { maxWidth: typeof this.maxWidth === 'number' ? `${this.maxWidth}px` : this.maxWidth }
      : undefined;

    const hostCls: Record<string, boolean> = {
      'tag': true,
      [`tag--intent-${this.intent}`]: true,
      [`tag--contrast-${this.contrast}`]: true,
      [`tag--elevation-${this.elevation}`]: true,
      [`tag--size-${this.size}`]: true,
      'tag--rounded': this.rounded,
      'tag--rounded-no-icon-left': this.rounded,
      'tag--rounded-no-remove-right': this.rounded && !this.removable,
      [`tag--icon-left-${sz}`]: false,
      [`tag--icon-right-${sz}`]: this.removable,
      'tag--removable': this.removable,
      'tag--interactive': true,
      'tag--inactive': this.inactive,
      'tag--pressed': this.pressed,
      'tag--on-medium':      this.background === 'medium',
      'tag--on-bold':        this.background === 'bold',
      'tag--on-strong':      this.background === 'strong',
      'tag--on-always-dark': this.background === 'always-dark',
    };

    return (
      <Host
        class={hostCls}
        style={maxWidthStyle}
        onClick={this.handleClick}
        onKeyDown={this.handleKeyDown}
        role="button"
        tabIndex={this.inactive ? -1 : 0}
        aria-pressed={String(this.pressed)}
        aria-disabled={this.inactive || undefined}
      >
        <span class="tag__icon-slot" style={{ fontSize: `${iconSize}px`, lineHeight: '0' }}>
          <slot name="icon" />
        </span>
        <span class={{ 'tag__label': true, [textVariant]: true }}>
          {this.label}
        </span>
        {this.removable && (
          <button
            type="button"
            class="tag__remove"
            onClick={this.handleRemove}
            aria-label={`Remove ${this.label}`}
            tabIndex={-1}
          >
            <slot name="remove-icon">
              <span class="tag__remove-x" style={{ fontSize: `${iconSize}px`, lineHeight: '0' }}>
                ✕
              </span>
            </slot>
          </button>
        )}
      </Host>
    );
  }
}
