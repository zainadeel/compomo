import {
  Component,
  Prop,
  State,
  Event,
  EventEmitter,
  Element,
  Watch,
  Listen,
  h,
  Host,
} from '@stencil/core';
import {
  choicePopupMinWidth,
  CONTROL_SUPPORTING_TEXT_VARIANT,
  CONTROL_TEXT_VARIANT,
  resolveChoicePopupAlignOffset,
  resolveCssLengthPx,
  resolveMotionTimeMs,
  TOKEN_CSS_LENGTHS,
  TOKEN_DEFAULTS,
  type ChoicePopupAnchorAlignment,
  type ControlSize,
} from '../../utils';
import { AnchoredPositionController } from '../../utils/anchored-position-controller';
import type { MenuAlign, MenuSide } from './menu-position';
import {
  isMenuPickerSection,
  isMenuSwatchPickerSection,
  type MenuItemData,
  type MenuReorderDetail,
  type MenuSection,
} from './menu-types';
import { snapshotMenuSections } from './menu-sections';
import {
  createMenuReorderDetail,
  locateMenuItem,
  menuReorderableRange,
  moveReorderableMenuItemBefore,
  moveReorderableMenuItemBy,
} from './menu-reorder';

export type MenuSelectionMode = 'none' | 'single';
export type MenuSize = ControlSize;
const MENU_ITEM_TAG_SIZE: Record<MenuSize, 'md' | 'sm' | 'xs'> = {
  lg: 'md',
  md: 'sm',
  sm: 'xs',
  xs: 'xs',
};

const MENU_FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

@Component({
  tag: 'ds-menu',
  styleUrl: 'Menu.css',
  scoped: true,
})
export class Menu {
  @Element() el!: HTMLElement;

  @Prop({ mutable: true }) open: boolean = false;
  @Prop() items: MenuItemData[] = [];
  /** Choice-row density. */
  @Prop() size: MenuSize = 'md';
  /** Give ordinary rows mutually-exclusive menu semantics using isSelected. */
  @Prop() selectionMode: MenuSelectionMode = 'none';
  @Prop() sections: MenuSection[] = [];
  /** Preferred side; placement flips to the opposite side when that offers a better fit. */
  @Prop() side: MenuSide = 'bottom';
  @Prop() align: MenuAlign = 'start';
  /** Align choice-row edges to the anchor by default; use `popup-frame` only for custom frame geometry. */
  @Prop() anchorAlignment: ChoicePopupAnchorAlignment = 'choice-cell';
  /** Gap between anchor and menu — number (px) or TokoMo length (`var(--dimension-space-050)`, etc.). */
  @Prop() sideOffset: number | string = TOKEN_CSS_LENGTHS.space050;
  /** Cross-axis offset — number (px) or TokoMo length. */
  @Prop() alignOffset: number | string = 0;
  @Prop() menuWidth: string | undefined;
  @Prop() minWidth: string | undefined;
  /** External trigger element to position against. Set via JS: menuEl.anchor = buttonEl */
  @Prop() anchor: HTMLElement | undefined;
  /** ID of the external trigger element for positioning */
  @Prop() anchorId: string | undefined;
  /** Show a visible ring on the initially focused menu item. Use only when the opener was keyboard-driven. */
  @Prop() initialFocusVisible: boolean = false;
  /** Accessible name for the popup menu. */
  @Prop() menuLabel: string = 'Menu';

  @State() private shouldRender: boolean = false;
  @State() private closing: boolean = false;
  @State() private pos: { x: number; y: number } = { x: 0, y: 0 };
  @State() private focusedIndex: number = 0;
  @State() private positionReady: boolean = false;
  @State() private focusRingVisible: boolean = false;
  @State() private reorderFromFlat: number | null = null;
  @State() private reorderInsertBefore: number | null = null;
  @State() private reorderAnnouncement = '';

