import { Component, Prop, State, Element, Watch, h, Host } from '@stencil/core';

export type TooltipSide = 'top' | 'right' | 'bottom' | 'left';
export type TooltipAlign = 'start' | 'center' | 'end';

const HOVER_DELAY_MS = 600;
const INSTANT_REOPEN_MS = 300;
const FADE_OUT_MS = 200;
const VP_PAD = 4;

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
  @Prop() sideOffset: number = 4;
  @Prop() alignOffset: number = 0;
  @Prop() delay: number = HOVER_DELAY_MS;
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
  onPositionPropsChange() {
    if (this.visible) this.calculatePosition();
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
    const instant = Date.now() - lastDismissedAt < INSTANT_REOPEN_MS;
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
    }, this.delay);
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
    }, FADE_OUT_MS);
  }

  private calculatePosition() {
    if (!this.anchor) return;
    const tip = this.el.querySelector('.tooltip-popup') as HTMLElement | null;
    if (!tip) return;
    const a = this.anchor.getBoundingClientRect();
    const tw = tip.offsetWidth || 80;
    const th = tip.offsetHeight || 24;
    let x = 0, y = 0;

    switch (this.side) {
      case 'top':
        y = a.top - th - this.sideOffset;
        x = this.align === 'start' ? a.left + this.alignOffset
          : this.align === 'end' ? a.right - tw + this.alignOffset
          : a.left + a.width / 2 - tw / 2 + this.alignOffset;
        break;
      case 'bottom':
        y = a.bottom + this.sideOffset;
        x = this.align === 'start' ? a.left + this.alignOffset
          : this.align === 'end' ? a.right - tw + this.alignOffset
          : a.left + a.width / 2 - tw / 2 + this.alignOffset;
        break;
      case 'left':
        x = a.left - tw - this.sideOffset;
        y = this.align === 'start' ? a.top + this.alignOffset
          : this.align === 'end' ? a.bottom - th + this.alignOffset
          : a.top + a.height / 2 - th / 2 + this.alignOffset;
        break;
      case 'right':
        x = a.right + this.sideOffset;
        y = this.align === 'start' ? a.top + this.alignOffset
          : this.align === 'end' ? a.bottom - th + this.alignOffset
          : a.top + a.height / 2 - th / 2 + this.alignOffset;
        break;
    }

    this.pos = {
      x: Math.min(Math.max(x, VP_PAD), window.innerWidth - tw - VP_PAD),
      y: Math.min(Math.max(y, VP_PAD), window.innerHeight - th - VP_PAD),
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
