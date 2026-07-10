import { Component, Prop, Element, Watch, h, Host } from '@stencil/core';
import { resolveCssLengthPx, resolveCssTimeMs, TOKEN_CSS_LENGTHS, TOKEN_DEFAULTS } from '../../utils';

export type TooltipSide = 'top' | 'right' | 'bottom' | 'left';
export type TooltipAlign = 'start' | 'center' | 'end';
export type TooltipSize = 'md' | 'sm' | 'xs';

/** Body text per control-density size (regular weight — not emphasis). */
const TEXT_VARIANT: Record<TooltipSize, string> = {
  md: 'text-body-medium',
  sm: 'text-body-small',
  xs: 'text-caption',
};

const LINE_HEIGHT: Record<TooltipSize, string> = {
  md: 'var(--typography-lineheight-md)',
  sm: 'var(--typography-lineheight-sm)',
  xs: 'var(--typography-lineheight-xs)',
};

const FALLBACK_HEIGHT: Record<TooltipSize, string> = {
  md: TOKEN_DEFAULTS.size400,
  sm: TOKEN_DEFAULTS.size300,
  xs: TOKEN_DEFAULTS.size200,
};

let lastDismissedAt = 0;
let tooltipIdCounter = 0;
/** Currently open tooltip — force-cleared on warm handoff so tips don't cross-fade. */
let activeTooltip: Tooltip | null = null;

/**
 * Imperative body portal for the popup.
 * Stencil must not own the portaled node — moving a VDOM child to `document.body`
 * causes recreate → re-portal → @State loops that freeze the page.
 */
@Component({
  tag: 'ds-tooltip',
  styleUrl: 'Tooltip.css',
  scoped: true,
})
export class Tooltip {
  @Element() el!: HTMLElement;

  /**
   * Tooltip text. Empty/whitespace skips show — useful when the wrapper must stay
   * mounted for layout/animation stability (e.g. PanelNav expand/collapse).
   */
  @Prop() label!: string;

  /** Control density (height, padding, type). */
  @Prop() size: TooltipSize = 'md';

  @Prop() side: TooltipSide = 'top';
  @Prop() align: TooltipAlign = 'center';
  /** Gap between anchor and tooltip — number (px) or TokoMo length. */
  @Prop() sideOffset: number | string = TOKEN_CSS_LENGTHS.space050;
  /** Cross-axis offset — number (px) or TokoMo length. */
  @Prop() alignOffset: number | string = 0;
  /**
   * Hover show delay before the tooltip appears.
   * Default: `--effect-animation-delay-medium-3` (1000ms). Accepts a number (ms)
   * or a TokoMo time token / `var(--effect-animation-delay-*)`. Applies to the
   * initial hover/focus show only — after a recent dismiss, reopen is instant.
   * Prefer the default; override only for denser chrome or rare/destructive actions.
   */
  @Prop() delay: number | string = TOKEN_DEFAULTS.animationDelayMedium3;
  @Prop() shortcutKey: string | undefined;
  @Prop() shortcutKeyPosition: 'start' | 'end' = 'end';

  private tooltipId = `ds-tooltip-${++tooltipIdCounter}`;
  private delayTimer: ReturnType<typeof setTimeout> | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private anchor: HTMLElement | null = null;
  private popupEl: HTMLElement | null = null;
  private skipEnterAnimation = false;
  private isOpen = false;
  private mouseEnterHandler: () => void = () => this.show();
  private mouseLeaveHandler: () => void = () => this.hide();
  /** focusin/focusout so nested focus targets (e.g. ds-button-* inner button) still open the tip. */
  private focusHandler: () => void = () => this.show();
  private blurHandler: (e: FocusEvent) => void = (e) => {
    const next = e.relatedTarget as Node | null;
    if (next && this.anchor?.contains(next)) return;
    this.hide();
  };

  componentDidLoad() {
    this.bindAnchor();
  }

  disconnectedCallback() {
    if (activeTooltip === this) activeTooltip = null;
    this.unbindAnchor();
    this.clearTimers();
    this.destroyPopup();
  }

  @Watch('label')
  @Watch('size')
  @Watch('side')
  @Watch('align')
  @Watch('sideOffset')
  @Watch('alignOffset')
  @Watch('shortcutKey')
  @Watch('shortcutKeyPosition')
  onContentOrPositionChange() {
    if (!this.label?.trim()) {
      if (this.isOpen || this.popupEl) this.hideInstant();
      return;
    }
    if (!this.popupEl || !this.isOpen) return;
    this.renderPopupContent();
    this.calculatePosition();
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
    return resolveCssTimeMs(this.delay, TOKEN_DEFAULTS.animationDelayMedium3);
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
    const token = FALLBACK_HEIGHT[this.size];
    return resolveCssLengthPx(token, token);
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
    child.addEventListener('focusin', this.focusHandler);
    child.addEventListener('focusout', this.blurHandler);
  }