  @Event() dsClose!: EventEmitter<void>;
  /** Emitted after the popup's exit motion is complete and its rendered content is removed. */
  @Event() dsAfterClose!: EventEmitter<void>;
  @Event() dsSelect!: EventEmitter<MenuItemData>;
  /** Emitted when a generic `swatch-picker` section option is chosen. */
  @Event() dsSwatchSelect!: EventEmitter<string>;
  /** Emitted after a pointer drop or keyboard move; Menu never mutates item order. */
  @Event() dsReorder!: EventEmitter<MenuReorderDetail>;

  private clickOutsideHandler: ((e: MouseEvent) => void) | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private positionReadyCallback: (() => void) | undefined;
  private suppressItemClick = false;
  private reorderPointer: {
    pointerId: number;
    sectionIndex: number;
    fromIndex: number;
  } | null = null;
  /**
   * Anchored placement. The choice-cell measurement stays here on purpose: the
   * inner-cell align offset and the `--dimension-menu-width-xs` floor are Menu
   * semantics, not shared geometry.
   */
  private readonly position = new AnchoredPositionController({
    getAnchor: () => this.resolvedAnchor ?? null,
    getPopup: () => this.el.querySelector<HTMLElement>('.menu-popup'),
    measure: (anchorEl, popup) => {
      if (!this.open) return null;

      const anchorRect = anchorEl.getBoundingClientRect();
      const sectionInsetPx = this.viewportPadPx;
      if (!this.minWidth) {
        if (
          this.anchorAlignment === 'choice-cell' &&
          (this.side === 'top' || this.side === 'bottom')
        ) {
          popup.style.minWidth = `max(var(--dimension-menu-width-xs), ${choicePopupMinWidth(
            anchorRect.width,
            sectionInsetPx
          )}px)`;
        } else {
          popup.style.removeProperty('min-width');
        }
      }

      return {
        anchorRect,
        popupWidth: popup.offsetWidth || this.popupFallbackWidthPx,
        popupHeight: popup.offsetHeight || this.popupFallbackHeightPx,
        side: this.side,
        align: this.align,
        sideOffsetPx: this.sideOffsetPx,
        alignOffsetPx: resolveChoicePopupAlignOffset({
          align: this.align,
          alignOffsetPx: this.alignOffsetPx,
          sectionInsetPx,
          anchorAlignment: this.anchorAlignment,
        }),
        viewportPadPx: this.viewportPadPx,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      };
    },
    apply: ({ x, y }) => {
      this.pos = { x, y };
    },
    onReady: () => {
      this.positionReady = true;
    },
    liveUpdate: 'double-frame',
    topLayer: true,
  });
  /** Last content actually painted while open; retained unchanged through exit motion. */
  private lastRenderedSections: MenuSection[] = [];
  private closingSections: MenuSection[] | null = null;

  componentDidLoad() {
    if (this.open) this.onOpenChange(true);
  }

  disconnectedCallback() {
    this.cancelPositionRetry();
    this.cancelLivePositionUpdate();
    this.clearReorderPointer();
    this.teardownListeners();
  }

