import { Component, Prop, h, Host } from '@stencil/core';

export type BadgeVariant = 'counter' | 'dot';
export type BadgeSurface =
  | 'primary'
  | 'secondary'
  | 'faint'
  | 'medium'
  | 'bold'
  | 'strong'
  | 'translucent'
  | 'inverted'
  | 'media'
  | 'navigation'
  | 'always-dark';

const SURFACE_RING: Record<BadgeSurface, string> = {
  primary: 'var(--color-background-primary)',
  secondary: 'var(--color-background-secondary)',
  faint: 'var(--color-background-faint-neutral)',
  medium: 'var(--color-background-medium-neutral)',
  bold: 'var(--color-background-bold-neutral)',
  strong: 'var(--color-background-strong-neutral)',
  translucent: 'var(--color-translucent-translucent)',
  inverted: 'var(--color-inverted-background)',
  media: 'var(--color-media-background)',
  navigation: 'var(--color-navigation-background)',
  'always-dark': 'var(--color-always-dark-background)',
};

@Component({
  tag: 'ds-badge',
  styleUrl: 'Badge.css',
  scoped: true,
})
export class Badge {
  /** Render as a compact counter or notification dot. */
  @Prop() variant: BadgeVariant = 'counter';

  /** Count shown for counter badges. Count 0 hides the badge. */
  @Prop() count: number = 0;

  /** Highest count shown before compacting to "{max}+". */
  @Prop() max: number = 9;

  /** Immediate backing surface matched by the ring around either variant. */
  @Prop() surface: BadgeSurface = 'primary';

  /** Direct ring background override for component-local surfaces. */
  @Prop() background: string | undefined;

  /** Show the separation ring when the badge overlaps an icon or other content. */
  @Prop() hasRing: boolean = true;

  /**
   * Ring samples the shell gradient stack (base fill + wash) instead of a flat
   * `box-shadow`. Omit to inherit ShellApp context; set true or false to override.
   *
   * The attribute must NOT start with `on` — Stencil's setAccessor routes any
   * unknown `on*` member down the event-listener path during attribute
   * reflection, calling addEventListener with a non-listener and throwing.
   */
  @Prop({ attribute: 'gradient-background', reflect: true }) gradientBackground?: boolean;

  /** Contextual supplemental text. Omit when the owner hides the badge from assistive technology. */
  @Prop() label: string | undefined;

  render() {
    const isDot = this.variant === 'dot';

    if (!isDot && this.count <= 0) return <Host style={{ display: 'none' }} />;

    const display = this.count > this.max ? `${this.max}+` : String(this.count);
    const ring = this.background ?? SURFACE_RING[this.surface];

    return (
      <Host
        class={{
          badge: true,
          'badge--counter': !isDot,
          'badge--dot': isDot,
          'badge--no-ring': !this.hasRing,
          'badge--force-gradient-background': this.gradientBackground === true,
          'badge--force-flat-background': this.gradientBackground === false,
        }}
        style={{ '--_badge-ring': ring }}
      >
        <span class="badge__mark" aria-hidden="true">
          {!isDot && (
            <ds-text as="span" variant="text-caption" emphasis color="inherit">
              {display}
            </ds-text>
          )}
        </span>
        {this.label && <span class="badge__a11y ds-visually-hidden">{this.label}</span>}
      </Host>
    );
  }
}
