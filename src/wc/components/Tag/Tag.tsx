import { Component, Prop, h, Host } from '@stencil/core';

export type TagIntent     = 'neutral' | 'brand' | 'ai' | 'negative' | 'warning' | 'caution' | 'positive';
export type TagContrast   = 'strong' | 'bold' | 'medium' | 'faint';
export type TagElevation  = 'none' | 'flat' | 'elevated';
export type TagSize       = 'md' | 'sm' | 'xs';

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
  @Prop() maxWidth: string | number | undefined;

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
      'tag--rounded-no-icon-left': this.rounded, // consumer overrides via slot presence hack
      'tag--rounded-no-remove-right': this.rounded,
      [`tag--icon-left-${sz}`]: false, // toggled by slotchange
      [`tag--icon-right-${sz}`]: false,
    };

    return (
      <Host
        class={hostCls}
        style={maxWidthStyle}
      >
        {/* Leading icon slot — consumer provides an icon element */}
        <span class="tag__icon-slot" style={{ fontSize: `${iconSize}px`, lineHeight: '0' }}>
          <slot name="icon" />
        </span>
        {/* Label */}
        <span class={{ 'tag__label': true, [textVariant]: true }}>
          {this.label}
        </span>
      </Host>
    );
  }
}
