import { Component, Prop, State, Element, Watch, h, Host } from '@stencil/core';
import { resolveCssTimeMs, TOKEN_DEFAULTS } from '../../utils';

const CURSOR_OFFSET_PX = 12;
const VIEWPORT_PAD_PX = 8;

export type TooltipDataVizSide = 'left' | 'right';
export type TooltipDataVizAlign = 'top' | 'bottom';

/**
 * Positioned value/label callout for chart hover interactions (donut slice, bar,
 * line point, ...). Unlike `ds-tooltip`, this doesn't bind to a slotted anchor element —
 * charts hover-highlight data that lives inside an SVG, so the chart itself computes
 * the anchor point (e.g. the cursor position while hovering) and passes it in as `x`/`y`.
 *
 * Renders `position: absolute` — place inside a `position: relative` chart wrapper,
 * with `x`/`y` as pixel coordinates within that wrapper. Defaults to sitting below-right
 * of the anchor (matching cursor-following tooltips), flipping to whichever side/edge
 * keeps it on-screen.
 *
 * Mount (or remount) when a hover session starts so `delay` applies once per hover;
 * keep the instance mounted while the cursor moves so tracking stays instant.
 */
@Component({
  tag: 'ds-tooltip-data-viz',
  styleUrl: 'TooltipDataViz.css',
  scoped: true,
})
export class TooltipDataViz {
  @Element() el!: HTMLElement;

  @Prop() value: string | number = '';
  @Prop() label: string = '';
  /** Anchor point in px, relative to the nearest `position: relative` ancestor — e.g. the cursor. */
  @Prop() x: number = 0;
  @Prop() y: number = 0;

  /**
   * Show delay after mount before the callout appears.
   * Default: `--effect-animation-delay-instant` (0ms). Accepts a number (ms)
   * or a TokoMo time token / `var(--effect-animation-delay-*)`. Charts need
   * immediate feedback while scrubbing; prefer the default. Mount once per
   * hover session so any non-zero delay runs once, then track `x`/`y` instantly.
   */
  @Prop() delay: number | string = TOKEN_DEFAULTS.animationDelayInstant;

  @State() private side: TooltipDataVizSide = 'right';
  @State() private align: TooltipDataVizAlign = 'bottom';
  @State() private visible: boolean = false;

  private delayTimer: ReturnType<typeof setTimeout> | null = null;

  componentDidLoad() {
    this.scheduleShow();
    this.calculatePlacement();
  }

  disconnectedCallback() {
    this.clearDelayTimer();
  }

  @Watch('x')
  @Watch('y')
  onAnchorChange() {
    requestAnimationFrame(() => this.calculatePlacement());
  }

  @Watch('delay')
  onDelayChange() {
    if (!this.visible) this.scheduleShow();
  }

  private get showDelayMs(): number {
    return resolveCssTimeMs(this.delay, TOKEN_DEFAULTS.animationDelayInstant);
  }

  private clearDelayTimer() {
    if (this.delayTimer) {
      clearTimeout(this.delayTimer);
      this.delayTimer = null;
    }
  }

  private scheduleShow() {
    this.clearDelayTimer();
    this.visible = false;
    const ms = this.showDelayMs;
    if (ms <= 0) {
      this.visible = true;
      return;
    }
    this.delayTimer = setTimeout(() => {
      this.delayTimer = null;
      this.visible = true;
      requestAnimationFrame(() => this.calculatePlacement());
    }, ms);
  }

  private calculatePlacement() {
    const rect = this.el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const nextSide: TooltipDataVizSide = rect.right > window.innerWidth - VIEWPORT_PAD_PX ? 'left' : 'right';
    const nextAlign: TooltipDataVizAlign = rect.bottom > window.innerHeight - VIEWPORT_PAD_PX ? 'top' : 'bottom';

    if (nextSide !== this.side) this.side = nextSide;
    if (nextAlign !== this.align) this.align = nextAlign;
  }

  render() {
    const translateX = this.side === 'right' ? `${CURSOR_OFFSET_PX}px` : `calc(-100% - ${CURSOR_OFFSET_PX}px)`;
    const translateY = this.align === 'bottom' ? `${CURSOR_OFFSET_PX}px` : `calc(-100% - ${CURSOR_OFFSET_PX}px)`;

    return (
      <Host
        class={{
          'tooltip-data-viz': true,
          'tooltip-data-viz--visible': this.visible,
        }}
        style={{ left: `${this.x}px`, top: `${this.y}px`, transform: `translate(${translateX}, ${translateY})` }}
      >
        <div class="tooltip-data-viz__item ds-control--md">
          <span class="tooltip-data-viz__label">
            <ds-text as="span" variant="text-body-medium" color="var(--color-foreground-on-translucent-background-secondary)">
              {this.label}
            </ds-text>
          </span>
          <span class="tooltip-data-viz__value">
            <ds-text as="span" variant="text-body-medium" emphasis color="var(--color-foreground-on-translucent-background-primary)">
              {this.value}
            </ds-text>
          </span>
        </div>
      </Host>
    );
  }
}
