import { Component, Prop, State, Event, EventEmitter, Element, Watch, Listen, h, Host } from '@stencil/core';
import { resolveCssLengthPx, resolveMotionTimeMs, TOKEN_CSS_LENGTHS, TOKEN_DEFAULTS } from '../../utils';
import { computeMenuPosition, type MenuAlign, type MenuSide } from './menu-position';
import type { MenuItemData, MenuSection } from './menu-types';
import { isMenuGradientPickerSection } from './menu-types';
import type { ShellGradientPreset } from '../../shell/shell-gradient-presets';

/** rAF retries while the popup mounts or the anchor resolves. */
const POSITION_RETRY_BUDGET = 8;

@Component({
  tag: 'ds-menu',
  styleUrl: 'Menu.css',
  scoped: true,
})
export class Menu {
  @Element() el!: HTMLElement;

  @Prop({ mutable: true }) open: boolean = false;
  @Prop() items: MenuItemData[] = [];
  @Prop() sections: MenuSection[] = [];
  @Prop() side: MenuSide = 'bottom';
  @Prop() align: MenuAlign = 'start';
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

  private get activeSections(): MenuSection[] {
    if (this.sections.length > 0) return this.sections;
    if (this.items.length > 0) return [{ items: this.items }];
    return [];
  }

  private get flatItems(): MenuItemData[] {
    return this.activeSections.flatMap(section =>
      isMenuGradientPickerSection(section) ? [] : section.items,
    );
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

    this.pos = computeMenuPosition({
      anchorRect: anchorEl.getBoundingClientRect(),
      popupWidth: popup.offsetWidth || this.popupFallbackWidthPx,
      popupHeight: popup.offsetHeight || this.popupFallbackHeightPx,
      side: this.side,
      align: this.align,
      sideOffsetPx: this.sideOffsetPx,
      alignOffsetPx: this.alignOffsetPx,
      viewportPadPx: this.viewportPadPx,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    });
    return true;
  }

  /** Focus the selected item when present, otherwise the first enabled item. */
  private focusInitialItem() {
    const flat = this.flatItems;
    const selectedIdx = flat.findIndex(it => it.isSelected && !it.isInactive);
    const firstEnabledIdx = flat.findIndex(it => !it.isInactive);
    this.focusedIndex = selectedIdx >= 0
      ? selectedIdx
      : (firstEnabledIdx >= 0 ? firstEnabledIdx : 0);

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

  private close() {
    this.resolvedAnchor?.focus();
    this.dsClose.emit();
    this.open = false;
    this.onOpenChange(false);
  }

  @Listen('keydown')
  handleKeyDown(e: KeyboardEvent) {
    if (!this.shouldRender || this.closing) return;
    const flat = this.flatItems;
    const enabled = flat.map((it, i) => ({ it, i })).filter(({ it }) => !it.isInactive).map(({ i }) => i);
    if (!enabled.length) return;

    const cur = enabled.indexOf(this.focusedIndex);
    const safe = cur < 0 ? 0 : cur;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault(); e.stopPropagation();
        this.focusRingVisible = true;
        this.focusedIndex = enabled[(safe + 1) % enabled.length];
        this.focusItem(this.focusedIndex);
        break;
      case 'ArrowUp':
        e.preventDefault(); e.stopPropagation();
        this.focusRingVisible = true;
        this.focusedIndex = enabled[(safe - 1 + enabled.length) % enabled.length];
        this.focusItem(this.focusedIndex);
        break;
      case 'Home':
        e.preventDefault(); e.stopPropagation();
        this.focusRingVisible = true;
        this.focusedIndex = enabled[0];
        this.focusItem(this.focusedIndex);
        break;
      case 'End':
        e.preventDefault(); e.stopPropagation();
        this.focusRingVisible = true;
        this.focusedIndex = enabled[enabled.length - 1];
        this.focusItem(this.focusedIndex);
        break;
      case 'Escape':
        e.preventDefault();
        this.close();
        break;
      case 'Tab':
        e.preventDefault();
        this.close();
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
          role="menu"
          aria-label={this.menuLabel}
          aria-orientation="vertical"
        >
          <div class="ds-choice-list">
          {sections.map((section, si) => (
            <div
              key={si}
              class={{
                'menu-section': true,
                'menu-section--divided': si < sections.length - 1,
                'menu-section--gradient-picker': isMenuGradientPickerSection(section),
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
                <ds-shell-gradient-picker
                  value={section.value}
                  onDsChange={(e: CustomEvent<ShellGradientPreset>) => {
                    e.stopPropagation();
                    this.handleGradientSelect(e.detail);
                  }}
                />
              ) : (
                section.items.map(item => {
                const idx = flatIdx++;
                const isFocused = this.focusedIndex === idx;
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
                    role={item.showSwitch ? 'menuitemcheckbox' : 'menuitem'}
                    aria-checked={item.showSwitch ? String(!!item.switchValue) : undefined}
                    aria-current={!item.showSwitch && item.isSelected ? 'true' : undefined}
                    disabled={item.isInactive}
                    tabIndex={isFocused ? 0 : -1}
                    onMouseDown={() => { this.focusRingVisible = false; }}
                    onClick={() => this.handleItemClick(item)}
                    onFocus={() => { this.focusedIndex = idx; }}
                  >
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
                        <ds-text class="menu-item__subtext ds-choice-item__subtext" as="span" variant="text-body-small" color="secondary">
                          {item.subtext}
                        </ds-text>
                      )}
                    </div>
                    {item.dot && (
                      <span class="menu-item__dot-box ds-interaction-fill__content" aria-hidden="true">
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
              }))}
            </div>
          ))}
          </div>
        </div>
      </Host>
    );
  }
}
