import { Component, Prop, Element, Method, Watch, h, Host } from '@stencil/core';
import {
  CONTROL_TEXT_VARIANT,
  resolveCssLengthPx,
  resolveCssTimeMs,
  resolveMotionTimeMs,
  TOKEN_CSS_LENGTHS,
  TOKEN_DEFAULTS,
} from '../../utils';
import type { TextVariant } from '../Text/text-types';
import { shortcutKeyLabels } from '../../utils/shortcut-key';
import { AnchoredPositionController } from '../../utils/anchored-position-controller';
import { resolveAnchoredOverlayBoundaryRect } from '../../utils/anchored-overlay-boundary';
// Side-effect: register `ds-text` — the portal builds it via createElement, not JSX.
import '../Text/Text';

export type TooltipSide = 'top' | 'right' | 'bottom' | 'left';
export type TooltipAlign = 'start' | 'center' | 'end';
export type TooltipSize = 'md' | 'sm' | 'xs';

const FALLBACK_HEIGHT: Record<TooltipSize, string> = {
  md: TOKEN_DEFAULTS.size400,
  sm: TOKEN_DEFAULTS.size300,
  xs: TOKEN_DEFAULTS.size200,
};

let lastDismissedAt = 0;
let tooltipIdCounter = 0;
/** Currently open tooltip — force-cleared on warm handoff so tips don't cross-fade. */
let activeTooltip: Tooltip | null = null;

type DsTextEl = HTMLElement & {
  as: string;
  variant: TextVariant;
  emphasis: boolean;
  color: string;
  wrap: string;
};

function createDsText(opts: {
  variant: TextVariant;
  emphasis?: boolean;
  color?: string;
  wrap?: 'wrap' | 'nowrap' | 'balance' | 'pretty';
  text: string;
}): DsTextEl {
  const el = document.createElement('ds-text') as DsTextEl;
  el.as = 'span';
  el.variant = opts.variant;
  el.emphasis = opts.emphasis ?? false;
  el.color = opts.color ?? 'inherit';
  if (opts.wrap) el.wrap = opts.wrap;
  el.textContent = opts.text;
  return el;
}

/**
 * Control-density label styles for portaled ds-text.
 * Scoped CSS requires `sc-ds-tooltip` on the host, but Text's `<Host class>`
 * overwrites imperative className — so these must be inline to stick.
 */
