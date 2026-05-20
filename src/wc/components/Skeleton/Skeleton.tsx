import { Component, Prop, h, Host } from '@stencil/core';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular';

@Component({
  tag: 'ds-skeleton',
  styleUrl: 'Skeleton.css',
  shadow: true,
})
export class Skeleton {
  @Prop() variant: SkeletonVariant = 'text';
  /** Width as a CSS value string (e.g. '200px', '100%') or number (px). */
  @Prop() width: string | number | undefined;
  /** Height as a CSS value string or number (px). */
  @Prop() height: string | number | undefined;
  /** Number of text lines. Only used when variant is 'text'. */
  @Prop() lines: number = 1;
  /** Whether to show the shimmer animation. */
  @Prop() shimmer: boolean = true;

  private get widthCss() {
    const v = this.width;
    if (v == null) return undefined;
    return typeof v === 'number' ? `${v}px` : v;
  }

  private get heightCss() {
    const v = this.height;
    if (v == null) return undefined;
    return typeof v === 'number' ? `${v}px` : v;
  }

  render() {
    if (this.variant === 'text' && this.lines > 1) {
      return (
        <Host aria-hidden="true" style={{ width: this.widthCss }}>
          <div class="text-group">
            {Array.from({ length: this.lines }, (_, lineIdx) => (
              <div
                class={{ skeleton: true, text: true, animate: this.shimmer }}
                style={{
                  width: lineIdx === this.lines - 1 ? '60%' : '100%',
                  height: this.heightCss,
                }}
              />
            ))}
          </div>
        </Host>
      );
    }

    return (
      <Host
        aria-hidden="true"
        class={{
          skeleton: true,
          [this.variant]: true,
          animate: this.shimmer,
        }}
        style={{ width: this.widthCss, height: this.heightCss }}
      />
    );
  }
}
