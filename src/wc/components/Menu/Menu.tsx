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
  resolveChoicePopupAlignOffset,
  resolveCssLengthPx,
  resolveMotionTimeMs,
  TOKEN_CSS_LENGTHS,
  TOKEN_DEFAULTS,
  type ChoicePopupAnchorAlignment,
} from '../../utils';
import { computeMenuPosition, type MenuAlign, type MenuSide } from './menu-position';
import type { MenuItemData, MenuSection } from './menu-types';

export type MenuSelectionMode = 'none' | 'single';
import {
  isMenuGradientPickerSection,
  isMenuPickerSection,
  isMenuSwatchPickerSection,
} from './menu-types';
import {
  shellGradientPickerSections,
  type ShellGradientPreset,
} from '../../shell/shell-gradient-presets';

/** rAF retries while the popup mounts or the anchor resolves. */
const POSITION_RETRY_BUDGET = 8;
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
  /** Give ordinary rows mutually-exclusive radio-menu semantics using isSelected. */
  @Prop() selectionMode: MenuSelectionMode = 'none';
  @Prop() sections: MenuSection[] = [];
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

  @Event() dsClose!: EventEmitter<void>;
  @Event() dsSelect!: EventEmitter<MenuItemData>;
  /** Emitted when a `gradient-picker` section swatch is chosen. */
  @Event() dsGradientSelect!: EventEmitter<ShellGradientPreset>;
  /** Emitted when a generic `swatch-picker` section option is chosen. */
  @Event() dsSwatchSelect!: EventEmitter<string>;

  private clickOutsideHandler: ((e: MouseEvent) => void) | null = null;
  private scrollResizeHandler: (() => void) | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private itemEls: HTMLElement[] = [];
  private positionRetryRaf: number | null = null;
  private listenersReady = false;

  componentDidLoad() {
    if (this.open) this.onOpenChange(true);
  }

  disconnectedCallback() {
    this.cancelPositionRetry();
    this.teardownListeners();
  }

  @Watch('open')
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      this.teardownListeners();
      this.shouldRender = true;
      this.closing = false;
      this.positionReady = false;
      this.listenersReady = false;
      this.focusRingVisible = this.initialFocusVisible;
      this.listenersReady = true;
      this.setupListeners();
      this.schedulePositionUpdate(() => {
        this.focusInitialItem();
      });
    } else if (this.shouldRender) {
      this.cancelPositionRetry();
      this.closing = true;
      this.teardownListeners();
      this.listenersReady = false;
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
    this.shouldRender = false;
    this.closing = false;
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
      | (HTMLElement & { setFocus?: () => Promise<void> | void })
      | null;
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
    if (this.positionRetryRaf !== null) {
      cancelAnimationFrame(this.positionRetryRaf);
      this.positionRetryRaf = null;
    }
  }

  /** Retry until anchor + popup exist — do not reveal at 0,0 on a failed first pass. */
  private schedulePositionUpdate(onReady?: () => void) {
    if (!this.open) return;

    this.cancelPositionRetry();
    this.positionReady = false;

    let remaining = POSITION_RETRY_BUDGET;

    const attempt = () => {
      this.positionRetryRaf = null;
      if (!this.open) return;

      if (this.calculatePosition()) {
        this.positionReady = true;
        onReady?.();
        return;
      }

      if (remaining > 0) {
        remaining -= 1;
        this.positionRetryRaf = requestAnimationFrame(attempt);
      }
    };

    this.positionRetryRaf = requestAnimationFrame(attempt);
  }

  /** @returns `true` when anchor and popup were found and `pos` was updated. */
  private calculatePosition(): boolean {
    const anchorEl = this.resolvedAnchor;
    if (!anchorEl) return false;
    const popup = this.el.querySelector('.menu-popup') as HTMLElement | null;
    if (!popup) return false;

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

    this.pos = computeMenuPosition({
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
    });
    return true;
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
    const firstEnabledIdx = flat.findIndex(it => !it.isInactive);
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

    this.scrollResizeHandler = () => {
      if (this.shouldRender && !this.closing) this.calculatePosition();
    };

    document.addEventListener('mousedown', this.clickOutsideHandler, true);
    window.addEventListener('scroll', this.scrollResizeHandler, true);
    window.addEventListener('resize', this.scrollResizeHandler);
  }

  private teardownListeners() {
    if (this.clickOutsideHandler) {
      document.removeEventListener('mousedown', this.clickOutsideHandler, true);
      this.clickOutsideHandler = null;
    }
    if (this.scrollResizeHandler) {
      window.removeEventListener('scroll', this.scrollResizeHandler, true);
      window.removeEventListener('resize', this.scrollResizeHandler);
      this.scrollResizeHandler = null;
    }
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  private close(restoreFocus = true) {
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

    const flat = this.flatItems;
    const enabled = flat
      .map((it, i) => ({ it, i }))
      .filter(({ it }) => !it.isInactive)
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
    if (item.isInactive) return;
    this.dsSelect.emit(item);
  }

  private handleGradientSelect(preset: ShellGradientPreset) {
    this.dsGradientSelect.emit(preset);
  }

  private handleSwatchSelect(value: string) {
    this.dsSwatchSelect.emit(value);
  }

  render() {
    if (!this.shouldRender) return <Host style={{ display: 'contents' }} />;

    const sections = this.activeSections;
    let flatIdx = 0;

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
          class={{
            'menu-popup': true,
            'menu-popup--closing': this.closing,
            'ds-choice-popup': true,
            'ds-choice-popup--closing': this.closing,
          }}
          style={popupStyle}
          role={this.hasCompositeSections ? 'dialog' : 'menu'}
          aria-label={this.menuLabel}
          aria-orientation={this.hasCompositeSections ? undefined : 'vertical'}
        >
          <div class="ds-choice-list">
            {sections.map((section, si) => (
              <div
                key={si}
                class={{
                  'menu-section': true,
                  'menu-section--divided': si < sections.length - 1,
                  'menu-section--gradient-picker': isMenuPickerSection(section),
                  'ds-choice-section': true,
                  'ds-choice-section--divided': si < sections.length - 1,
                }}
                role={section.header ? 'group' : undefined}
                aria-label={section.header}
              >
                {section.header && (
                  <ds-text
                    class="section-header ds-choice-section__header ds-control--md"
                    as="span"
                    variant="text-body-small"
                    emphasis
                    color="primary"
                    aria-hidden="true"
                  >
                    {section.header}
                  </ds-text>
                )}
                {isMenuGradientPickerSection(section) ? (
                  <ds-swatch-picker
                    value={section.value}
                    groupLabel={section.header ?? 'Shell gradient theme'}
                    sections={shellGradientPickerSections()}
                    onDsChange={(e: CustomEvent<string>) => {
                      e.stopPropagation();
                      this.handleGradientSelect(e.detail as ShellGradientPreset);
                    }}
                  />
                ) : isMenuSwatchPickerSection(section) ? (
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
                  section.items.map(item => {
                    const idx = flatIdx++;
                    const isFocused = this.focusedIndex === idx;
                    const isRadioItem =
                      !this.hasCompositeSections &&
                      this.selectionMode === 'single' &&
                      !item.showSwitch;
                    return (
                      <button
                        key={idx}
                        type="button"
                        class={{
                          'menu-item': true,
                          'ds-choice-item': true,
                          'ds-control--md': true,
                          'ds-focus-ring-inset': true,
                          'ds-focus-ring--visible': isFocused && this.focusRingVisible,
                          'ds-interaction-fill': !item.isInactive,
                          'ds-interaction-fill--selected': !!item.isSelected && !item.isInactive,
                          'menu-item--selected': !!item.isSelected,
                          'ds-control-inactive': !!item.isInactive,
                          'menu-item--destructive': !!item.isDestructive,
                          'menu-item--focused': isFocused,
                        }}
                        role={
                          this.hasCompositeSections
                            ? undefined
                            : item.showSwitch
                            ? 'menuitemcheckbox'
                            : isRadioItem
                            ? 'menuitemradio'
                            : 'menuitem'
                        }
                        aria-checked={
                          !this.hasCompositeSections && item.showSwitch
                            ? String(!!item.switchValue)
                            : isRadioItem
                            ? String(!!item.isSelected)
                            : undefined
                        }
                        aria-pressed={
                          this.hasCompositeSections
                            ? String(item.showSwitch ? !!item.switchValue : !!item.isSelected)
                            : undefined
                        }
                        aria-current={
                          !this.hasCompositeSections &&
                          !item.showSwitch &&
                          !isRadioItem &&
                          item.isSelected
                            ? 'true'
                            : undefined
                        }
                        disabled={item.isInactive}
                        tabIndex={this.hasCompositeSections ? 0 : isFocused ? 0 : -1}
                        onMouseDown={() => {
                          this.focusRingVisible = false;
                        }}
                        onClick={() => this.handleItemClick(item)}
                        onFocus={() => {
                          this.focusedIndex = idx;
                        }}
                      >
                        {isRadioItem && (
                          <span
                            class="menu-item__radio-box ds-interaction-fill__content"
                            aria-hidden="true"
                          >
                            <span
                              class={{
                                'menu-item__radio': true,
                                'menu-item__radio--checked': !!item.isSelected,
                              }}
                            >
                              {item.isSelected && <span class="menu-item__radio-dot" />}
                            </span>
                          </span>
                        )}
                        <div class="menu-item__content ds-choice-item__content ds-interaction-fill__content">
                          <ds-text
                            class="menu-item__label ds-choice-item__label"
                            as="span"
                            variant="text-body-medium"
                            color={item.isSelected ? 'primary' : 'secondary'}
                          >
                            {item.label}
                          </ds-text>
                          {item.subtext && (
                            <ds-text
                              class="menu-item__subtext ds-choice-item__subtext"
                              as="span"
                              variant="text-body-small"
                              color="secondary"
                            >
                              {item.subtext}
                            </ds-text>
                          )}
                        </div>
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
                            size="md"
                            checked={!!item.switchValue}
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
      </Host>
    );
  }
}
