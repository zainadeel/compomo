import {
  Component,
  Prop,
  State,
  Event,
  EventEmitter,
  Element,
  Watch,
  h,
  Host,
} from '@stencil/core';
import {
  resolveCssLengthPx,
  resolveMotionTimeMs,
  TOKEN_CSS_LENGTHS,
  TOKEN_DEFAULTS,
} from '../../utils';
import { resolveAnchoredOverlayBoundaryRect } from '../../utils/anchored-overlay-boundary';
import { AnchoredOverlayInteractionController } from '../../utils/anchored-overlay-interaction-controller';
import type { AnchoredAlign, AnchoredSide } from '../../utils/anchored-position';
import { AnchoredPositionController } from '../../utils/anchored-position-controller';
import { ConnectionTasks } from '../../utils/connection-tasks';

export type PopoverSide = AnchoredSide;
export type PopoverAlign = AnchoredAlign;
export type PopoverWidth = 'xs' | 'sm' | 'md' | 'lg';
export type PopoverBodyInset = 'default' | 'none';
export type PopoverCloseReason = 'escape' | 'outside' | 'tab';

export interface PopoverCloseDetail {
  reason: PopoverCloseReason;
  /** The triggering event; absent for outside activation, which the shared controller observes. */
  originalEvent?: Event;
}

const TABBABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const WIDTH_MAP: Record<PopoverWidth, string> = {
  xs: 'var(--dimension-menu-width-xs)',
  sm: 'var(--dimension-menu-width-sm)',
  md: 'var(--dimension-menu-width-md)',
  lg: 'var(--dimension-menu-width-lg)',
};

let popoverIdCounter = 0;

@Component({
  tag: 'ds-popover',
  styleUrl: 'Popover.css',
  scoped: true,
})
export class Popover {
  @Element() el!: HTMLElement;

  @Prop({ mutable: true }) open: boolean = false;
  /** External trigger element to position against. Set via JS: popoverEl.anchor = buttonEl */
  @Prop() anchor: HTMLElement | undefined;
  /** ID of the external trigger element for positioning. */
  @Prop() anchorId: string | undefined;
  /** Preferred side; placement flips to the opposite side when that offers a better fit. */
  @Prop() side: PopoverSide = 'bottom';
  @Prop() align: PopoverAlign = 'start';
  /** Gap between anchor and popover — number (px) or TokoMo length. */
  @Prop() sideOffset: number | string = TOKEN_CSS_LENGTHS.space050;
  /** Explicit collision owner; otherwise the nearest data-ds-overlay-boundary ancestor is used. */
  @Prop() boundary: HTMLElement | undefined;
  /**
   * Menu width token (`xs`, `sm`, `md`, `lg`) or a CSS length. Unset, the surface
   * follows its content between the menu-width-xs and panel-width-lg bounds.
   */
  @Prop() popoverWidth: PopoverWidth | string | undefined;
  /** Accessible name for the dialog surface. */
  @Prop() popoverLabel: string = '';
  /** `default` insets content to the Menu label edge; `none` for lists that bring their own inset. */
  @Prop() bodyInset: PopoverBodyInset = 'default';

  @State() private shouldRender: boolean = false;
  @State() private closing: boolean = false;
  @State() private positionReady: boolean = false;
  @State() private pos: { x: number; y: number } = { x: 0, y: 0 };
  @State() private availableHeight: number | null = null;

  /** Emitted when the user dismisses the popover. The component sets open to false. */
  @Event() dsClose!: EventEmitter<PopoverCloseDetail>;
  /** Emitted after exit motion completes. */
  @Event() dsAfterClose!: EventEmitter<void>;

  private readonly popupId = `ds-popover-${++popoverIdCounter}`;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private loaded = false;
  private readonly tasks = new ConnectionTasks(() => this.el.isConnected);

  private readonly position = new AnchoredPositionController({
    getAnchor: () => this.resolvedAnchor,
    getPopup: () => this.popupEl,
    getOwnerDocument: () => this.el.ownerDocument,
    measure: (anchor, popup) => {
      if (!this.open) return null;
      const viewportPadPx = this.viewportPadPx;
      return {
        anchorRect: anchor.getBoundingClientRect(),
        popupWidth: popup.offsetWidth,
        popupHeight: Math.min(popup.scrollHeight, window.innerHeight - viewportPadPx * 2),
        side: this.side,
        align: this.align,
        sideOffsetPx: resolveCssLengthPx(this.sideOffset, TOKEN_DEFAULTS.space050),
        alignOffsetPx: 0,
        viewportPadPx,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        collisionRect: resolveAnchoredOverlayBoundaryRect(anchor, this.boundary),
      };
    },
    apply: ({ x, y, availableHeight }) => {
      this.pos = { x, y };
      this.availableHeight = availableHeight;
    },
    onReady: () => {
      this.positionReady = true;
    },
    liveUpdate: 'double-frame',
    topLayer: true,
    observeResize: true,
    observeAnchorMotion: true,
  });

  private readonly interaction = new AnchoredOverlayInteractionController({
    getAnchor: () => this.resolvedAnchor,
    getPopup: () => this.popupEl,
    getOwnerDocument: () => this.el.ownerDocument,
    onOutsideActivation: () => this.close('outside', undefined, false),
  });

  componentDidLoad() {
    this.loaded = true;
    if (this.open) this.onOpenChange(true);
  }

