import { Component, Prop, h, Host } from '@stencil/core';

export type DividerOrientation = 'horizontal' | 'vertical';
export type DividerSurface =
  | 'default'
  | 'on-bold-background'
  | 'on-strong-background'
  | 'on-medium-background'
  | 'on-translucent-background'
  | 'navigation'
  | 'media'
  | 'always-dark'
  | 'inverted';
export type DividerInsetToken =
  | 'space-000'
  | 'space-012'
  | 'space-025'
  | 'space-050'
  | 'space-075'
  | 'space-100'
  | 'space-125'
  | 'space-150'
  | 'space-175'
  | 'space-200'
  | 'space-250'
  | 'space-300'
  | 'space-400'
  | 'space-600'
  | 'space-800';
export type DividerInset = 'none' | DividerInsetToken | (string & {});
export type DividerLength = 'auto' | 'full' | (string & {});

const INSET_VALUE: Record<'none' | DividerInsetToken, string> = {
  none: '0',
  'space-000': 'var(--dimension-space-000)',
  'space-012': 'var(--dimension-space-012)',
  'space-025': 'var(--dimension-space-025)',
  'space-050': 'var(--dimension-space-050)',
  'space-075': 'var(--dimension-space-075)',
  'space-100': 'var(--dimension-space-100)',
  'space-125': 'var(--dimension-space-125)',
  'space-150': 'var(--dimension-space-150)',
  'space-175': 'var(--dimension-space-175)',
  'space-200': 'var(--dimension-space-200)',
  'space-250': 'var(--dimension-space-250)',
  'space-300': 'var(--dimension-space-300)',
  'space-400': 'var(--dimension-space-400)',
  'space-600': 'var(--dimension-space-600)',
  'space-800': 'var(--dimension-space-800)',
};

@Component({
  tag: 'ds-divider',
  styleUrl: 'Divider.css',
  scoped: true,
})
export class Divider {
  /** Direction of the divider line. Defaults to 'horizontal'. */
  @Prop() orientation: DividerOrientation = 'horizontal';

  /** Surface context so the divider uses the right TokoMo divider token. */
  @Prop() surface: DividerSurface = 'default';

  /** Insets the divider from its start/end edges. Accepts spacing token names or any CSS length. */
  @Prop() inset: DividerInset = 'none';

  /** Visual line length. Defaults to filling the available axis. Accepts any CSS length. */
  @Prop() length: DividerLength = 'auto';

  /** Expose the divider as a semantic separator. Visual-only dividers are hidden from assistive tech by default. */
  @Prop() semantic: boolean = false;

  private resolveInset(): string {
    return Object.prototype.hasOwnProperty.call(INSET_VALUE, this.inset)
      ? INSET_VALUE[this.inset as keyof typeof INSET_VALUE]
      : this.inset;
  }

  private resolveLength(): string {
    return this.length === 'auto' || this.length === 'full'
      ? '100%'
      : this.length;
  }

  render() {
    const isVertical = this.orientation === 'vertical';
    const hasCustomLength = this.length !== 'auto' && this.length !== 'full';

    return (
      <Host
        role={this.semantic ? 'separator' : undefined}
        aria-orientation={this.semantic ? this.orientation : undefined}
        aria-hidden={this.semantic ? undefined : 'true'}
        class={{
          divider: true,
          'divider--vertical': isVertical,
          'divider--custom-length': hasCustomLength,
          [`divider--surface-${this.surface}`]: true,
        }}
        style={{
          '--_divider-inset': this.resolveInset(),
          '--_divider-length': this.resolveLength(),
        }}
      />
    );
  }
}