  private unbindAnchor() {
    if (!this.anchor) return;
    this.anchor.removeAttribute('aria-describedby');
    this.anchor.removeEventListener('mouseenter', this.mouseEnterHandler);
    this.anchor.removeEventListener('mouseleave', this.mouseLeaveHandler);
    this.anchor.removeEventListener('focusin', this.focusHandler);
    this.anchor.removeEventListener('focusout', this.blurHandler);
    this.anchor = null;
  }

  private clearTimers() {
    if (this.delayTimer) { clearTimeout(this.delayTimer); this.delayTimer = null; }
    if (this.closeTimer) { clearTimeout(this.closeTimer); this.closeTimer = null; }
  }

  private destroyPopup() {
    if (!this.popupEl) return;
    this.popupEl.remove();
    this.popupEl = null;
  }

  /** Drop the open tip immediately (warm handoff to another tooltip). */
  private hideInstant() {
    this.clearTimers();
    lastDismissedAt = Date.now();
    if (activeTooltip === this) activeTooltip = null;
    this.destroyPopup();
    this.isOpen = false;
    this.skipEnterAnimation = false;
  }

  private show() {
    // Empty label = wrapper present for DOM stability (e.g. PanelNav expand/collapse)
    // but no tip should appear.
    if (!this.label?.trim()) return;
    this.clearTimers();
    let instant = Date.now() - lastDismissedAt < this.instantReopenMs;
    if (activeTooltip && activeTooltip !== this) {
      activeTooltip.hideInstant();
      instant = true;
    }
    activeTooltip = this;
    this.skipEnterAnimation = instant;
    if (instant) {
      this.mountPopup();
      return;
    }
    this.delayTimer = setTimeout(() => {
      this.delayTimer = null;
      if (!this.label?.trim()) return;
      this.mountPopup();
    }, this.hoverDelayMs);
  }

  private hide() {
    this.clearTimers();
    if (!this.popupEl && !this.isOpen) return;
    lastDismissedAt = Date.now();
    if (activeTooltip === this) activeTooltip = null;
    if (!this.popupEl) {
      this.isOpen = false;
      return;
    }
    this.popupEl.classList.remove('tooltip-popup--instant');
    this.popupEl.classList.add('tooltip-popup--closing');
    this.closeTimer = setTimeout(() => {
      this.closeTimer = null;
      this.destroyPopup();
      this.isOpen = false;
      this.skipEnterAnimation = false;
    }, this.fadeOutMs);
  }

  private mountPopup() {
    if (!this.popupEl) {
      const tip = document.createElement('div');
      tip.id = this.tooltipId;
      tip.setAttribute('role', 'tooltip');
      // `sc-ds-tooltip` is required for Stencil scoped CSS to match outside the host.
      tip.className = 'tooltip-popup sc-ds-tooltip';
      Object.assign(tip.style, {
        position: 'fixed',
        left: '0',
        top: '0',
        zIndex: 'var(--dimension-z-index-tooltip)',
        pointerEvents: 'none',
      });
      document.body.appendChild(tip);
      this.popupEl = tip;
    }

    this.popupEl.classList.toggle('tooltip-popup--instant', this.skipEnterAnimation);
    this.popupEl.classList.remove('tooltip-popup--closing');
    this.renderPopupContent();
    this.calculatePosition();
    this.isOpen = true;
  }

  private renderPopupContent() {
    if (!this.popupEl) return;
    const textVariant = TEXT_VARIANT[this.size];
    const lineHeight = LINE_HEIGHT[this.size];
    const density =
      this.size === 'md' ? 'ds-control--md' : this.size === 'sm' ? 'ds-control--sm' : 'ds-control--xs';
    // Every node needs `sc-ds-tooltip` so scoped selectors (`.foo.sc-ds-tooltip`) match.
    const sc = 'sc-ds-tooltip';

    const startKey =
      this.shortcutKey && this.shortcutKeyPosition === 'start'
        ? `<div class="key-hint ${sc}" aria-hidden="true"><span class="text-caption-emphasis ${sc}">${escapeHtml(this.shortcutKey)}</span></div>`
        : '';
    const endKey =
      this.shortcutKey && this.shortcutKeyPosition === 'end'
        ? `<div class="key-hint ${sc}" aria-hidden="true"><span class="text-caption-emphasis ${sc}">${escapeHtml(this.shortcutKey)}</span></div>`
        : '';

    this.popupEl.innerHTML =
      `<div class="tooltip-inner ${density} ${sc}">` +
      startKey +
      `<span class="tooltip-label ${textVariant} ${sc}" style="line-height:${lineHeight}">${escapeHtml(this.label)}</span>` +
      endKey +
      `</div>`;
  }

  private calculatePosition() {
    if (!this.anchor || !this.popupEl) return;
    const tip = this.popupEl;
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

    const nextX = Math.min(Math.max(x, vpPad), window.innerWidth - tw - vpPad);
    const nextY = Math.min(Math.max(y, vpPad), window.innerHeight - th - vpPad);
    tip.style.transform = `translate(${Math.round(nextX)}px, ${Math.round(nextY)}px)`;
  }

  render() {
    return (
      <Host style={{ display: 'contents' }}>
        <slot />
      </Host>
    );
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
