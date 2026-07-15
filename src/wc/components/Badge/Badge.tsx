import { Component, Prop, Element, State, Watch, h, Host } from '@stencil/core';
import {
  BADGE_GRADIENT_POSITION_VAR,
  isShellGradientActive,
} from '../../shell/badge-gradient-ring';

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
  @Element() el!: HTMLElement;

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
   * `box-shadow`. Auto-enabled under an AppShell with an active gradient preset;
   * set `gradient-background` to opt in/out explicitly.
   *
   * The attribute must NOT start with `on` — Stencil's setAccessor routes any
   * unknown `on*` member down the event-listener path during attribute
   * reflection, calling addEventListener with a non-listener and throwing.
   */
  @Prop({ attribute: 'gradient-background', reflect: true }) gradientBackground: boolean = false;

  /** Contextual supplemental text. Omit when the owner hides the badge from assistive technology. */
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
  @Watch('hasRing')
  gradientBackgroundChanged() {
    if (!this.hasRing) {
      this.unbindGradientRingSync();
      return;
    }
    if (!this.gradientBackground && isShellGradientActive(this.el)) {
      this.gradientBackground = true;
      return;
    }
    this.bindGradientRingSync();
  }

  /** Imperative opt-in avoids Stencil aborting parent render for nested badges. */
  private enableShellGradientRingIfNeeded() {
    if (!this.hasRing) return;

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
    if (!this.gradientBackground || !isShellGradientActive(this.el)) return style;

    /* Shell chrome wash uses background-attachment: fixed at viewport origin. */
    style[BADGE_GRADIENT_POSITION_VAR] = '0 0';
    return style;
  }

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
          'badge--on-gradient-background': this.hasRing && this.gradientBackground,
        }}
        style={this.ringHostStyle(ring)}
      >
        <span class="badge__mark" aria-hidden="true">
          {!isDot && (
            <ds-text as="span" variant="text-caption" emphasis color="inherit">
              {display}
            </ds-text>
          )}
        </span>
        {this.label && <span class="badge__a11y">{this.label}</span>}
      </Host>
    );
  }
}
