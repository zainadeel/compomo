import { Component, Prop, State, Event, EventEmitter, Element, Watch, h, Host } from '@stencil/core';
import { resolveMotionTimeMs, TOKEN_DEFAULTS } from '../../utils';

export type ModalWidth = 'sm' | 'md' | 'lg';
export type ModalCloseReason = 'close-button' | 'escape' | 'backdrop';

export interface ModalCloseDetail {
  reason: ModalCloseReason;
  originalEvent: Event;
}

const WIDTH_MAP: Record<ModalWidth, string> = {
  sm: 'var(--dimension-modal-width-sm)',
  md: 'var(--dimension-modal-width-md)',
  lg: 'var(--dimension-modal-width-lg)',
};

const FOCUSABLE_SEL = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

let modalIdCounter = 0;

@Component({
  tag: 'ds-modal',
  styleUrl: 'Modal.css',
  scoped: true,
})
export class Modal {
  @Element() el!: HTMLElement;

  @Prop({ mutable: true }) open: boolean = false;
  @Prop() heading!: string;
  @Prop() closeAriaLabel: string = 'Close';
  @Prop() modalWidth: ModalWidth | string = 'md';
  /** Optional id reference for explanatory content in the default slot. */
  @Prop({ attribute: 'aria-describedby' }) ariaDescribedby: string | undefined;

  @State() private closing: boolean = false;
  @State() private hasFooter: boolean = false;

  /** Emitted when an internal dismissal control requests that the modal close. */
  @Event() dsClose!: EventEmitter<ModalCloseDetail>;
  /** Emitted after exit motion completes, the top layer closes, and focus is restored. */
  @Event() dsAfterClose!: EventEmitter<void>;

  private titleId = `ds-modal-title-${++modalIdCounter}`;
  private dialogEl: HTMLDialogElement | null = null;
  private previousFocus: HTMLElement | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  componentDidLoad() {
    this.updateFooterPresence();
    if (this.open) this.onOpenChange(true);
  }

  disconnectedCallback() {
    this.clearCloseTimer();
    if (this.dialogEl?.open) this.dialogEl.close();
  }

  @Watch('open')
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      this.clearCloseTimer();
      const alreadyOpen = !!this.dialogEl?.open;
      this.closing = false;
      if (!this.dialogEl || alreadyOpen) return;
      this.previousFocus = document.activeElement as HTMLElement | null;
      this.dialogEl.showModal();
      requestAnimationFrame(() => {
        if (this.open && this.dialogEl?.open) this.focusClose();
      });
    } else if (this.dialogEl?.open) {
      this.closing = true;
      const closeAnimationMs = this.closeAnimationMs;
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

  private focusClose() {
    const close = this.el.querySelector('ds-button-unfilled.modal-close') as
      | (HTMLElement & { setFocus?: () => Promise<void> })
      | null;
    void close?.setFocus?.();
  }

  private clearCloseTimer() {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  private requestClose(reason: ModalCloseReason, originalEvent: Event) {
    if (!this.open || this.closing || !this.dialogEl?.open) return;
    this.dsClose.emit({ reason, originalEvent });
    this.open = false;
  }

  private updateFooterPresence(slot?: HTMLSlotElement) {
    const assignedNodes = slot?.assignedNodes({ flatten: true }) ?? [];
    this.hasFooter =
      assignedNodes.some(node => node.nodeType !== Node.TEXT_NODE || !!node.textContent?.trim()) ||
      this.el.querySelector('[slot="footer"]') !== null;
  }

  private handleCancel(event: Event) {
    event.preventDefault();
    this.requestClose('escape', event);
  }

  private handleBackdropPointerDown(event: PointerEvent) {
    if (event.target === this.dialogEl) this.requestClose('backdrop', event);
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Tab' || !this.dialogEl) return;
    const focusables = Array.from(
      this.dialogEl.querySelectorAll<HTMLElement>(FOCUSABLE_SEL)
    ).filter(element =>
      !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true'
    );
    if (!focusables.length) {
      event.preventDefault();
      this.dialogEl.focus();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === this.dialogEl)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private get resolvedWidth(): string {
    if (this.modalWidth === 'sm' || this.modalWidth === 'md' || this.modalWidth === 'lg') {
      return WIDTH_MAP[this.modalWidth];
    }
    return this.modalWidth as string;
  }

  private get closeAnimationMs(): number {
    return resolveMotionTimeMs(TOKEN_DEFAULTS.motionShort3, TOKEN_DEFAULTS.animationDurationShort3);
  }

  private finishClose() {
    if (!this.dialogEl?.open) return;
    this.dialogEl.close();
    this.closing = false;
    this.clearCloseTimer();
    this.previousFocus?.focus?.();
    this.previousFocus = null;
    this.dsAfterClose.emit();
  }

  render() {
    return (
      <Host>
        <dialog
          ref={(element?: HTMLDialogElement) => {
            this.dialogEl = element ?? null;
          }}
          class={{ 'modal-dialog': true, 'modal-dialog--closing': this.closing }}
          aria-labelledby={this.titleId}
          aria-describedby={this.ariaDescribedby}
          onCancel={(event: Event) => this.handleCancel(event)}
          onPointerDown={(event: PointerEvent) => this.handleBackdropPointerDown(event)}
          onKeyDown={(event: KeyboardEvent) => this.handleKeyDown(event)}
          style={{
            width: `min(${this.resolvedWidth}, calc(100vw - 2 * var(--dimension-space-200)))`,
          }}
        >
          <div class="modal-header">
            <ds-text
              class="modal-heading"
              as="h2"
              variant="text-title-medium"
              emphasis
              color="primary"
              lineTruncation={1}
              textId={this.titleId}
            >
              {this.heading}
            </ds-text>
            <ds-tooltip class="modal-close-tooltip" label={this.closeAriaLabel} side="bottom" size="sm">
              <ds-button-unfilled
                class="modal-close"
                variant="icon"
                icon="Cross"
                size="md"
                aria-label={this.closeAriaLabel}
                activeFill={false}
                hasBorder={false}
                onDsClick={(event: CustomEvent<MouseEvent>) =>
                  this.requestClose('close-button', event.detail)
                }
              />
            </ds-tooltip>
          </div>
          <div class="modal-content">
            <slot />
          </div>
          <div
            class={{
              'modal-footer': true,
              'modal-footer--empty': !this.hasFooter,
            }}
          >
            <slot
              name="footer"
              onSlotchange={(event: Event) =>
                this.updateFooterPresence(event.currentTarget as HTMLSlotElement)
              }
            />
          </div>
        </dialog>
      </Host>
    );
  }
}
