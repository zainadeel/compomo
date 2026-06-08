import { Component, Prop, State, Event, EventEmitter, Element, Watch, Listen, h, Host } from '@stencil/core';

export type MenuSide = 'top' | 'right' | 'bottom' | 'left';
export type MenuAlign = 'start' | 'center' | 'end';

export interface MenuItemData {
  label: string;
  value?: string;
  subtext?: string;
  isSelected?: boolean;
  isInactive?: boolean;
  isDestructive?: boolean;
  showToggle?: boolean;
  toggleValue?: boolean;
}

export interface MenuSection {
  header?: string;
  items: MenuItemData[];
}

const CLOSE_ANIMATION_MS = 220;
const VP_PAD = 4;

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
  @Prop() sideOffset: number = 4;
  @Prop() alignOffset: number = 0;
  @Prop() menuWidth: string | undefined;
  @Prop() minWidth: string | undefined;
  /** External trigger element to position against. Set via JS: menuEl.anchor = buttonEl */
  @Prop() anchor: HTMLElement | undefined;
  /** ID of the external trigger element for positioning */
  @Prop() anchorId: string | undefined;

  @State() private shouldRender: boolean = false;
  @State() private closing: boolean = false;
  @State() private pos: { x: number; y: number } = { x: 0, y: 0 };
  @State() private focusedIndex: number = 0;
  @State() private positionReady: boolean = false;

  @Event() dsClose!: EventEmitter<void>;
  @Event() dsSelect!: EventEmitter<MenuItemData>;

  private clickOutsideHandler: ((e: MouseEvent) => void) | null = null;
  private scrollResizeHandler: (() => void) | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private itemEls: HTMLElement[] = [];

  componentDidLoad() {
    if (this.open) this.onOpenChange(true);
  }

  disconnectedCallback() {
    this.teardownListeners();
  }

  @Watch('open')
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      this.shouldRender = true;
      this.closing = false;
      this.positionReady = false;
      requestAnimationFrame(() => {
        this.calculatePosition();
        this.positionReady = true;
        this.focusInitialItem();
        this.setupListeners();
      });
    } else if (this.shouldRender) {
      this.closing = true;
      this.teardownListeners();
      this.closeTimer = setTimeout(() => {
        this.shouldRender = false;
        this.closing = false;
        this.closeTimer = null;
      }, CLOSE_ANIMATION_MS);
    }
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
    return this.activeSections.flatMap(s => s.items);
  }

  private calculatePosition() {
    const anchorEl = this.resolvedAnchor;
    if (!anchorEl) return;
    const popup = this.el.querySelector('.menu-popup') as HTMLElement | null;
    if (!popup) return;

    const a = anchorEl.getBoundingClientRect();
    const pw = popup.offsetWidth || 200;
    const ph = popup.offsetHeight || 160;
    let x = 0, y = 0;

    switch (this.side) {
      case 'top':
        y = a.top - ph - this.sideOffset;
        x = this.align === 'start' ? a.left + this.alignOffset
          : this.align === 'end' ? a.right - pw + this.alignOffset
          : a.left + a.width / 2 - pw / 2 + this.alignOffset;
        break;
      case 'bottom':
        y = a.bottom + this.sideOffset;
        x = this.align === 'start' ? a.left + this.alignOffset
          : this.align === 'end' ? a.right - pw + this.alignOffset
          : a.left + a.width / 2 - pw / 2 + this.alignOffset;
        break;
      case 'left':
        x = a.left - pw - this.sideOffset;
        y = this.align === 'start' ? a.top + this.alignOffset
          : this.align === 'end' ? a.bottom - ph + this.alignOffset
          : a.top + a.height / 2 - ph / 2 + this.alignOffset;
        break;
      case 'right':
        x = a.right + this.sideOffset;
        y = this.align === 'start' ? a.top + this.alignOffset
          : this.align === 'end' ? a.bottom - ph + this.alignOffset
          : a.top + a.height / 2 - ph / 2 + this.alignOffset;
        break;
    }

    this.pos = {
      x: Math.min(Math.max(x, VP_PAD), window.innerWidth - pw - VP_PAD),
      y: Math.min(Math.max(y, VP_PAD), window.innerHeight - ph - VP_PAD),
    };
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

    this.scrollResizeHandler = () => this.calculatePosition();

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
  }

  @Listen('keydown')
  handleKeyDown(e: KeyboardEvent) {
    if (!this.open) return;
    const flat = this.flatItems;
    const enabled = flat.map((it, i) => ({ it, i })).filter(({ it }) => !it.isInactive).map(({ i }) => i);
    if (!enabled.length) return;

    const cur = enabled.indexOf(this.focusedIndex);
    const safe = cur < 0 ? 0 : cur;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault(); e.stopPropagation();
        this.focusedIndex = enabled[(safe + 1) % enabled.length];
        this.focusItem(this.focusedIndex);
        break;
      case 'ArrowUp':
        e.preventDefault(); e.stopPropagation();
        this.focusedIndex = enabled[(safe - 1 + enabled.length) % enabled.length];
        this.focusItem(this.focusedIndex);
        break;
      case 'Home':
        e.preventDefault(); e.stopPropagation();
        this.focusedIndex = enabled[0];
        this.focusItem(this.focusedIndex);
        break;
      case 'End':
        e.preventDefault(); e.stopPropagation();
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
    this.close();
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
          class={{ 'menu-popup': true, 'menu-popup--closing': this.closing }}
          style={popupStyle}
          role="menu"
          aria-label="Menu"
          aria-orientation="vertical"
        >
          {sections.map((section, si) => (
            <div
              key={si}
              class={{ 'menu-section': true, 'menu-section--divided': si < sections.length - 1 }}
              role={section.header ? 'group' : undefined}
              aria-label={section.header}
            >
              {section.header && (
                <div class="section-header" aria-hidden="true">
                  <span class="text-body-small-emphasis section-label">{section.header}</span>
                </div>
              )}
              {section.items.map(item => {
                const idx = flatIdx++;
                const isFocused = this.focusedIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    class={{
                      'menu-item': true,
                      'menu-item--selected': !!item.isSelected,
                      'menu-item--inactive': !!item.isInactive,
                      'menu-item--destructive': !!item.isDestructive,
                      'menu-item--focused': isFocused,
                    }}
                    role="menuitem"
                    disabled={item.isInactive}
                    tabIndex={isFocused ? 0 : -1}
                    onClick={() => this.handleItemClick(item)}
                    onFocus={() => { this.focusedIndex = idx; }}
                  >
                    <div class="menu-item__content">
                      <span class={item.isSelected ? 'text-body-medium-emphasis menu-item__label' : 'text-body-medium menu-item__label'}>
                        {item.label}
                      </span>
                      {item.subtext && (
                        <span class="text-body-small menu-item__subtext">{item.subtext}</span>
                      )}
                    </div>
                    {item.showToggle && (
                      <div class={{ 'menu-item__toggle': true, 'menu-item__toggle--on': !!item.toggleValue }} aria-hidden="true">
                        <div class="menu-item__toggle-thumb" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </Host>
    );
  }
}
