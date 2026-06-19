import { Component, Prop, h, Host } from '@stencil/core';

export type BadgeVariant = 'counter' | 'dot';
export type BadgeSurface =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'medium'
  | 'bold'
  | 'strong'
  | 'navigation'
  | 'always-dark';

const SURFACE_RING: Record<BadgeSurface, string> = {
  default: 'var(--color-background-secondary)',
  primary: 'var(--color-background-primary)',
  secondary: 'var(--color-background-secondary)',
  medium: 'var(--color-background-medium-neutral)',
  bold: 'var(--color-background-bold-neutral)',
  strong: 'var(--color-background-strong-neutral)',
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

  /** Highest count shown before compacting to "+". */
  @Prop() max: number = 9;

  /** Surface context for the ring around dots. */
  @Prop() surface: BadgeSurface = 'default';

  /** Direct ring background override for component-local surfaces. */
  @Prop() background: string | undefined;

  /** Deprecated alias for selected counter styling. Prefer context-specific color in the parent. */
  @Prop() isSelected: boolean = false;

  /** Accessible label. Defaults to the count as a string. */
  @Prop() label: string | undefined;

  render() {
    const isDot = this.variant === 'dot';

    if (!isDot && this.count === 0) return <Host style={{ display: 'none' }} />;

    const display = this.count > this.max ? '+' : String(this.count);
    const ariaLabel = this.label ?? (isDot ? 'Notification' : String(this.count));
    const ring = this.background ?? SURFACE_RING[this.surface];

    return (
      <Host
        class={{
          badge: true,
          'badge--counter': !isDot,
          'badge--dot': isDot,
          'badge--selected': this.isSelected,
        }}
        aria-label={ariaLabel}
        style={{ '--_badge-ring': ring }}
      >
        <span
          class={{
            'badge__mark': true,
            'text-caption-emphasis': !isDot,
          }}
          aria-hidden="true"
        >
          {!isDot && display}
        </span>
      </Host>
    );
  }
}
