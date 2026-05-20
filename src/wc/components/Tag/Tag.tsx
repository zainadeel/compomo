import { Component, Prop, Event, EventEmitter, h, Host } from '@stencil/core';

export type TagIntent     = 'neutral' | 'brand' | 'ai' | 'negative' | 'warning' | 'caution' | 'positive';
export type TagContrast   = 'strong' | 'bold' | 'medium' | 'faint';
export type TagElevation  = 'none' | 'flat' | 'elevated';
export type TagSize       = 'md' | 'sm' | 'xs';
export type TagBackground = 'faint' | 'medium' | 'bold' | 'strong' | 'always-dark';

const TEXT_VARIANT: Record<TagSize, string> = {
  md: 'text-body-medium',
  sm: 'text-body-small',
  xs: 'text-caption',
};

const ICON_SIZE: Record<TagSize, number> = { md: 20, sm: 16, xs: 12 };

@Component({
  tag: 'ds-tag',
  styleUrl: 'Tag.css',
  scoped: true,
})
export class Tag {
  @Prop() label!: string;
  @Prop() intent: TagIntent = 'neutral';
  @Prop() contrast: TagContrast = 'faint';
  @Prop() elevation: TagElevation = 'none';
  @Prop() size: TagSize = 'md';
  @Prop() rounded: boolean = false;
  @Prop() removable: boolean = false;
  @Prop() maxWidth: string | number | undefined;
  @Prop() inactive: boolean = false;
  @Prop() background: TagBackground | undefined;
  @Prop({ mutable: true }) pressed: boolean = false;
  /** Whether the tag has a click/toggle behavior. */
  @Prop() interactive: boolean = false;

  /** Fired when the remove button is clicked. */
  @Event() dsRemove!: EventEmitter<void>;
  /** Fired when an interactive tag is clicked. */
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
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    const sz = this.size.toUpperCase() as 'MD' | 'SM' | 'XS';
    const hasIconSlot = true; // always render slot, consumer decides whether to fill it
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
      'tag--rounded-no-icon-left': this.rounded, // consumer overrides via slot presence hack
      'tag--rounded-no-remove-right': this.rounded && !this.removable,
      [`tag--icon-left-${sz}`]: false, // toggled by slotchange
      [`tag--icon-right-${sz}`]: this.removable,
      'tag--removable': this.removable,
      'tag--interactive': this.interactive,
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
        onClick={this.interactive ? this.handleClick : undefined}
        onKeyDown={this.interactive ? this.handleKeyDown : undefined}
        role={this.interactive ? 'button' : undefined}
        tabIndex={this.interactive ? (this.inactive ? -1 : 0) : undefined}
        aria-pressed={this.interactive && this.pressed !== undefined ? String(this.pressed) : undefined}
        aria-disabled={this.inactive || undefined}
      >
        {/* Leading icon slot — consumer provides an icon element */}
        <span class="tag__icon-slot" style={{ fontSize: `${iconSize}px`, lineHeight: '0' }}>
          <slot name="icon" />
        </span>
        {/* Label */}
        <span class={{ 'tag__label': true, [textVariant]: true }}>
          {this.label}
        </span>
        {/* Remove button */}
        {this.removable && (
          <button
            type="button"
            class="tag__remove"
            onClick={this.handleRemove}
            aria-label={`Remove ${this.label}`}
            tabIndex={-1}
          >
            {/* Remove icon slot — defaults to × glyph */}
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
