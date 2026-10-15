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
import { resolveMotionTimeMs, TOKEN_DEFAULTS } from '../../utils';
import { ConnectionTasks } from '../../utils/connection-tasks';

export type DrawerSide = 'end' | 'start';
export type DrawerWidth = 'sm' | 'md' | 'lg';
export type DrawerBodyInset = 'default' | 'none';
export type DrawerCloseReason = 'close-button' | 'escape' | 'backdrop' | 'replaced';

export interface DrawerCloseDetail {
  reason: DrawerCloseReason;
  originalEvent?: globalThis.Event;
}

export interface DrawerAfterCloseDetail {
  /**
   * True when the owner should place focus, typically on the record now shown.
   * False when another drawer replaced this one, or a modal drawer already
   * returned focus to its trigger.
   */
  restoreFocus: boolean;
}

const WIDTH_MAP: Record<DrawerWidth, string> = {
  sm: 'var(--dimension-panel-width-sm)',
  md: 'var(--dimension-panel-width-md)',
  lg: 'var(--dimension-panel-width-lg)',
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

/** Targets that own Left/Right themselves, so record paging must not steal the keys. */
const DIRECTIONAL_CONTROL_TAGS = new Set([
  'DS-SELECT',
  'DS-MENU',
  'DS-FILTER-MENU',
  'DS-SLIDER',
  'INPUT',
  'SELECT',
  'TEXTAREA',
]);
const DIRECTIONAL_CONTROL_ROLES = new Set(['slider', 'combobox', 'listbox', 'menu', 'tablist']);

function directionalControlInPath(path: readonly EventTarget[]): boolean {
  return path.some(target => {
    if (!(target instanceof HTMLElement)) return false;
    if (DIRECTIONAL_CONTROL_TAGS.has(target.tagName) || target.isContentEditable) return true;
    const role = target.getAttribute('role');
    return role !== null && DIRECTIONAL_CONTROL_ROLES.has(role);
  });
}

/** One non-modal drawer per document: opening another replaces it. */
const activeNonModalDrawers = new WeakMap<Document, Drawer>();

let drawerIdCounter = 0;

@Component({
  tag: 'ds-drawer',
  styleUrl: 'Drawer.css',
  scoped: true,
})
export class Drawer {
  @Element() el!: HTMLElement;

  @Prop({ mutable: true }) open: boolean = false;
  /** Generic label for what the drawer shows, such as "Event details". Record identity belongs in the body. */
  @Prop() heading!: string;
  /**
   * Block the page behind a shade and contain focus. The default non-modal
   * drawer leaves the page interactive beside it.
   */
  @Prop() modal: boolean = false;
  /** Edge the panel attaches to. */
  @Prop() side: DrawerSide = 'end';
  /** Panel width token (`sm`, `md`, `lg`) or a CSS length. Narrow viewports use the full width. */
  @Prop() drawerWidth: DrawerWidth | string = 'sm';
  /** `none` removes the body inset for content that owns its own edges. */
  @Prop() bodyInset: DrawerBodyInset = 'default';
  /** When set, shows a leading Back action for multi-depth content and emits dsBack. */
  @Prop() backLabel: string | undefined;
  @Prop() closeAriaLabel: string = 'Close';
  /** Shows Previous and Next record actions at the end of the footer. */
  @Prop() navigation: boolean = false;
  @Prop() previousAvailable: boolean = false;
  @Prop() nextAvailable: boolean = false;
  @Prop() previousAriaLabel: string = 'Previous item';
  @Prop() nextAriaLabel: string = 'Next item';
  @Prop() navigationAriaLabel: string = 'Record navigation';
  /** Suspends Left/Right record paging, for example while a menu in the drawer is open. */
  @Prop() navigationShortcutsBlocked: boolean = false;
  /** Optional id reference for explanatory content in the body. */
  @Prop({ attribute: 'aria-describedby' }) ariaDescribedby: string | undefined;

  @State() private closing: boolean = false;
  @State() private shown: boolean = false;
  @State() private hasFooterActions: boolean = false;
  @State() private hasHeaderActions: boolean = false;

  /** Emitted when the drawer requests to close; open is already false. */
  @Event() dsClose!: EventEmitter<DrawerCloseDetail>;
  /** Emitted after exit motion completes. */
  @Event() dsAfterClose!: EventEmitter<DrawerAfterCloseDetail>;
  /** Emitted when the leading Back action is activated. The owner swaps heading and body. */
  @Event() dsBack!: EventEmitter<MouseEvent>;
  /** Emitted by the Previous action or ArrowLeft while navigation is shown and available. */
  @Event() dsPrevious!: EventEmitter<void>;
  /** Emitted by the Next action or ArrowRight while navigation is shown and available. */
  @Event() dsNext!: EventEmitter<void>;

  private titleId = `ds-drawer-title-${++drawerIdCounter}`;
  private dialogEl: HTMLDialogElement | null = null;
  private previousFocus: HTMLElement | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private loaded = false;
  private openedAsModal = false;
  private replaced = false;
  private documentListening: Document | null = null;
  private readonly tasks = new ConnectionTasks(() => this.el.isConnected);

  connectedCallback() {
    if (!this.loaded) return;
    this.updateSlotPresence();
    this.onOpenChange(this.open);
  }

  componentDidLoad() {
    this.loaded = true;
    this.updateSlotPresence();
    if (this.open) this.onOpenChange(true);
  }

  componentDidRender() {
    if (!this.el.isConnected) return;
    if (!this.closing || !this.isSurfaceOpen || this.closeTimer) return;
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

  disconnectedCallback() {
    this.tasks.cancel();
    this.clearCloseTimer();
    this.releaseActive();
    this.stopDocumentListeners();
    this.hideSurface();
    this.closing = false;
    this.shown = false;
    this.previousFocus = null;
  }

  @Watch('open')
  onOpenChange(isOpen: boolean) {
    if (!this.loaded || !this.el.isConnected) return;
    this.tasks.cancel();
    if (isOpen) {
      this.clearCloseTimer();
      const alreadyOpen = this.isSurfaceOpen;
      this.closing = false;
      this.replaced = false;
      if (!this.dialogEl || alreadyOpen) return;
      this.previousFocus = this.el.ownerDocument.activeElement as HTMLElement | null;
      this.present();
      this.shown = true;
      this.startDocumentListeners();
      this.tasks.frame(() => {
        if (this.open && this.isSurfaceOpen) this.focusLeadingAction();
      });
    } else if (this.isSurfaceOpen) {
      this.releaseActive();
      this.stopDocumentListeners();
      this.closing = true;
    }
  }

  @Watch('modal')
  onModalChange() {
    if (!this.open || !this.isSurfaceOpen || this.openedAsModal === this.modal) return;
    this.hideSurface();
    this.present();
  }

  /** Drilling in or out moves focus to the action that now leads the header. */
  @Watch('backLabel')
  onBackLabelChange(next: string | undefined, previous: string | undefined) {
    if (!this.open || !this.isSurfaceOpen || !next === !previous) return;
    const active = this.el.ownerDocument.activeElement;
    const focusInside = !!active && !!this.dialogEl?.contains(active);
    if (!focusInside && active !== this.el.ownerDocument.body) return;
    this.tasks.frame(() => {
      if (this.open && this.isSurfaceOpen) this.focusLeadingAction();
    });
  }

  private present() {
    if (!this.dialogEl) return;
    this.openedAsModal = this.modal;
    if (this.modal) {
      this.releaseActive();
      this.dialogEl.showModal();
      return;
    }
    this.dialogEl.show();
    const doc = this.el.ownerDocument;
    const previous = activeNonModalDrawers.get(doc);
    activeNonModalDrawers.set(doc, this);
    if (previous && previous !== this) previous.replace();
  }

  /** Closes because another non-modal drawer opened; that drawer owns focus. */
  private replace() {
    if (!this.open || this.closing) return;
    this.replaced = true;
    this.requestClose('replaced');
  }

  private releaseActive() {
    const doc = this.el.ownerDocument;
    if (activeNonModalDrawers.get(doc) === this) activeNonModalDrawers.delete(doc);
  }

  private get isSurfaceOpen(): boolean {
    return !!this.dialogEl?.open;
  }

  private hideSurface() {
    if (this.dialogEl?.open) this.dialogEl.close();
  }

  private focusLeadingAction() {
    const selector = this.backLabel
      ? 'ds-button-unfilled.drawer-back'
      : 'ds-button-unfilled.drawer-close';
    const action = this.el.querySelector(selector) as
      | (HTMLElement & { setFocus?: () => Promise<void> })
      | null;
    void action?.setFocus?.();
  }

  private clearCloseTimer() {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  private requestClose(reason: DrawerCloseReason, originalEvent?: globalThis.Event) {
    if (!this.open || this.closing || !this.isSurfaceOpen) return;
    this.dsClose.emit({ reason, originalEvent });
    this.open = false;
  }

  private startDocumentListeners() {
    if (this.documentListening) return;
    const doc = this.el.ownerDocument;
    doc.addEventListener('keydown', this.handleDocumentKeyDown);
    doc.addEventListener('keydown', this.handleDirectionalKeyDown, true);
    this.documentListening = doc;
  }

  private stopDocumentListeners() {
    const doc = this.documentListening;
    if (!doc) return;
    doc.removeEventListener('keydown', this.handleDocumentKeyDown);
    doc.removeEventListener('keydown', this.handleDirectionalKeyDown, true);
    this.documentListening = null;
  }

  /** A modal surface other than this drawer owns the keyboard. */
  private get coveredByOtherModal(): boolean {
    const modal = this.el.ownerDocument.querySelector('dialog:modal');
    return !!modal && modal !== this.dialogEl;
  }

  /** Non-modal Escape works from anywhere in the page, after inner surfaces had their turn. */
  private readonly handleDocumentKeyDown = (event: KeyboardEvent) => {
    if (this.openedAsModal || event.key !== 'Escape' || event.defaultPrevented) return;
    if (!this.open || this.closing || this.coveredByOtherModal) return;
    event.preventDefault();
    this.requestClose('escape', event);
  };

  /** Captures Left/Right ahead of row and grid handlers so paging works from the page too. */
  private readonly handleDirectionalKeyDown = (event: KeyboardEvent) => {
    if (
      !this.open ||
      this.closing ||
      !this.navigation ||
      this.navigationShortcutsBlocked ||
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') ||
      this.coveredByOtherModal ||
      directionalControlInPath(event.composedPath())
    ) {
      return;
    }
    const rtl = getComputedStyle(this.el).direction === 'rtl';
    const towardStart = (event.key === 'ArrowLeft') !== rtl;
    event.preventDefault();
    event.stopPropagation();
    this.page(towardStart ? 'previous' : 'next');
  };

  private page(direction: 'previous' | 'next') {
    if (direction === 'previous') {
      if (this.previousAvailable) this.dsPrevious.emit();
      return;
    }
    if (this.nextAvailable) this.dsNext.emit();
  }

  private hasAssignedContent(slotName: string, slot?: HTMLSlotElement): boolean {
    const assignedNodes = slot?.assignedNodes() ?? [];
    return (
      assignedNodes.some(node => node.nodeType !== Node.TEXT_NODE || !!node.textContent?.trim()) ||
      this.el.querySelector(`[slot="${slotName}"]`) !== null
    );
  }

  private updateSlotPresence() {
    this.hasFooterActions = this.hasAssignedContent('footer');
    this.hasHeaderActions = this.hasAssignedContent('header-actions');
  }

  private handleCancel(event: globalThis.Event) {
    event.preventDefault();
    this.requestClose('escape', event);
  }

  private handleBackdropPointerDown(event: PointerEvent) {
    if (this.openedAsModal && event.target === this.dialogEl) this.requestClose('backdrop', event);
  }

  private handleDialogKeyDown(event: KeyboardEvent) {
    if (!this.openedAsModal || event.key !== 'Tab' || !this.dialogEl) return;
    const focusables = Array.from(
      this.dialogEl.querySelectorAll<HTMLElement>(FOCUSABLE_SEL)
    ).filter(
      element => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true'
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
    if (this.drawerWidth === 'sm' || this.drawerWidth === 'md' || this.drawerWidth === 'lg') {
      return WIDTH_MAP[this.drawerWidth];
    }
    return this.drawerWidth as string;
  }

  private get closeAnimationMs(): number {
    return resolveMotionTimeMs(
      TOKEN_DEFAULTS.animationDurationMedium1,
      TOKEN_DEFAULTS.animationDurationMedium1
    );
  }

  private finishClose() {
    if (this.open || !this.el.isConnected || !this.isSurfaceOpen) return;
    let restoreFocus = !this.replaced;
    if (!this.openedAsModal) {
      // dialog.close() would jump focus back to the opener; the owner chooses instead.
      const active = this.el.ownerDocument.activeElement as HTMLElement | null;
      if (active && this.dialogEl?.contains(active)) active.blur();
    }
    this.hideSurface();
    this.closing = false;
    this.shown = false;
    this.clearCloseTimer();
    // A modal returns focus to its trigger. A non-modal drawer pages through records,
    // so the owner knows which row or marker now matches and places focus itself.
    if (restoreFocus && this.openedAsModal && this.previousFocus?.isConnected) {
      this.previousFocus.focus();
      restoreFocus = false;
    }
    this.previousFocus = null;
    this.replaced = false;
    this.dsAfterClose.emit({ restoreFocus });
  }

  private renderIconAction(
    className: string,
    icon: string,
    label: string,
    tooltipSide: 'top' | 'bottom',
    onActivate: (event: CustomEvent<MouseEvent>) => void,
    inactive = false
  ) {
    return (
      <ds-tooltip class={`${className}-tooltip`} label={label} side={tooltipSide} size="sm">
        <ds-button-unfilled
          class={className}
          variant="icon"
          icon={icon}
          size="md"
          aria-label={label}
          activeFill={false}
          hasBorder={false}
          isInactive={inactive}
          onDsClick={onActivate}
        />
      </ds-tooltip>
    );
  }

  render() {
    const showFooter = this.hasFooterActions || this.navigation;
    return (
      <Host>
        <dialog
          ref={(element?: HTMLDialogElement) => {
            this.dialogEl = element ?? null;
          }}
          class={{
            'drawer-dialog': true,
            [`drawer-dialog--${this.side === 'start' ? 'start' : 'end'}`]: true,
            'drawer-dialog--modal': this.modal,
            'drawer-dialog--shown': this.shown,
            'drawer-dialog--closing': this.closing,
          }}
          aria-labelledby={this.titleId}
          aria-describedby={this.ariaDescribedby}
          onCancel={(event: globalThis.Event) => this.handleCancel(event)}
          onPointerDown={(event: PointerEvent) => this.handleBackdropPointerDown(event)}
          onKeyDown={(event: KeyboardEvent) => this.handleDialogKeyDown(event)}
          style={{ '--_drawer-width': this.resolvedWidth }}
        >
          <div class="drawer-header">
            {this.backLabel
              ? this.renderIconAction(
                  'drawer-back',
                  'ChevronLeft',
                  this.backLabel,
                  'bottom',
                  event => this.dsBack.emit(event.detail)
                )
              : null}
            <ds-text
              class="drawer-heading"
              as="h2"
              variant="text-body-medium"
              color="primary"
              emphasis
              lineTruncation={1}
              textId={this.titleId}
            >
              {this.heading}
            </ds-text>
            <div class="drawer-header__trailing">
              <div
                class={{
                  'drawer-header__actions': true,
                  'drawer-header__actions--empty': !this.hasHeaderActions,
                }}
              >
                <slot
                  name="header-actions"
                  onSlotchange={(event: globalThis.Event) => {
                    this.hasHeaderActions = this.hasAssignedContent(
                      'header-actions',
                      event.currentTarget as HTMLSlotElement
                    );
                  }}
                />
              </div>
              {this.hasHeaderActions ? (
                <ds-divider
                  class="drawer-header__divider"
                  orientation="vertical"
                  length="var(--dimension-size-300)"
                />
              ) : null}
              {this.renderIconAction(
                'drawer-close',
                'Cross',
                this.closeAriaLabel,
                'bottom',
                event => this.requestClose('close-button', event.detail)
              )}
            </div>
          </div>
          <div class={{ 'drawer-body': true, 'drawer-body--flush': this.bodyInset === 'none' }}>
            <slot />
          </div>
          <div class={{ 'drawer-footer': true, 'drawer-footer--empty': !showFooter }}>
            <div
              class={{
                'drawer-footer__actions': true,
                'drawer-footer__actions--empty': !this.hasFooterActions,
              }}
            >
              <slot
                name="footer"
                onSlotchange={(event: globalThis.Event) => {
                  this.hasFooterActions = this.hasAssignedContent(
                    'footer',
                    event.currentTarget as HTMLSlotElement
                  );
                }}
              />
            </div>
            {this.navigation ? (
              <div
                class="drawer-footer__navigation"
                role="group"
                aria-label={this.navigationAriaLabel}
              >
                {this.renderIconAction(
                  'drawer-previous',
                  'ChevronLeft',
                  this.previousAriaLabel,
                  'top',
                  () => this.page('previous'),
                  !this.previousAvailable
                )}
                {this.renderIconAction(
                  'drawer-next',
                  'ChevronRight',
                  this.nextAriaLabel,
                  'top',
                  () => this.page('next'),
                  !this.nextAvailable
                )}
              </div>
            ) : null}
          </div>
        </dialog>
      </Host>
    );
  }
}
