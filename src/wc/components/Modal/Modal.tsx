import { Component, Prop, State, Event, EventEmitter, Element, Watch, h, Host } from '@stencil/core';
import { resolveMotionTimeMs, TOKEN_DEFAULTS } from '../../utils';

export type ModalWidth = 'sm' | 'md' | 'lg';

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
const activeModalStack: object[] = [];
const modalInertState = new WeakMap<HTMLElement, { count: number; wasInert: boolean }>();

function makeInert(element: HTMLElement) {
  const state = modalInertState.get(element);
  if (state) {
    state.count += 1;
    return;
  }
  modalInertState.set(element, { count: 1, wasInert: element.inert });
  element.inert = true;
}

function releaseInert(element: HTMLElement) {
  const state = modalInertState.get(element);
  if (!state) return;
  state.count -= 1;
  if (state.count > 0) return;
  element.inert = state.wasInert;
  modalInertState.delete(element);
}

@Component({
  tag: 'ds-modal',
  styleUrl: 'Modal.css',
  scoped: true,
})
export class Modal {
  @Element() el!: HTMLElement;

  @Prop({ mutable: true }) open: boolean = false;
  @Prop() heading!: string;
  @Prop() subtitle: string | undefined;
  @Prop() modalWidth: ModalWidth | string = 'md';

  @State() private shouldRender: boolean = false;
  @State() private closing: boolean = false;

  @Event() dsClose!: EventEmitter<void>;

  private instanceId = ++modalIdCounter;
  private titleId = `ds-modal-title-${modalIdCounter}`;
  private subtitleId = `ds-modal-subtitle-${modalIdCounter}`;
  private previousFocus: HTMLElement | null = null;
  private escapeHandler: ((e: KeyboardEvent) => void) | null = null;
  private tabHandler: ((e: KeyboardEvent) => void) | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private inertedElements: HTMLElement[] = [];

  componentDidLoad() {
    if (this.open) this.onOpenChange(true);
  }

  disconnectedCallback() {
    this.teardownListeners();
    this.deactivateModal();
  }

  @Watch('open')
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      this.teardownListeners();
      this.shouldRender = true;
      this.closing = false;
      this.previousFocus = document.activeElement as HTMLElement | null;
      this.activateModal();
      requestAnimationFrame(() => {
        this.focusFirst();
        this.setupListeners();
      });
    } else if (this.shouldRender) {
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

  private focusFirst() {
    const dialog = this.el.querySelector('.modal-dialog') as HTMLElement | null;
    if (!dialog) return;
    const focusables = this.getFocusables(dialog);
    (focusables[0] ?? dialog).focus();
  }

  private getFocusables(root: HTMLElement): HTMLElement[] {
    return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SEL)).filter(
      el => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
    );
  }

  private setupListeners() {
    this.escapeHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.isTopModal) { e.preventDefault(); this.close(); }
    };

    this.tabHandler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !this.isTopModal) return;
      const dialog = this.el.querySelector('.modal-dialog') as HTMLElement | null;
      if (!dialog) return;
      const focusables = this.getFocusables(dialog);
      if (!focusables.length) { e.preventDefault(); dialog.focus(); return; }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || active === dialog || !dialog.contains(active)) {
          e.preventDefault(); last.focus();
        }
      } else {
        if (active === last || !dialog.contains(active)) {
          e.preventDefault(); first.focus();
        }
      }
    };

    document.addEventListener('keydown', this.escapeHandler);
    document.addEventListener('keydown', this.tabHandler);
  }

  private teardownListeners() {
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
      this.escapeHandler = null;
    }
    if (this.tabHandler) {
      document.removeEventListener('keydown', this.tabHandler);
      this.tabHandler = null;
    }
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  private close() {
    if (!this.open || this.closing || !this.isTopModal) return;
    this.dsClose.emit();
    this.open = false;
  }

  private handleBackdropMouseDown(e: MouseEvent) {
    if (e.target === e.currentTarget && this.isTopModal) this.close();
  }

  private get isTopModal(): boolean {
    return activeModalStack[activeModalStack.length - 1] === this;
  }

  /** Inert every sibling branch outside the modal without assuming it is a body child. */
  private activateModal() {
    if (!activeModalStack.includes(this)) activeModalStack.push(this);
    if (this.inertedElements.length) return;

    let branch: HTMLElement = this.el;
    let parent = branch.parentElement;
    while (parent) {
      for (const sibling of Array.from(parent.children)) {
        if (sibling === branch || !(sibling instanceof HTMLElement)) continue;
        makeInert(sibling);
        this.inertedElements.push(sibling);
      }
      if (parent === document.body) break;
      branch = parent;
      parent = parent.parentElement;
    }
  }

  private deactivateModal() {
    const stackIndex = activeModalStack.lastIndexOf(this);
    if (stackIndex >= 0) activeModalStack.splice(stackIndex, 1);
    for (const element of this.inertedElements) releaseInert(element);
    this.inertedElements = [];
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
    this.shouldRender = false;
    this.closing = false;
    this.teardownListeners();
    this.deactivateModal();
    this.previousFocus?.focus?.();
    this.previousFocus = null;
  }

  render() {
    // Always render slots so scoped-mode slot distribution doesn't leak content.
    // The backdrop is hidden via CSS when not active.
    const hidden = !this.shouldRender && !this.closing;

    return (
      <Host style={{ display: 'contents' }}>
        <div
          class={{ 'modal-backdrop': true, 'modal-backdrop--closing': this.closing, 'modal-backdrop--hidden': hidden }}
          onMouseDown={(e: MouseEvent) => this.handleBackdropMouseDown(e)}
          style={{ position: 'fixed', inset: '0', zIndex: '9999', display: hidden ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--dimension-space-200)' }}
        >
          <div
            class={{ 'modal-dialog': true, 'modal-dialog--closing': this.closing }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={this.titleId}
            aria-describedby={this.subtitle ? this.subtitleId : undefined}
            tabIndex={-1}
            style={{ width: `min(${this.resolvedWidth}, calc(100vw - 2 * var(--dimension-space-200)))` }}
          >
            <div class="modal-header">
              <ds-text
                as="h2"
                variant="text-title-small"
                textId={this.titleId}
              >
                {this.heading}
              </ds-text>
              {this.subtitle && (
                <ds-text
                  class="modal-subtitle"
                  as="div"
                  variant="text-body-medium"
                  color="secondary"
                  wrap="balance"
                  textId={this.subtitleId}
                >
                  {this.subtitle}
                </ds-text>
              )}
            </div>
            <div class="modal-body">
              <slot />
            </div>
            <div class="modal-footer">
              <slot name="footer" />
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
