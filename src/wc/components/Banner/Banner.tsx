import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Prop,
  State,
  Watch,
} from '@stencil/core';
import { resolveMotionTimeMs, TOKEN_DEFAULTS } from '../../utils';

export type BannerIntent = 'neutral' | 'brand' | 'positive' | 'warning' | 'caution' | 'negative';

export type BannerContrast = 'faint' | 'medium' | 'strong' | 'bold';
export type BannerAnnouncement = 'none' | 'polite' | 'assertive';
export type BannerOrientation = 'horizontal' | 'vertical';

type BannerPhase = 'closed' | 'open' | 'closing';

@Component({
  tag: 'ds-banner',
  styleUrl: 'Banner.css',
  scoped: true,
})
export class Banner {
  @Element() el!: HTMLElement;

  /** Required explanatory copy. */
  @Prop() description!: string;
  /** Optional visual heading rendered before the description. */
  @Prop() heading: string = '';
  /** Semantic color family. */
  @Prop({ reflect: true }) intent: BannerIntent = 'neutral';
  /** Surface fill weight. */
  @Prop({ reflect: true }) contrast: BannerContrast = 'faint';
  /** Copy and action-lane arrangement, selected by the application. */
  @Prop({ reflect: true }) orientation: BannerOrientation = 'horizontal';
  /** Controlled visibility. Keep the element mounted until dsAfterClose when unmounting. */
  @Prop({ reflect: true }) open: boolean = true;
  /** Localized accessible label for the close control. */
  @Prop() dismissLabel: string = 'Dismiss banner';
  /** Live-region urgency, independent of visual intent. */
  @Prop() announcement: BannerAnnouncement = 'none';

  /** Emitted when the close control requests dismissal. The application controls open. */
  @Event() dsClose!: EventEmitter<MouseEvent>;
  /** Emitted once after controlled exit motion and layout collapse complete. */
  @Event() dsAfterClose!: EventEmitter<void>;

  @State() private rendered = false;
  @State() private phase: BannerPhase = 'closed';
  @State() private hasActions = false;

  private loaded = false;
  private transitionTimer: ReturnType<typeof setTimeout> | null = null;
  private closePending = false;

  componentWillLoad() {
    this.rendered = this.open;
    this.phase = this.open ? 'open' : 'closed';
  }

  componentDidLoad() {
    this.loaded = true;
    this.updateActionsPresence();
  }

  disconnectedCallback() {
    this.clearTransitionWork();
  }

  @Watch('open')
  onOpenChange(isOpen: boolean) {
    if (!this.loaded) return;
    if (isOpen) this.startOpen();
    else this.startClose();
  }

  private get closeMotionMs(): number {
    return resolveMotionTimeMs(TOKEN_DEFAULTS.motionShort3, TOKEN_DEFAULTS.animationDurationShort3);
  }

  private clearTransitionWork() {
    if (this.transitionTimer) clearTimeout(this.transitionTimer);
    this.transitionTimer = null;
  }

  private startOpen() {
    this.clearTransitionWork();
    this.closePending = false;
    this.rendered = true;
    this.phase = 'open';
  }

  private startClose() {
    this.clearTransitionWork();
    if (!this.rendered || this.phase === 'closed') {
      this.rendered = false;
      return;
    }

    this.closePending = true;
    this.phase = 'closing';
    const duration = this.closeMotionMs;
    if (duration <= 0) {
      this.finishClose();
      return;
    }
    this.transitionTimer = setTimeout(() => {
      this.transitionTimer = null;
      this.finishClose();
    }, duration);
  }

  private finishClose() {
    if (this.open || !this.closePending) return;
    this.closePending = false;
    this.rendered = false;
    this.phase = 'closed';
    this.dsAfterClose.emit();
  }

  private updateActionsPresence(slot?: HTMLSlotElement) {
    const actions = slot
      ? slot.assignedElements().filter(element => element.tagName === 'DS-BUTTON-UNFILLED')
      : Array.from(this.el.querySelectorAll('ds-button-unfilled[slot="actions"]'));
    this.hasActions = actions.length > 0;
  }

  private requestClose(event: CustomEvent<MouseEvent>) {
    if (!this.open || this.phase === 'closing') return;
    this.dsClose.emit(event.detail);
  }

  private get role(): 'status' | 'alert' | undefined {
    if (this.announcement === 'polite') return 'status';
    if (this.announcement === 'assertive') return 'alert';
    return undefined;
  }

  private get ariaLive(): 'polite' | 'assertive' | undefined {
    return this.announcement === 'none' ? undefined : this.announcement;
  }

  render() {
    const closing = this.phase === 'closing';
    const hostClass = {
      banner: true,
      'banner--open': this.phase === 'open',
      'banner--closing': closing,
      'banner--hidden': !this.rendered,
      'banner--has-actions': this.hasActions,
      [`banner--orientation-${this.orientation}`]: true,
      [`banner--intent-${this.intent}`]: true,
      [`banner--contrast-${this.contrast}`]: true,
    };

    return (
      <Host class={hostClass}>
        <div class="banner-overflow">
          <section
            class="banner-surface ds-chrome-header ds-chrome-header--wrapping"
            role={this.role}
            aria-live={this.ariaLive}
            aria-atomic={this.announcement === 'none' ? undefined : 'true'}
            aria-hidden={closing ? 'true' : undefined}
            inert={closing ? true : undefined}
            data-phase={this.phase}
          >
            {/* eslint-disable-next-line local/prefer-direct-ds-text -- The header-copy lane owns the 6px container inset separately from the inline text flow's 2px inset. */}
            <div class="banner-copy ds-chrome-header__copy ds-chrome-header__copy--wrapping ds-control--md">
              <ds-text class="banner-copy-flow" as="div" variant="text-body-medium" color="inherit">
                {this.heading && (
                  <ds-text
                    class="banner-heading"
                    as="span"
                    variant="text-title-small"
                    color="inherit"
                  >
                    {this.heading}
                  </ds-text>
                )}
                <span class="banner-description">{this.description}</span>
              </ds-text>
            </div>
            <div class="banner-trailing ds-chrome-header__trailing">
              <div class={{ 'banner-actions': true, 'banner-actions--empty': !this.hasActions }}>
                <slot
                  name="actions"
                  onSlotchange={(event: Event) =>
                    this.updateActionsPresence(event.currentTarget as HTMLSlotElement)
                  }
                />
              </div>
              <div class="banner-dismiss">
                <ds-tooltip label={this.dismissLabel} side="bottom" size="sm">
                  <ds-button-unfilled
                    class="banner-close"
                    variant="icon"
                    icon="Cross"
                    size="md"
                    type="button"
                    background={this.contrast}
                    aria-label={this.dismissLabel}
                    hasBorder={false}
                    activeFill={false}
                    onDsClick={(event: CustomEvent<MouseEvent>) => this.requestClose(event)}
                  />
                </ds-tooltip>
              </div>
            </div>
          </section>
        </div>
      </Host>
    );
  }
}
