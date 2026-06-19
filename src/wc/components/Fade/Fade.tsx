import { Component, Prop, h, Host } from '@stencil/core';

export type FadeSide = 'top' | 'bottom' | 'left' | 'right';
export type FadeSurface =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'navigation'
  | 'media'
  | 'always-dark'
  | 'inverted';
export type FadeSizeToken =
  | 'size-000'
  | 'size-050'
  | 'size-075'
  | 'size-100'
  | 'size-150'
  | 'size-200'
  | 'size-250'
  | 'size-300'
  | 'size-400'
  | 'size-500'
  | 'size-600'
  | 'size-800';
export type FadeSize = FadeSizeToken | (string & {});

const SIZE_VALUE: Record<FadeSizeToken, string> = {
  'size-000': 'var(--dimension-size-000)',
  'size-050': 'var(--dimension-size-050)',
  'size-075': 'var(--dimension-size-075)',
  'size-100': 'var(--dimension-size-100)',
  'size-150': 'var(--dimension-size-150)',
  'size-200': 'var(--dimension-size-200)',
  'size-250': 'var(--dimension-size-250)',
  'size-300': 'var(--dimension-size-300)',
  'size-400': 'var(--dimension-size-400)',
  'size-500': 'var(--dimension-size-500)',
  'size-600': 'var(--dimension-size-600)',
  'size-800': 'var(--dimension-size-800)',
};

const SURFACE_BACKGROUND: Record<FadeSurface, string> = {
  default: 'var(--color-background-secondary)',
  primary: 'var(--color-background-primary)',
  secondary: 'var(--color-background-secondary)',
  navigation: 'var(--color-navigation-background)',
  media: 'var(--color-media-background)',
  'always-dark': 'var(--color-always-dark-background)',
  inverted: 'var(--color-inverted-background)',
};

@Component({
  tag: 'ds-fade',
  styleUrl: 'Fade.css',
  scoped: true,
})
export class Fade {
  /** Edge where the fade is anchored. */
  @Prop() side: FadeSide = 'bottom';

  /** Fade depth along the fade axis. Accepts dimension size token names or any CSS length. */
  @Prop() size: FadeSize = 'size-600';

  /**
   * Deprecated alias for size. Kept for existing consumers that pass a raw CSS length.
   * Prefer `size`.
   */
  @Prop() height: string | undefined;

  /** Surface context used to choose the fade target background token. */
  @Prop() surface: FadeSurface = 'default';

  /** Direct background override for contexts that already expose a resolved surface var. */
  @Prop() background: string = 'var(--color-background-secondary)';

  /** Controls visibility without removing the element from layout/positioning. */
  @Prop() visible: boolean = true;

  private resolveSize(): string {
    if (this.height) return this.height;

    return Object.prototype.hasOwnProperty.call(SIZE_VALUE, this.size)
      ? SIZE_VALUE[this.size as FadeSizeToken]
      : this.size;
  }

  private resolveBackground(): string {
    if (this.background !== 'var(--color-background-secondary)') return this.background;
    return SURFACE_BACKGROUND[this.surface];
  }

  render() {
    const isVerticalEdge = this.side === 'top' || this.side === 'bottom';

    return (
      <Host
        aria-hidden="true"
        class={{
          fade: true,
          'fade--hidden': !this.visible,
          'fade--vertical-edge': isVerticalEdge,
          'fade--horizontal-edge': !isVerticalEdge,
          [`fade--${this.side}`]: true,
        }}
        style={{
          '--ds-fade-size': this.resolveSize(),
          '--ds-fade-bg': this.resolveBackground(),
        } as Record<string, string>}
      />
    );
  }
}