  @Watch('open')
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      this.teardownListeners();
      this.closingSections = null;
      this.shouldRender = true;
      this.closing = false;
      this.positionReady = false;
      this.focusRingVisible = this.initialFocusVisible;
      this.setupListeners();
      this.schedulePositionUpdate(() => {
        this.focusInitialItem();
      });
    } else if (this.shouldRender) {
      this.positionReadyCallback = undefined;
      this.cancelPositionRetry();
      this.captureClosingSections();
      this.closing = true;
      this.teardownListeners();
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

  @Watch('anchor')
  @Watch('anchorId')
  onAnchorChange() {
    if (this.open) this.schedulePositionUpdate();
  }

  @Watch('side')
  @Watch('align')
  @Watch('anchorAlignment')
  @Watch('sideOffset')
  @Watch('alignOffset')
  onPositionPropsChange() {
    if (this.open) this.schedulePositionUpdate();
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

  private get popupFallbackWidthPx(): number {
    return resolveCssLengthPx(TOKEN_DEFAULTS.menuWidthXs, TOKEN_DEFAULTS.menuWidthXs);
  }

  private get popupFallbackHeightPx(): number {
    return resolveCssLengthPx(TOKEN_DEFAULTS.menuFallbackHeight, TOKEN_DEFAULTS.menuFallbackHeight);
  }

  private get closeAnimationMs(): number {
    return resolveMotionTimeMs(TOKEN_DEFAULTS.motionShort2, TOKEN_DEFAULTS.animationDurationShort3);
  }

  private finishClose() {
    const popup = this.el.querySelector<HTMLElement>('.menu-popup');
    if (popup?.matches(':popover-open')) popup.hidePopover();
    this.shouldRender = false;
    this.closing = false;
    this.lastRenderedSections = [];
    this.closingSections = null;
    this.clearReorderPointer();
    this.reorderAnnouncement = '';
    this.dsAfterClose.emit();
  }

  private captureClosingSections() {
    if (this.closingSections) return;
    const visibleSections = this.lastRenderedSections.length
      ? this.lastRenderedSections
      : this.activeSections;
    this.closingSections = snapshotMenuSections(visibleSections);
  }

  private get resolvedAnchor(): HTMLElement | null {
    if (this.anchor) return this.anchor;
    if (this.anchorId) return document.getElementById(this.anchorId);
    return null;
  }

  private get anchorFocusTarget(): HTMLElement | null {
    const anchor = this.resolvedAnchor;
    if (!anchor) return null;
    if (anchor.matches(MENU_FOCUSABLE_SELECTOR)) return anchor;
    return anchor.querySelector<HTMLElement>(MENU_FOCUSABLE_SELECTOR) ?? anchor;
  }

  private focusAnchor() {
    const anchor = this.resolvedAnchor as
      (HTMLElement & { setFocus?: () => Promise<void> | void }) | null;
    if (anchor?.setFocus) {
      anchor.setFocus();
      return;
    }
    this.anchorFocusTarget?.focus();
  }

  private moveFocusAfterTab(backwards: boolean) {
    const anchor = this.anchorFocusTarget;
    if (!anchor) return;
    if (backwards) {
      anchor.focus();
      return;
    }

    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>(MENU_FOCUSABLE_SELECTOR)
    ).filter(
      element =>
        !element.closest('.menu-popup') &&
        !element.closest('[inert]') &&
        element.getClientRects().length > 0
    );
    const index = candidates.indexOf(anchor);
    (candidates[index + 1] ?? anchor).focus();
  }

  private compositeTabLeavesPopup(event: KeyboardEvent): boolean {
    const popup = this.el.querySelector<HTMLElement>('.menu-popup');
    if (!popup) return true;
    const focusables = Array.from(
      popup.querySelectorAll<HTMLElement>(MENU_FOCUSABLE_SELECTOR)
    ).filter(element => element.getClientRects().length > 0);
    const currentIndex = focusables.indexOf(event.target as HTMLElement);
    if (currentIndex < 0) return true;
    return event.shiftKey ? currentIndex === 0 : currentIndex === focusables.length - 1;
  }

  private get activeSections(): MenuSection[] {
    if (this.sections.length > 0) return this.sections;
    if (this.items.length > 0) return [{ items: this.items }];
    return [];
  }

  private get flatItems(): MenuItemData[] {
    return this.activeSections.flatMap(section =>
      isMenuPickerSection(section) ? [] : section.items
    );
  }

  /** Rich preference content is a non-modal dialog, not an ARIA action menu. */
  private get hasCompositeSections(): boolean {
    return this.activeSections.some(isMenuPickerSection);
  }

  private cancelPositionRetry() {
    this.position.cancel();
  }

  private cancelLivePositionUpdate() {
    this.position.cancel();
  }

  /** Reposition after the current scroll/layout frame without hiding the open popup. */
  private scheduleLivePositionUpdate() {
    this.position.scheduleLiveUpdate();
  }

  /** Retry until anchor + popup exist — do not reveal at 0,0 on a failed first pass. */
  private schedulePositionUpdate(onReady?: () => void) {
    if (!this.open) return;
    this.positionReady = false;
    // Opening often sets `open` and `anchorId` together. Each Watch reschedules
    // placement; keep the open-path ready callback so initial focus is not dropped.
    if (onReady) this.positionReadyCallback = onReady;
    const callback = this.positionReadyCallback;
    this.position.schedule(() => {
      if (this.positionReadyCallback === callback) {
        this.positionReadyCallback = undefined;
      }
      callback?.();
    });
  }

  /** @returns `true` when anchor and popup were found and `pos` was updated. */
  private calculatePosition(): boolean {
    return this.position.update();
  }

  /** Focus the selected item when present, otherwise the first enabled item. */
  private focusInitialItem() {
    if (this.hasCompositeSections) {
      requestAnimationFrame(() => {
        this.el.querySelector<HTMLElement>('.menu-popup [tabindex="0"]')?.focus();
      });
      return;
    }

    const flat = this.flatItems;
    const selectedIdx = flat.findIndex(it => it.isSelected && !it.isInactive);
    const firstEnabledIdx = flat.findIndex(it => !it.isInactive || !!it.reorderable);
    this.focusedIndex = selectedIdx >= 0 ? selectedIdx : firstEnabledIdx >= 0 ? firstEnabledIdx : 0;

    requestAnimationFrame(() => {
      const btns = this.el.querySelectorAll<HTMLElement>('.menu-item');
      btns[this.focusedIndex]?.focus();
    });
  }

  private setupListeners() {
    this.clickOutsideHandler = (e: MouseEvent) => {
      const t = e.target as Node;
      const popup = this.el.querySelector('.menu-popup');
      const anchorEl = this.resolvedAnchor;
      if (popup?.contains(t) || anchorEl?.contains(t)) return;
      this.close();
    };

    document.addEventListener('mousedown', this.clickOutsideHandler, true);
    this.position.observe();
  }

  private teardownListeners() {
    this.position.unobserve();
    if (this.clickOutsideHandler) {
      document.removeEventListener('mousedown', this.clickOutsideHandler, true);
      this.clickOutsideHandler = null;
    }
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  private close(restoreFocus = true) {
    this.captureClosingSections();
    if (restoreFocus) this.focusAnchor();
    this.dsClose.emit();
    this.open = false;
    this.onOpenChange(false);
  }

  @Listen('keydown')
  handleKeyDown(e: KeyboardEvent) {
    if (!this.shouldRender || this.closing) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
      return;
    }

    if (e.key === 'Tab') {
      if (this.hasCompositeSections && !this.compositeTabLeavesPopup(e)) return;
      e.preventDefault();
      this.close(false);
      this.moveFocusAfterTab(e.shiftKey);
      return;
    }

    if (this.hasCompositeSections) return;

    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.altKey && !e.ctrlKey && !e.shiftKey) {
      this.handleReorderKey(e);
      return;
    }

    const flat = this.flatItems;
    const enabled = flat
      .map((it, i) => ({ it, i }))
      .filter(({ it }) => !it.isInactive || !!it.reorderable)
      .map(({ i }) => i);
    if (!enabled.length) return;

    const cur = enabled.indexOf(this.focusedIndex);
    const safe = cur < 0 ? 0 : cur;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        e.stopPropagation();
        this.focusRingVisible = true;
        this.focusedIndex = enabled[(safe + 1) % enabled.length];
        this.focusItem(this.focusedIndex);
        break;
      case 'ArrowUp':
        e.preventDefault();
        e.stopPropagation();
        this.focusRingVisible = true;
        this.focusedIndex = enabled[(safe - 1 + enabled.length) % enabled.length];
        this.focusItem(this.focusedIndex);
        break;
      case 'Home':
        e.preventDefault();
        e.stopPropagation();
        this.focusRingVisible = true;
        this.focusedIndex = enabled[0];
        this.focusItem(this.focusedIndex);
        break;
      case 'End':
        e.preventDefault();
        e.stopPropagation();
        this.focusRingVisible = true;
        this.focusedIndex = enabled[enabled.length - 1];
        this.focusItem(this.focusedIndex);
        break;
    }
  }

  private focusItem(idx: number) {
    const btns = this.el.querySelectorAll<HTMLElement>('.menu-item');
    btns[idx]?.focus();
  }

  private handleItemClick(item: MenuItemData) {
    if (this.suppressItemClick) {
      this.suppressItemClick = false;
      return;
    }
    if (item.isInactive) return;
    // Consumers commonly change the item source while handling selection.
    // Capture first so the exit animation never paints the next menu context.
    this.captureClosingSections();
    this.dsSelect.emit(item);
  }

  private handleSwatchSelect(value: string) {
    this.dsSwatchSelect.emit(value);
  }

  private handleReorderKey(event: KeyboardEvent): void {
    const located = locateMenuItem(this.activeSections, this.focusedIndex);
    if (!located || !located.items[located.itemIndex]?.reorderable) return;

    const nextItems = moveReorderableMenuItemBy(
      located.items,
      located.itemIndex,
      event.key === 'ArrowUp' ? -1 : 1
    );
    if (!nextItems) return;

    event.preventDefault();
    event.stopPropagation();
    this.emitReorder(located.items, located.itemIndex, nextItems, located.sectionIndex);
  }

  private emitReorder(
    items: MenuItemData[],
    fromIndex: number,
    nextItems: MenuItemData[],
    sectionIndex: number
  ): void {
    const detail = createMenuReorderDetail(items, fromIndex, nextItems, sectionIndex);
    if (!detail) return;
    this.focusedIndex = this.flatIndexFor(sectionIndex, detail.toIndex);
    this.announceReorder(detail);
    this.dsReorder.emit(detail);
  }

  private flatIndexFor(sectionIndex: number, itemIndex: number): number {
    let flat = 0;
    for (let index = 0; index < this.activeSections.length; index += 1) {
      const section = this.activeSections[index];
      if (isMenuPickerSection(section)) continue;
      if (index === sectionIndex) return flat + itemIndex;
      flat += section.items.length;
    }
    return itemIndex;
  }

  private announceReorder(detail: MenuReorderDetail): void {
    const range = menuReorderableRange(detail.items, detail.toIndex);
    const count = range ? range.end - range.start + 1 : detail.items.length;
    const position = range ? detail.toIndex - range.start + 1 : detail.toIndex + 1;
    this.reorderAnnouncement = `${detail.item.label} moved to position ${position} of ${count}`;
  }

  private onReorderPointerDown(
    event: PointerEvent,
    sectionIndex: number,
    itemIndex: number,
    flatIndex: number
  ): void {
    if (event.button !== 0) return;
    const section = this.activeSections[sectionIndex];
    if (!section || isMenuPickerSection(section)) return;
    if (!section.items[itemIndex]?.reorderable) return;

    event.preventDefault();
    event.stopPropagation();
    this.suppressItemClick = true;
    this.focusRingVisible = false;
    this.focusedIndex = flatIndex;
    this.focusItem(flatIndex);
    this.reorderPointer = {
      pointerId: event.pointerId,
      sectionIndex,
      fromIndex: itemIndex,
    };
    this.reorderFromFlat = flatIndex;
    this.reorderInsertBefore = itemIndex;
    window.addEventListener('pointermove', this.onReorderPointerMove);
    window.addEventListener('pointerup', this.onReorderPointerUp);
    window.addEventListener('pointercancel', this.onReorderPointerCancel);
  }

  private onReorderPointerMove = (event: PointerEvent) => {
    const drag = this.reorderPointer;
    if (!drag || event.pointerId !== drag.pointerId) return;
    const section = this.activeSections[drag.sectionIndex];
    if (!section || isMenuPickerSection(section)) return;

    const insertBefore = this.resolveReorderInsertBefore(
      event.clientY,
      drag.sectionIndex,
      drag.fromIndex,
      section.items
    );
    if (insertBefore !== this.reorderInsertBefore) this.reorderInsertBefore = insertBefore;
  };

  private onReorderPointerUp = (event: PointerEvent) => {
    const drag = this.reorderPointer;
    if (!drag || event.pointerId !== drag.pointerId) return;

    const section = this.activeSections[drag.sectionIndex];
    const insertBefore = this.reorderInsertBefore;
    this.clearReorderPointer();
    queueMicrotask(() => {
      this.suppressItemClick = false;
    });
    if (!section || isMenuPickerSection(section) || insertBefore === null) return;

    const nextItems = moveReorderableMenuItemBefore(section.items, drag.fromIndex, insertBefore);
    if (!nextItems) return;
    this.emitReorder(section.items, drag.fromIndex, nextItems, drag.sectionIndex);
  };

  private onReorderPointerCancel = (event: PointerEvent) => {
    if (!this.reorderPointer || event.pointerId !== this.reorderPointer.pointerId) return;
    this.clearReorderPointer();
    queueMicrotask(() => {
      this.suppressItemClick = false;
    });
  };

  private resolveReorderInsertBefore(
    clientY: number,
    sectionIndex: number,
    fromIndex: number,
    items: MenuItemData[]
  ): number {
    const range = menuReorderableRange(items, fromIndex);
    if (!range) return fromIndex;

    const buttons = [...this.el.querySelectorAll<HTMLElement>('.menu-item')];
    const sectionStart = this.flatIndexFor(sectionIndex, 0);
    let insertBefore = range.end + 1;
    for (let itemIndex = range.start; itemIndex <= range.end; itemIndex += 1) {
      const row = buttons[sectionStart + itemIndex];
      if (!row) continue;
      const rect = row.getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) {
        insertBefore = itemIndex;
        break;
      }
    }
    return Math.min(Math.max(insertBefore, range.start), range.end + 1);
  }

  private clearReorderPointer(): void {
    if (this.reorderPointer) {
      window.removeEventListener('pointermove', this.onReorderPointerMove);
      window.removeEventListener('pointerup', this.onReorderPointerUp);
      window.removeEventListener('pointercancel', this.onReorderPointerCancel);
    }
    this.reorderPointer = null;
    this.reorderFromFlat = null;
    this.reorderInsertBefore = null;
  }

  render() {
    if (!this.shouldRender) return <Host style={{ display: 'contents' }} />;

    const sections = this.closing
      ? (this.closingSections ?? this.lastRenderedSections)
      : this.activeSections;
    const hasCompositeSections = sections.some(isMenuPickerSection);
    if (!this.closing) {
      this.lastRenderedSections = snapshotMenuSections(sections);
      this.closingSections = null;
    }
    let flatIdx = 0;
    const dragLocated =
      this.reorderFromFlat === null ? null : locateMenuItem(sections, this.reorderFromFlat);
    const dragRange = dragLocated
      ? menuReorderableRange(dragLocated.items, dragLocated.itemIndex)
      : null;

    const popupStyle: Record<string, string> = {
      position: 'fixed',
      left: '0',
      top: '0',
      transform: `translate(${Math.round(this.pos.x)}px, ${Math.round(this.pos.y)}px)`,
      zIndex: '9998',
      visibility: this.positionReady ? 'visible' : 'hidden',
    };

    if (this.menuWidth) popupStyle['width'] = this.menuWidth;
    if (this.minWidth) popupStyle['min-width'] = this.minWidth;

    return (
      <Host style={{ display: 'contents' }}>
        <div
          popover="manual"
          class={{
            'menu-popup': true,
            'menu-popup--closing': this.closing,
            'ds-choice-popup': true,
            'ds-choice-popup--closing': this.closing,
          }}
          style={popupStyle}
          role={hasCompositeSections ? 'dialog' : 'menu'}
          aria-label={this.menuLabel}
          aria-orientation={hasCompositeSections ? undefined : 'vertical'}
        >
          <div class="ds-choice-list">
            {sections.map((section, si) => (
              <div
                key={si}
                class={{
                  'menu-section': true,
                  'menu-section--divided': si < sections.length - 1,
                  'menu-section--swatch-picker': isMenuPickerSection(section),
                  'ds-choice-section': true,
                  'ds-chrome-column': true,
                  'ds-chrome-space--sm': true,
                  'ds-choice-section--divided': si < sections.length - 1,
                  'ds-choice-section--headed-after-first': si > 0 && Boolean(section.header),
                }}
                role={section.header ? 'group' : undefined}
                aria-label={section.header}
              >
                {section.header && (
                  <ds-text
                    class={`section-header ds-choice-section__header ds-control-section-heading ds-control--${this.size}`}
                    as="span"
                    variant={CONTROL_SUPPORTING_TEXT_VARIANT[this.size]}
                    emphasis
                    color="primary"
                    aria-hidden="true"
                  >
                    <span class="ds-choice-section__header-label">{section.header}</span>
                  </ds-text>
                )}
                {isMenuSwatchPickerSection(section) ? (
                  <ds-swatch-picker
                    value={section.value}
                    groupLabel={section.groupLabel ?? section.header ?? 'Swatch options'}
                    options={section.options ?? []}
                    sections={section.sections ?? []}
                    onDsChange={(e: CustomEvent<string>) => {
                      e.stopPropagation();
                      this.handleSwatchSelect(e.detail);
                    }}
                  />
                ) : (
                  section.items.map((item, itemIndex) => {
                    const idx = flatIdx++;
                    const isFocused = this.focusedIndex === idx;
                    const isSingleSelectionItem =
                      !hasCompositeSections && this.selectionMode === 'single' && !item.showSwitch;
                    const usesLeading = section.items.some(
                      candidate => candidate.reorderable || !!candidate.icon
                    );
                    const locked = !!item.isInactive && !item.reorderable;
                    const dragging = this.reorderFromFlat === idx;
                    const dropBefore =
                      dragLocated?.sectionIndex === si &&
                      dragRange !== null &&
                      itemIndex <= dragRange.end &&
                      this.reorderInsertBefore === itemIndex;
                    const dropAfter =
                      dragLocated?.sectionIndex === si &&
                      dragRange !== null &&
                      this.reorderInsertBefore === dragRange.end + 1 &&
                      itemIndex === dragRange.end;
                    return (
                      <button
                        key={item.value ?? `${si}-${item.label}`}
                        type="button"
                        class={{
                          'menu-item': true,
                          'ds-choice-item': true,
                          'ds-control-frame': true,
                          [`ds-control--${this.size}`]: true,
                          'ds-focus-ring-inset': true,
                          'ds-focus-ring--visible': isFocused && this.focusRingVisible,
                          'ds-interaction-fill': !locked,
                          'ds-interaction-fill--selected': !!item.isSelected && !locked,
                          'menu-item--selected': !!item.isSelected,
                          'menu-item--switch': !!item.showSwitch,
                          'ds-control-inactive': locked,
                          'menu-item--destructive': !!item.isDestructive,
                          'menu-item--focused': isFocused,
                          'menu-item--dragging': dragging,
                        }}
                        role={
                          hasCompositeSections
                            ? undefined
                            : item.showSwitch
                              ? 'menuitemcheckbox'
                              : isSingleSelectionItem
                                ? 'menuitemradio'
                                : 'menuitem'
                        }
                        aria-checked={
                          !hasCompositeSections && item.showSwitch
                            ? String(!!item.switchValue)
                            : isSingleSelectionItem
                              ? String(!!item.isSelected)
                              : undefined
                        }
                        aria-pressed={
                          hasCompositeSections
                            ? String(item.showSwitch ? !!item.switchValue : !!item.isSelected)
                            : undefined
                        }
                        aria-current={
                          !hasCompositeSections &&
                          !item.showSwitch &&
                          !isSingleSelectionItem &&
                          item.isSelected
                            ? 'true'
                            : undefined
                        }
                        aria-description={
                          item.reorderable
                            ? item.isInactive
                              ? 'Visibility cannot be changed. Alt + Arrow Up or Alt + Arrow Down moves this row.'
                              : 'Drag to reorder. Alt + Arrow Up or Alt + Arrow Down moves this row.'
                            : undefined
                        }
                        aria-disabled={item.isInactive ? 'true' : undefined}
                        disabled={locked}
                        tabIndex={hasCompositeSections ? 0 : isFocused ? 0 : -1}
                        onMouseDown={() => {
                          this.focusRingVisible = false;
                        }}
                        onClick={() => this.handleItemClick(item)}
                        onFocus={() => {
                          this.focusedIndex = idx;
                        }}
                      >
                        {(dropBefore || dropAfter) && (
                          <span
                            class={{
                              'menu-item__drop-rail': true,
                              'menu-item__drop-rail--before': dropBefore,
                              'menu-item__drop-rail--after': dropAfter,
                            }}
                            data-menu-drop-rail
                            aria-hidden="true"
                          />
                        )}
                        {item.reorderable ? (
                          <span
                            class="menu-item__handle ds-choice-item__icon ds-control-icon-box ds-interaction-fill__content"
                            data-menu-handle
                            aria-hidden="true"
                            onPointerDown={event =>
                              this.onReorderPointerDown(event, si, itemIndex, idx)
                            }
                            onClick={event => {
                              event.preventDefault();
                              event.stopPropagation();
                            }}
                          >
                            <ds-icon name="Drag" size={this.size} color="inherit" />
                          </span>
                        ) : usesLeading && item.icon ? (
                          <span
                            class="menu-item__icon ds-choice-item__icon ds-control-icon-box ds-interaction-fill__content"
                            aria-hidden="true"
                          >
                            <ds-icon name={item.icon} size={this.size} color="inherit" />
                          </span>
                        ) : usesLeading ? (
                          <span
                            class="menu-item__icon-spacer ds-choice-item__icon ds-control-icon-box"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div class="menu-item__content ds-choice-item__content ds-interaction-fill__content">
                          <ds-text
                            class="menu-item__label ds-choice-item__label ds-control-label-box"
                            as="span"
                            variant={CONTROL_TEXT_VARIANT[this.size]}
                            color={item.isSelected ? 'primary' : 'secondary'}
                          >
                            {item.label}
                          </ds-text>
                          {item.subtext && (
                            <ds-text
                              class="menu-item__subtext ds-choice-item__subtext ds-control-label-box"
                              as="span"
                              variant={CONTROL_SUPPORTING_TEXT_VARIANT[this.size]}
                              color="secondary"
                            >
                              {item.subtext}
                            </ds-text>
                          )}
                        </div>
                        {item.tag && (
                          <ds-tag
                            class="ds-choice-item__tag ds-interaction-fill__content"
                            label={item.tag.label}
                            size={MENU_ITEM_TAG_SIZE[this.size]}
                            intent={item.tag.intent ?? 'neutral'}
                            contrast={item.tag.contrast ?? 'faint'}
                            rounded={item.tag.rounded ?? false}
                            isInset
                          />
                        )}
                        {item.dot && (
                          <span
                            class="menu-item__dot-box ds-interaction-fill__content"
                            aria-hidden="true"
                          >
                            <ds-badge
                              class="menu-item__dot"
                              variant="dot"
                              hasRing={false}
                              label=""
                            />
                          </span>
                        )}
                        {item.showSwitch && (
                          <ds-switch
                            class="menu-item__switch ds-interaction-fill__content"
                            size={this.size}
                            checked={!!item.switchValue}
                            isInactive={!!item.isInactive}
                            presentation
                          />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            ))}
          </div>
        </div>
        <div class="ds-visually-hidden" role="status" aria-live="polite">
          {this.reorderAnnouncement}
        </div>
      </Host>
    );
  }
}