  connectedCallback() {
    if (this.loaded && this.open) this.onOpenChange(true);
  }

  disconnectedCallback() {
    this.tasks.cancel();
    this.teardown();
    this.shouldRender = false;
    this.closing = false;
    this.positionReady = false;
  }

  @Watch('open')
  onOpenChange(isOpen: boolean) {
    if (!this.loaded || !this.el.isConnected) return;
    if (isOpen) {
      this.teardown();
      this.shouldRender = true;
      this.closing = false;
      this.positionReady = false;
      this.availableHeight = null;
      this.interaction.connect();
      this.position.observe();
      this.position.schedule(() => this.focusInitial());
    } else if (this.shouldRender && !this.closing) {
      this.closing = true;
      this.teardown();
      const closeAnimationMs = resolveMotionTimeMs(
        TOKEN_DEFAULTS.motionShort2,
        TOKEN_DEFAULTS.animationDurationShort3
      );
      if (closeAnimationMs <= 0) {
        this.finishClose();
        return;
      }
      this.closeTimer = setTimeout(() => {
        this.closeTimer = null;
        this.finishClose();
      }, closeAnimationMs);
    }
  }

  @Watch('anchor')
  @Watch('anchorId')
  @Watch('boundary')
  @Watch('side')
  @Watch('align')
  @Watch('sideOffset')
  onPlacementChange() {
    if (this.open && this.shouldRender) this.position.schedule();
  }

  private get resolvedAnchor(): HTMLElement | null {
    if (this.anchor) return this.anchor;
    if (this.anchorId) return this.el.ownerDocument.getElementById(this.anchorId);
    return null;
  }

  private get popupEl(): HTMLElement | null {
    return this.el.querySelector<HTMLElement>('.popover-surface');
  }

  private get viewportPadPx(): number {
    return resolveCssLengthPx(TOKEN_DEFAULTS.space050, TOKEN_DEFAULTS.space050);
  }

  private get resolvedWidth(): string | undefined {
    const width = this.popoverWidth?.trim();
    if (!width) return undefined;
    return WIDTH_MAP[width as PopoverWidth] ?? width;
  }

  private teardown() {
    this.position.unobserve();
    this.interaction.disconnect();
    if (this.closeTimer) clearTimeout(this.closeTimer);
    this.closeTimer = null;
  }

  private focusInitial() {
    this.tasks.frame(() => {
      if (!this.open) return;
      const popup = this.popupEl;
      if (!popup) return;
      const content = popup.querySelector<HTMLElement>('.popover-content');
      const autofocus = content?.querySelector<HTMLElement>('[autofocus]');
      if (autofocus) {
        autofocus.focus();
        return;
      }
      popup.focus();
    });
  }

  private close(
    reason: PopoverCloseReason,
    originalEvent: Event | undefined,
    restoreFocus: boolean
  ) {
    if (!this.open || this.closing) return;
    if (restoreFocus) this.interaction.focusAnchor();
    this.dsClose.emit({ reason, originalEvent });
    this.open = false;
  }

  private finishClose() {
    if (this.open || !this.closing || !this.el.isConnected) return;
    const popup = this.popupEl;
    if (popup?.matches(':popover-open')) popup.hidePopover();
    this.shouldRender = false;
    this.closing = false;
    this.positionReady = false;
    this.dsAfterClose.emit();
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (this.closing) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close('escape', event, true);
      return;
    }
    // From the focused surface itself, a forward Tab enters the first control. WebKit
    // sends native Tab from a top-layer surface to the document body, so move it here.
    if (event.key === 'Tab' && !event.shiftKey && event.target === this.popupEl) {
      const first = this.popupEl?.querySelector<HTMLElement>(TABBABLE_SELECTOR);
      if (first) {
        event.preventDefault();
        first.focus();
        return;
      }
    }
    if (event.key === 'Tab' && this.interaction.tabLeavesPopup(event)) {
      event.preventDefault();
      this.close('tab', event, false);
      this.interaction.moveFocusAfterTab(event.shiftKey);
    }
  };

  render() {
    // Slotted content stays in the host while closed so authored nodes are never discarded.
    const visible = this.shouldRender;
    const popupStyle: Record<string, string> = {
      position: 'fixed',
      left: '0',
      top: '0',
      transform: `translate(${Math.round(this.pos.x)}px, ${Math.round(this.pos.y)}px)`,
      visibility: this.positionReady ? 'visible' : 'hidden',
    };
    const width = this.resolvedWidth;
    if (width) popupStyle['--_popover-width'] = width;
    if (this.availableHeight !== null) {
      popupStyle['max-height'] = `${Math.floor(this.availableHeight)}px`;
    }

    return (
      <Host>
        <div
          id={this.popupId}
          popover="manual"
          tabindex={-1}
          class={{
            'popover-surface': true,
            'ds-choice-popup': true,
            'ds-choice-popup--closing': this.closing,
            'popover-surface--hidden': !visible,
          }}
          style={visible ? popupStyle : undefined}
          role="dialog"
          aria-label={this.popoverLabel || undefined}
          inert={this.closing}
          onKeyDown={this.handleKeyDown}
        >
          <div
            class={{
              'popover-content': true,
              'popover-content--flush': this.bodyInset === 'none',
            }}
          >
            <slot />
          </div>
        </div>
      </Host>
    );
  }
}
