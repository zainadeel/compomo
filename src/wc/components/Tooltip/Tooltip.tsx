import { Component, Prop, State, Element, Watch, h, Host } from '@stencil/core';
import { resolveCssLengthPx, resolveCssTimeMs, TOKEN_DEFAULTS } from '../../utils';

export type TooltipSide = 'top' | 'right' | 'bottom' | 'left';
export type TooltipAlign = 'start' | 'center' | 'end';

let lastDismissedAt = 0;
let tooltipIdCounter = 0;

@Component({
  tag: 'ds-tooltip',
  styleUrl: 'Tooltip.css',
  scoped: true,
})
export class Tooltip {
  @Element() el!: HTMLElement;

  @Prop() label!: string;
  @Prop() side: TooltipSide = 'top';
  @Prop() align: TooltipAlign = 'center';
  /** Gap between anchor and tooltip — number (px) or TokoMo length. */
  @Prop() sideOffset: number | string = TOKEN_DEFAULTS.space050;
  /** Cross-axis offset — number (px) or TokoMo length. */
  @Prop() alignOffset: number | string = 0;
  /** Show delay — number (ms) or TokoMo time token / `var(--effect-animation-delay-*)`. */
  @Prop() delay: number | string = TOKEN_DEFAULTS.animationDelayMedium1;
  @Prop() shortcutKey: string | undefined;
  @Prop() shortcutKeyPosition: 'start' | 'end' = 'end';

  @State() private visible: boolean = false;
  @State() private closing: boolean = false;
  @State() private pos: { x: number; y: number } = { x: 0, y: 0 };

  private tooltipId = `ds-tooltip-${++tooltipIdCounter}`;
  private delayTimer: ReturnType<typeof setTimeout> | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private anchor: HTMLElement | null = null;
  private tooltipEl: HTMLElement | null = null;
  private mouseEnterHandler: () => void = () => this.show();
  private mouseLeaveHandler: () => void = () => this.hide();
  private focusHandler: () => void = () => this.show();
  private blurHandler: () => void = () => this.hide();

  componentDidLoad() {
    this.bindAnchor();
  }

  disconnectedCallback() {
    this.unbindAnchor();
    this.clearTimers();
  }

  @Watch('label')
  @Watch('side')
  @Watch('align')
  @Watch('sideOffset')
  @Watch('alignOffset')
  onPositionPropsChange() {
    if (this.visible) this.calculatePosition();
  }

  private get viewportPadPx(): number {
    return resolveCssLengthPx(TOKEN_DEFAULTS.space050, TOKEN_DEFAULTS.space050);
  }

  private get sideOffsetPx(): number {
    return resolveCssLengthPx(this.sideOffset, TOKEN_DEFAULTS.space050);
  }

  private get alignOffsetPx(): number {
    return resolveCssLengthPx(this.alignOffset, 0);
  }

  private get hoverDelayMs(): number {
    return resolveCssTimeMs(this.delay, TOKEN_DEFAULTS.animationDelayMedium1);
  }

  private get instantReopenMs(): number {
    return resolveCssTimeMs(
      TOKEN_DEFAULTS.animationDurationMedium1,
      TOKEN_DEFAULTS.animationDurationMedium1,
    );
  }

  private get fadeOutMs(): number {
    return resolveCssTimeMs(TOKEN_DEFAULTS.motionShort3, TOKEN_DEFAULTS.animationDurationShort3);
  }

  private get tooltipFallbackWidthPx(): number {
    return resolveCssLengthPx(TOKEN_DEFAULTS.tooltipFallbackWidth, TOKEN_DEFAULTS.tooltipFallbackWidth);
  }

  private get tooltipFallbackHeightPx(): number {
    return resolveCssLengthPx(TOKEN_DEFAULTS.size300, TOKEN_DEFAULTS.size300);
  }

  private bindAnchor() {
    const slot = this.el.querySelector('slot') as HTMLSlotElement | null;
    const slotted = slot?.assignedElements?.() ?? [];
    const child = (slotted[0] ?? this.el.firstElementChild) as HTMLElement | null;
    if (!child) return;
    this.anchor = child;
    child.setAttribute('aria-describedby', this.tooltipId);
    child.addEventListener('mouseenter', this.mouseEnterHandler);
    child.addEventListener('mouseleave', this.mouseLeaveHandler);
    child.addEventListener('focus', this.focusHandler);
    child.addEventListener('blur', this.blurHandler);
  }

