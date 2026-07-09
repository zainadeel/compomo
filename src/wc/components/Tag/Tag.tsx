import { Component, Prop, h, Host } from '@stencil/core';

export type TagIntent   = 'neutral' | 'brand' | 'ai' | 'negative' | 'warning' | 'caution' | 'positive';
export type TagContrast = 'strong' | 'bold' | 'medium' | 'faint';
export type TagSize     = 'md' | 'sm' | 'xs';

/** Text variant per control-density recipe (md / sm / xs). */
const TEXT_VARIANT: Record<TagSize, string> = {
  md: 'text-body-medium',
  sm: 'text-body-small',
  xs: 'text-caption',
};

/**
 * `ds-icon` size prop matching control-density icon metrics
 * (md→20 / sm→16 / xs→12 via `--dimension-iconography-*`).
 */
const ICON_SIZE: Record<TagSize, 'md' | 'sm' | 'xs'> = {
  md: 'md',
  sm: 'sm',
  xs: 'xs',
};

@Component({
  tag: 'ds-tag',
  styleUrl: 'Tag.css',
  scoped: true,
})
export class Tag {
  @Prop() label!: string;
  @Prop() intent: TagIntent = 'neutral';
  @Prop() contrast: TagContrast = 'faint';
  @Prop() size: TagSize = 'md';
  @Prop() rounded: boolean = false;
  @Prop() maxWidth: string | number | undefined;

  render() {
    const textVariant = TEXT_VARIANT[this.size];
    const iconSize = ICON_SIZE[this.size];

    const maxWidthStyle = this.maxWidth != null
      ? { maxWidth: typeof this.maxWidth === 'number' ? `${this.maxWidth}px` : this.maxWidth }
      : undefined;

    return (
      <Host
        class={{
          'tag': true,
          [`tag--intent-${this.intent}`]: true,
          [`tag--contrast-${this.contrast}`]: true,
          [`tag--size-${this.size}`]: true,
          'ds-control--md': this.size === 'md',
          'ds-control--sm': this.size === 'sm',
          'ds-control--xs': this.size === 'xs',
          'tag--rounded': this.rounded,
        }}
        style={maxWidthStyle}
      >
        {/* Leading icon — consumer provides ds-icon (or any SVG); prefer size matching tag size. */}
        <span class="tag__icon-slot" data-icon-size={iconSize}>
          <slot name="icon" />
        </span>
        <span class={{ 'tag__label': true, [textVariant]: true }}>
          {this.label}
        </span>
      </Host>
    );
  }
}
