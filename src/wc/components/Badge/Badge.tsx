import { Component, Prop, Element, State, Watch, h, Host } from '@stencil/core';
import {
  BADGE_GRADIENT_POSITION_VAR,
  badgeGradientPosition,
  findGradientSurface,
  isShellGradientActive,
  readShellGradientPosition,
} from '../../nav/badge-gradient-ring';

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
  @Element() el!: HTMLElement;

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

  /**
   * Ring samples the shell gradient stack (base fill + wash) instead of a flat
   * `box-shadow`. Auto-enabled in `componentDidLoad` under `ds-app-shell[gradient]`;
   * set `on-gradient-background` to opt in/out explicitly.
   */
  @Prop({ attribute: 'on-gradient-background', reflect: true }) gradientBackground: boolean = false;

  /** Deprecated alias for selected counter styling. Prefer context-specific color in the parent. */
  @Prop() isSelected: boolean = false;

  /** Accessible label. Defaults to the count as a string. */
  @Prop() label: string | undefined;

  /** Bumps on resize/layout so render recomputes gradient ring position. */
  @State() private gradientLayoutVersion = 0;

  private gradientObserver: ResizeObserver | null = null;
  private gradientWindowListener: (() => void) | null = null;

  componentDidLoad() {
    this.enableShellGradientRingIfNeeded();
  }

  disconnectedCallback() {
    this.unbindGradientRingSync();
  }

  @Watch('gradientBackground')
  gradientBackgroundChanged() {
    this.bindGradientRingSync();
  }

  /** Imperative opt-in avoids Stencil aborting parent render for nested badges. */
  private enableShellGradientRingIfNeeded() {
    if (!this.gradientBackground && isShellGradientActive(this.el)) {
      this.gradientBackground = true;
    }

    if (this.gradientBackground) {
      this.bindGradientRingSync();
    }
  }

  private bindGradientRingSync() {
    this.unbindGradientRingSync();

    if (!this.gradientBackground) return;

    const update = () => {
      this.gradientLayoutVersion += 1;
    };
    update();

    this.gradientWindowListener = update;
    window.addEventListener('resize', update);

    if (typeof ResizeObserver !== 'undefined') {
      this.gradientObserver = new ResizeObserver(update);
      this.gradientObserver.observe(this.el);

      const shell = this.el.closest('ds-app-shell');
      if (shell) this.gradientObserver.observe(shell);

      const bar = this.el.closest('ds-bar-nav');
      if (bar) this.gradientObserver.observe(bar);

      const panel = this.el.closest('ds-panel-nav');
      if (panel) this.gradientObserver.observe(panel);
    }
  }

  private unbindGradientRingSync() {
    if (this.gradientWindowListener) {
      window.removeEventListener('resize', this.gradientWindowListener);
      this.gradientWindowListener = null;
    }

    this.gradientObserver?.disconnect();
    this.gradientObserver = null;
  }

  private ringHostStyle(ring: string): Record<string, string> {
    void this.gradientLayoutVersion;

    const style: Record<string, string> = { '--_badge-ring': ring };
    if (!this.gradientBackground) return style;

    const surface = findGradientSurface(this.el);
    if (!surface) return style;

    style[BADGE_GRADIENT_POSITION_VAR] = badgeGradientPosition(
      this.el,
      surface,
      readShellGradientPosition(surface),
    );
    return style;
  }

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
          'badge--on-gradient-background': this.gradientBackground,
        }}
        aria-label={ariaLabel}
        style={this.ringHostStyle(ring)}
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
