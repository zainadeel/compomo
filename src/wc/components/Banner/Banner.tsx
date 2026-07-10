import { Component, Prop, State, Event, EventEmitter, Watch, h, Host } from '@stencil/core';
import { resolveCssTimeMs, TOKEN_DEFAULTS } from '../../utils';

export type BannerIntent =
  | 'brand' | 'positive' | 'negative' | 'warning' | 'caution'
  | 'ai' | 'neutral' | 'walkthrough' | 'guide';

export type BannerContrast = 'faint' | 'medium' | 'bold' | 'strong';

@Component({
  tag: 'ds-banner',
  styleUrl: 'Banner.css',
  scoped: true,
})
export class Banner {
  @Prop() intent: BannerIntent = 'neutral';
  @Prop() contrast: BannerContrast = 'medium';
  @Prop() message: string = '';
  /** Renders the diagonal-stripe accent bar above the body. */
  @Prop() header: boolean = false;
  /** Renders at a fixed position (centered top) and auto-dismisses after 4 s. */
  @Prop() floating: boolean = false;
  @Prop() showDismiss: boolean = false;
  @Prop() dismissLabel: string = 'Dismiss';

  @State() private closing: boolean = false;

  @Event() dsDismiss!: EventEmitter<void>;

  private dismissTimer: ReturnType<typeof setTimeout> | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  private get fadeOutMs(): number {
    return resolveCssTimeMs(TOKEN_DEFAULTS.motionShort3, TOKEN_DEFAULTS.animationDurationShort3);
  }

  private get autoDismissMs(): number {
    return resolveCssTimeMs(TOKEN_DEFAULTS.animationDelayLong2, TOKEN_DEFAULTS.animationDelayLong2);
  }

  componentDidLoad() {
    if (this.floating && this.message) this.scheduleDismiss();
  }

  @Watch('message')
  onMessageChange(newVal: string) {
    if (this.floating && newVal) {
      this.closing = false;
      this.scheduleDismiss();
    }
  }

  disconnectedCallback() {
    this.clearTimers();
  }

  private clearTimers() {
    if (this.dismissTimer) { clearTimeout(this.dismissTimer); this.dismissTimer = null; }
    if (this.closeTimer)   { clearTimeout(this.closeTimer);   this.closeTimer = null; }
  }

  private scheduleDismiss() {
    this.clearTimers();
    this.dismissTimer = setTimeout(() => {
      this.dismissTimer = null;
      this.beginClose();
    }, this.autoDismissMs);
  }

  private beginClose() {
    this.clearTimers();
    if (this.floating) {
      this.closing = true;
      this.closeTimer = setTimeout(() => {
        this.closing = false;
        this.closeTimer = null;
        this.dsDismiss.emit();
      }, this.fadeOutMs);
    } else {
      this.dsDismiss.emit();
    }
  }

  private getContentColor(): string {
    if (this.contrast === 'bold') return 'var(--color-foreground-on-bold-background-primary)';
    const c = this.contrast === 'faint' ? 'bold' : this.contrast === 'medium' ? 'strong' : 'medium';
    return `var(--color-foreground-${c}-${this.intent})`;
  }

  private getBg(): string {
    return `var(--color-background-${this.contrast}-${this.intent})`;
  }

  private getElevation(): string {
    return this.floating
      ? 'var(--effect-elevation-elevated-floating)'
      : 'var(--effect-elevation-elevated-sm)';
  }

  render() {
    const contentColor = this.getContentColor();
    const isAssertive = this.intent === 'negative';

    const bannerEl = (
      <div
        class={{ 'banner-wrapper': true }}
        style={{ '--banner-content': contentColor } as { [key: string]: string }}
        role={isAssertive ? 'alert' : 'status'}
        aria-live={isAssertive ? undefined : 'polite'}
      >
        <div
          class="banner-surface"
          style={{
            backgroundColor: this.getBg(),
            boxShadow: this.getElevation(),
          }}
        >
          {this.header && (
            <div class="banner-header-surface">
              <div class="banner-header" />
            </div>
          )}
          <div class="banner-body">
            <span class="banner-message">
              <ds-text as="span" variant="text-body-medium" color="inherit">
                {this.message}
              </ds-text>
            </span>
            {this.showDismiss && (
              <button
                type="button"
                class="banner-dismiss"
                onClick={() => this.beginClose()}
                aria-label={this.dismissLabel}
              >
                &times;
              </button>
            )}
          </div>
        </div>
      </div>
    );

    if (this.floating) {
      return (
        <Host style={{ display: 'contents' }}>
          <div class="floating-position" style={{ zIndex: '9998' }}>
            <div class={{ 'floating-toast': true, 'floating-toast--closing': this.closing }}>
              {bannerEl}
            </div>
          </div>
        </Host>
      );
    }

    return <Host style={{ display: 'contents' }}>{bannerEl}</Host>;
  }
}
