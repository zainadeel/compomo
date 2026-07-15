import { Component, Prop, h, Host } from '@stencil/core';
import type { IconSize } from '../Icon/Icon';
import type { TextVariant } from '../Text/text-types';
import type { ControlSize } from '../../utils/control-text';

export type SkeletonVariant = 'text' | 'icon' | 'control';
export type SkeletonBackground =
  | 'faint'
  | 'medium'
  | 'bold'
  | 'strong'
  | 'translucent'
  | 'inverted'
  | 'media'
  | 'navigation'
  | 'always-dark';

@Component({
  tag: 'ds-skeleton',
  styleUrl: 'Skeleton.css',
  shadow: true,
})
export class Skeleton {
  @Prop() variant: SkeletonVariant = 'text';
  /** Text metric recipe whose line-height defines the text canvas. */
  @Prop() textVariant: TextVariant = 'text-body-medium';
  /** Iconography token whose square canvas defines the icon canvas. */
  @Prop() iconSize: IconSize = 'md';
  /** Shared control-density size whose height defines the control canvas. */
  @Prop() controlSize: ControlSize = 'md';
  /** Width of text and control skeleton canvases. Numbers resolve to px. Ignored for icons. */
  @Prop() width: string | number | undefined;
  /** Round icon skeletons into circles and control skeletons into pills. Ignored for text. */
  @Prop() rounded: boolean = false;
  /** Whether to show the shimmer animation. */
  @Prop() shimmer: boolean = true;
  /** Actual parent surface context. Omit on primary and secondary surfaces. */
  @Prop() background: SkeletonBackground | undefined;

  private get widthCss() {
    const v = this.width;
    if (v == null) return undefined;
    return typeof v === 'number' ? `${v}px` : v;
  }

  render() {
    return (
      <Host
        aria-hidden="true"
        class={{
          'skeleton': true,
          [`skeleton--${this.variant}`]: true,
          [`skeleton--text-${this.textVariant}`]: this.variant === 'text',
          [`skeleton--icon-${this.iconSize}`]: this.variant === 'icon',
          [`ds-control--${this.controlSize}`]: this.variant === 'control',
          [`skeleton--background-${this.background}`]: !!this.background,
          'skeleton--rounded': this.variant !== 'text' && this.rounded,
        }}
        style={this.variant === 'icon' ? undefined : { width: this.widthCss }}
      >
        <span
          class={{
            'skeleton__shape': true,
            'ds-shimmer-surface': this.shimmer,
          }}
        />
      </Host>
    );
  }
}