function styleTooltipLabel(el: HTMLElement, wrapLabel = false) {
  el.style.flexShrink = wrapLabel ? '1' : '0';
  el.style.minWidth = wrapLabel ? '0' : 'max-content';
  el.style.maxWidth = wrapLabel ? '100%' : 'none';
  el.style.whiteSpace = wrapLabel ? 'normal' : '';
  el.style.padding = '0 var(--ds-control-label-inset, var(--dimension-space-025))';
  el.style.color = 'var(--color-foreground-primary)';
}

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
  /** Explicit collision owner; otherwise the nearest data-ds-overlay-boundary ancestor is used. */
  @Prop() boundary: HTMLElement | undefined;
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
  /**
   * Link the trigger with aria-describedby while the popup is open. Disable when
   * the label is already in the DOM, such as a truncated table cell.
   */
  @Prop() describedBy = true;
  /** Allow the label to wrap at a panel-xs max width instead of a single line. */
  @Prop() wrapLabel = false;

  private tooltipId = `ds-tooltip-${++tooltipIdCounter}`;
  private delayTimer: ReturnType<typeof setTimeout> | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private anchor: HTMLElement | null = null;
  private popupEl: HTMLElement | null = null;
  private anchorObserver: MutationObserver | null = null;
  private didLoad = false;
  private readonly position = new AnchoredPositionController({
    getAnchor: () => this.anchor,
    getPopup: () => this.popupEl,
    measure: (anchor, tip) => ({
      anchorRect: anchor.getBoundingClientRect(),
      // Fall back to token metrics until `ds-text` upgrades and reports a width.
      popupWidth: tip.offsetWidth || this.tooltipFallbackWidthPx,
      popupHeight: tip.offsetHeight || this.tooltipFallbackHeightPx,
      side: this.side,
      align: this.align,
      sideOffsetPx: this.sideOffsetPx,
      alignOffsetPx: this.alignOffsetPx,
      viewportPadPx: this.viewportPadPx,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      collisionRect: resolveAnchoredOverlayBoundaryRect(anchor, this.boundary),
    }),
    apply: ({ x, y, resolvedSide }) => {
      if (!this.popupEl) return;
      this.popupEl.dataset.side = resolvedSide;
      this.popupEl.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    },
    liveUpdate: 'frame',
    observeResize: true,
  });
  private skipEnterAnimation = false;
  private isOpen = false;
  private programmaticAnchor = false;
  private lastInteractionWasKeyboard = false;
  private pointerEnterHandler = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    this.show();
  };
  private pointerLeaveHandler = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    this.hide();
  };
  private pointerDownHandler = (event: PointerEvent) => {
    this.lastInteractionWasKeyboard = false;
    if (event.pointerType === 'touch' && (this.isOpen || this.popupEl)) this.hideInstant();
  };
  private keyDownHandler = () => {
    this.lastInteractionWasKeyboard = true;
  };
  /** focusin/focusout so nested focus targets (e.g. ds-button-* inner button) still open the tip. */
  private focusHandler = () => {
    if (this.lastInteractionWasKeyboard || this.anchor?.matches(':focus-visible')) this.show();
  };
  private blurHandler: (e: FocusEvent) => void = (e) => {
    const next = e.relatedTarget as Node | null;
    if (next && this.anchor?.contains(next)) return;
    this.hide();
  };
  private escapeHandler = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !this.isOpen) return;
    event.preventDefault();
    this.hide();
  };

  connectedCallback() {
    if (!this.didLoad) return;
    this.connectAnchor();
  }

  componentDidLoad() {
    this.didLoad = true;
    this.connectAnchor();
  }

  private connectAnchor() {
    this.bindAnchor();
    if (this.anchorObserver) return;
    this.anchorObserver = new MutationObserver(() => this.handleSlotChange());
    this.anchorObserver.observe(this.el, { childList: true });
  }

  disconnectedCallback() {
    if (activeTooltip === this) activeTooltip = null;
    this.anchorObserver?.disconnect();
    this.anchorObserver = null;
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
  @Watch('boundary')
  @Watch('shortcutKey')
  @Watch('shortcutKeyPosition')
  @Watch('wrapLabel')
  onContentOrPositionChange() {
    if (!this.label?.trim()) {
      if (this.isOpen || this.popupEl) this.hideInstant();
      return;
    }
    if (!this.popupEl || !this.isOpen) return;
    this.renderPopupContent();
    this.schedulePosition();
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
    return resolveMotionTimeMs(TOKEN_DEFAULTS.motionShort3, TOKEN_DEFAULTS.animationDurationShort3);
  }

  private get tooltipFallbackWidthPx(): number {
    return resolveCssLengthPx(TOKEN_DEFAULTS.tooltipFallbackWidth, TOKEN_DEFAULTS.tooltipFallbackWidth);
  }

  private get tooltipFallbackHeightPx(): number {
    const token = FALLBACK_HEIGHT[this.size];
    return resolveCssLengthPx(token, token);
  }

  /**
   * Present against an external anchor the host already measured.
   * Does not bind hover or focus on that anchor — the owner drives show/hide.
   */
  @Method()
  async presentFrom(anchor: HTMLElement, label?: string) {
    if (label != null) this.label = label;
    if (!this.label?.trim()) {
      this.hide();
      return;
    }
    const sameAnchor = this.anchor === anchor;
    if (!sameAnchor) {
      this.unbindAnchor();
      this.anchor = anchor;
      this.programmaticAnchor = true;
      if (this.popupEl && this.describedBy) this.linkDescribedBy();
    }
    if (this.popupEl) {
      this.renderPopupContent();
      this.schedulePosition();
      return;
    }
    if (this.delayTimer && sameAnchor) return;
    this.show();
  }

  /** Dismiss a popup opened through presentFrom or the slotted trigger. */
  @Method()
  async dismiss() {
    this.hide();
  }

  private bindAnchor() {
    if (this.programmaticAnchor) return;
    const slot = this.el.querySelector('slot') as HTMLSlotElement | null;
    const slotted = slot?.assignedElements?.() ?? [];
    const child = (slotted[0] ?? this.el.firstElementChild) as HTMLElement | null;
    if (!child || child.tagName === 'SLOT' || child === this.anchor) return;
    this.anchor = child;
    child.addEventListener('pointerenter', this.pointerEnterHandler);
    child.addEventListener('pointerleave', this.pointerLeaveHandler);
    child.addEventListener('pointerdown', this.pointerDownHandler);
    child.addEventListener('keydown', this.keyDownHandler);
    child.addEventListener('focusin', this.focusHandler);
    child.addEventListener('focusout', this.blurHandler);
  }

  private unbindAnchor() {
    if (!this.anchor) return;
    this.unlinkDescribedBy();
    if (!this.programmaticAnchor) {
      this.anchor.removeEventListener('pointerenter', this.pointerEnterHandler);
      this.anchor.removeEventListener('pointerleave', this.pointerLeaveHandler);
      this.anchor.removeEventListener('pointerdown', this.pointerDownHandler);
      this.anchor.removeEventListener('keydown', this.keyDownHandler);
      this.anchor.removeEventListener('focusin', this.focusHandler);
      this.anchor.removeEventListener('focusout', this.blurHandler);
    }
    this.anchor = null;
    this.programmaticAnchor = false;
  }

  private linkDescribedBy() {
    if (!this.describedBy || !this.anchor || !this.popupEl) return;
    const ids = new Set((this.anchor.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean));
    ids.add(this.tooltipId);
    this.anchor.setAttribute('aria-describedby', Array.from(ids).join(' '));
  }

  private unlinkDescribedBy() {
    if (!this.anchor) return;
    const ids = (this.anchor.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .filter(id => id && id !== this.tooltipId);
    if (ids.length) this.anchor.setAttribute('aria-describedby', ids.join(' '));
    else this.anchor.removeAttribute('aria-describedby');
  }

  private handleSlotChange = () => {
    if (this.programmaticAnchor) return;
    const slot = this.el.querySelector('slot') as HTMLSlotElement | null;
    const next = (slot?.assignedElements?.()[0] ?? this.el.firstElementChild) as HTMLElement | null;
    if (next === this.anchor || next?.tagName === 'SLOT') return;
    if (this.isOpen || this.popupEl) this.hideInstant();
    this.unbindAnchor();
    this.bindAnchor();
  };

  private clearTimers() {
    if (this.delayTimer) { clearTimeout(this.delayTimer); this.delayTimer = null; }
    if (this.closeTimer) { clearTimeout(this.closeTimer); this.closeTimer = null; }
  }

  private setupOpenListeners() {
    // Binds scroll/resize + the resize observer; placement itself is scheduled
    // by schedulePosition() so the label restyle stays interleaved.
    this.position.observe();
    document.addEventListener('keydown', this.escapeHandler);
  }

  private teardownOpenListeners() {
    this.position.unobserve();
    document.removeEventListener('keydown', this.escapeHandler);
  }

  private destroyPopup() {
    this.teardownOpenListeners();
    this.unlinkDescribedBy();
    if (!this.popupEl) return;
    this.popupEl.remove();
    this.popupEl = null;
  }

  /**
   * Position after `ds-text` upgrades and lays out. Measuring synchronously in
   * `mountPopup` reads a collapsed/fallback width and places left/right tips wrong.
   */
  private schedulePosition() {
    if (!this.popupEl) return;

    const reapplyLabelStyles = () => {
      const label = this.popupEl?.querySelector(':scope > .tooltip-inner > ds-text');
      if (label instanceof HTMLElement) styleTooltipLabel(label, this.wrapLabel);
    };

    requestAnimationFrame(() => {
      reapplyLabelStyles();
      this.position.update();
      requestAnimationFrame(() => {
        reapplyLabelStyles();
        this.position.update();
      });
    });

    // The popup remounts on every show, so re-target the observer bound in start().
    this.position.observeResizeTargets();
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
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- module singleton tracks the active instance
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
    if (!this.popupEl) {
      this.isOpen = false;
      return;
    }
    this.popupEl.classList.remove('tooltip-popup--instant');
    this.popupEl.classList.add('tooltip-popup--closing');
    if (this.fadeOutMs === 0) {
      if (activeTooltip === this) activeTooltip = null;
      this.destroyPopup();
      this.isOpen = false;
      this.skipEnterAnimation = false;
      return;
    }
    this.closeTimer = setTimeout(() => {
      this.closeTimer = null;
      if (activeTooltip === this) activeTooltip = null;
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
      tip.className = 'tooltip-popup ds-forced-colors-scope sc-ds-tooltip';
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

    this.setupOpenListeners();
    this.linkDescribedBy();
      this.popupEl.classList.toggle('tooltip-popup--instant', this.skipEnterAnimation);
    this.popupEl.classList.toggle('tooltip-popup--wrap', this.wrapLabel);
    this.popupEl.classList.remove('tooltip-popup--closing');
    this.renderPopupContent();
    this.schedulePosition();
    this.isOpen = true;
  }

  private renderPopupContent() {
    if (!this.popupEl) return;
    this.popupEl.classList.toggle('tooltip-popup--wrap', this.wrapLabel);
    const textVariant = CONTROL_TEXT_VARIANT[this.size];
    const density =
      this.size === 'md' ? 'ds-control--md' : this.size === 'sm' ? 'ds-control--sm' : 'ds-control--xs';
    // Every layout node needs `sc-ds-tooltip` so scoped selectors (`.foo.sc-ds-tooltip`) match.
    const sc = 'sc-ds-tooltip';

    const inner = document.createElement('div');
    inner.className = `tooltip-inner ${density} ${sc}`;

    const appendShortcut = (position: 'start' | 'end') => {
      if (!this.shortcutKey || this.shortcutKeyPosition !== position) return;
      const group = document.createElement('span');
      group.className = `key-hint-group ${sc}`;
      group.setAttribute('aria-hidden', 'true');

      for (const label of shortcutKeyLabels(this.shortcutKey)) {
        const hint = document.createElement('span');
        const wide = Array.from(label).length > 1 ? ' key-hint--wide' : '';
        hint.className = `key-hint${wide} ${sc}`;
        const text = document.createElement('span');
        text.className = `key-hint__label ${sc}`;
        text.textContent = label;
        hint.appendChild(text);
        group.appendChild(hint);
      }
      inner.appendChild(group);
    };

    appendShortcut('start');

    // ds-text is the layout box (metric-box + 2px control label-inset).
    // Inline styles required — see styleTooltipLabel.
    const label = createDsText({
      variant: textVariant,
      wrap: this.wrapLabel ? 'wrap' : 'nowrap',
      text: this.label,
    });
    styleTooltipLabel(label, this.wrapLabel);
    inner.appendChild(label);

    appendShortcut('end');

    this.popupEl.replaceChildren(inner);
  }

  render() {
    return (
      <Host style={{ display: 'contents' }}>
        <slot onSlotchange={this.handleSlotChange} />
      </Host>
    );
  }
}