  private unbindAnchor() {
    if (!this.anchor) return;
    this.anchor.removeAttribute('aria-describedby');
    this.anchor.removeEventListener('mouseenter', this.mouseEnterHandler);
    this.anchor.removeEventListener('mouseleave', this.mouseLeaveHandler);
    this.anchor.removeEventListener('focus', this.focusHandler);
    this.anchor.removeEventListener('blur', this.blurHandler);
    this.anchor = null;
  }

  private clearTimers() {
    if (this.delayTimer) { clearTimeout(this.delayTimer); this.delayTimer = null; }
    if (this.closeTimer) { clearTimeout(this.closeTimer); this.closeTimer = null; }
  }

  private show() {
    this.clearTimers();
    const instant = Date.now() - lastDismissedAt < this.instantReopenMs;
    if (instant) {
      this.closing = false;
      this.visible = true;
      requestAnimationFrame(() => this.calculatePosition());
      return;
    }
    this.delayTimer = setTimeout(() => {
      this.delayTimer = null;
      this.closing = false;
      this.visible = true;
      requestAnimationFrame(() => this.calculatePosition());
    }, this.hoverDelayMs);
  }

  private hide() {
    this.clearTimers();
    if (!this.visible) return;
    lastDismissedAt = Date.now();
    this.closing = true;
    this.closeTimer = setTimeout(() => {
      this.closeTimer = null;
      this.visible = false;
      this.closing = false;
    }, this.fadeOutMs);
  }

  private calculatePosition() {
    if (!this.anchor) return;
    const tip = this.el.querySelector('.tooltip-popup') as HTMLElement | null;
    if (!tip) return;
    const a = this.anchor.getBoundingClientRect();
    const tw = tip.offsetWidth || this.tooltipFallbackWidthPx;
    const th = tip.offsetHeight || this.tooltipFallbackHeightPx;
    const sideOffset = this.sideOffsetPx;
    const alignOffset = this.alignOffsetPx;
    const vpPad = this.viewportPadPx;
    let x = 0, y = 0;

    switch (this.side) {
      case 'top':
        y = a.top - th - sideOffset;
        x = this.align === 'start' ? a.left + alignOffset
          : this.align === 'end' ? a.right - tw + alignOffset
          : a.left + a.width / 2 - tw / 2 + alignOffset;
        break;
      case 'bottom':
        y = a.bottom + sideOffset;
        x = this.align === 'start' ? a.left + alignOffset
          : this.align === 'end' ? a.right - tw + alignOffset
          : a.left + a.width / 2 - tw / 2 + alignOffset;
        break;
      case 'left':
        x = a.left - tw - sideOffset;
        y = this.align === 'start' ? a.top + alignOffset
          : this.align === 'end' ? a.bottom - th + alignOffset
          : a.top + a.height / 2 - th / 2 + alignOffset;
        break;
      case 'right':
        x = a.right + sideOffset;
        y = this.align === 'start' ? a.top + alignOffset
          : this.align === 'end' ? a.bottom - th + alignOffset
          : a.top + a.height / 2 - th / 2 + alignOffset;
        break;
    }

    this.pos = {
      x: Math.min(Math.max(x, vpPad), window.innerWidth - tw - vpPad),
      y: Math.min(Math.max(y, vpPad), window.innerHeight - th - vpPad),
    };
  }

  render() {
    return (
      <Host style={{ display: 'contents' }}>
        <slot />
        {(this.visible || this.closing) && (
          <div
            id={this.tooltipId}
            class={{ 'tooltip-popup': true, 'tooltip-popup--closing': this.closing }}
            role="tooltip"
            style={{
              position: 'fixed',
              left: '0',
              top: '0',
              transform: `translate(${Math.round(this.pos.x)}px, ${Math.round(this.pos.y)}px)`,
              zIndex: '10000',
              pointerEvents: 'none',
            }}
          >
            <div class="tooltip-inner">
              {this.shortcutKey && this.shortcutKeyPosition === 'start' && (
                <div class="key-hint" aria-hidden="true">
                  <span class="text-caption-emphasis">{this.shortcutKey}</span>
                </div>
              )}
              <span class="text-body-small">{this.label}</span>
              {this.shortcutKey && this.shortcutKeyPosition === 'end' && (
                <div class="key-hint" aria-hidden="true">
                  <span class="text-caption-emphasis">{this.shortcutKey}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Host>
    );
  }
}
