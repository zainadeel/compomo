import { Component, Prop, State, Event, EventEmitter, Element, Watch, Listen, h, Host } from '@stencil/core';
import type { MenuItemData } from '../Menu/menu-types';

export interface SelectOption {
  label: string;
  value: string;
}

@Component({
  tag: 'ds-select',
  styleUrl: 'Select.css',
  scoped: true,
})
export class Select {
  @Element() el!: HTMLElement;

  /**
   * Array of options. Set via JS property.
   * @example el.options = [{ label: 'Apple', value: 'apple' }];
   */
  @Prop() options: SelectOption[] = [];

  /** Currently selected value. */
  @Prop({ mutable: true }) value: string = '';

  /** Placeholder shown when no value is selected. */
  @Prop() placeholder: string = 'Select option';

  /** Disables interaction. */
  @Prop() inactive: boolean = false;

  @Prop({ attribute: 'aria-label' }) ariaLabel: string | undefined;
  @Prop({ attribute: 'aria-labelledby' }) ariaLabelledby: string | undefined;

  /** Emits the selected value string. */
  @Event() dsChange!: EventEmitter<string>;

  @State() private isOpen: boolean = false;

  private triggerEl: HTMLButtonElement | null = null;
  private menuEl: HTMLDsMenuElement | null = null;

  componentDidLoad() {
    // Wire up the menu anchor to the trigger button
    if (this.menuEl && this.triggerEl) {
      this.menuEl.anchor = this.triggerEl;
    }
    // Listen for menu selection events
    this.menuEl?.addEventListener('dsSelect', (e: Event) => {
      const detail = (e as CustomEvent<MenuItemData>).detail;
      if (detail?.value !== undefined) {
        this.value = String(detail.value);
        this.dsChange.emit(this.value);
      }
      this.isOpen = false;
    });
    // Listen for menu close event
    this.menuEl?.addEventListener('dsClose', () => {
      this.isOpen = false;
    });
  }

  @Watch('isOpen')
  onIsOpenChange(open: boolean) {
    if (this.menuEl) {
      this.menuEl.open = open;
    }
  }

  @Watch('options')
  onOptionsChange() {
    this.syncMenuItems();
  }

  @Watch('value')
  onValueChange() {
    this.syncMenuItems();
  }

  private syncMenuItems() {
    if (!this.menuEl) return;
    this.menuEl.items = this.options.map(opt => ({
      label: opt.label,
      value: opt.value,
      isSelected: opt.value === this.value,
    }));
  }

  private open() {
    if (this.inactive || !this.options.length) return;
    // Sync menu width to trigger width
    if (this.menuEl && this.triggerEl) {
      this.menuEl.menuWidth = `${this.triggerEl.offsetWidth}px`;
      this.menuEl.anchor = this.triggerEl;
    }
    this.syncMenuItems();
    this.isOpen = true;
  }

  private close() {
    this.isOpen = false;
  }

  private toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  @Listen('keydown')
  handleKeyDown(e: KeyboardEvent) {
    // Only handle keydown on the trigger button
    if (document.activeElement !== this.triggerEl) return;

    if (!this.isOpen) {
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowUp':
        case 'Enter':
        case ' ':
          e.preventDefault();
          this.open();
          break;
      }
    } else {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
        this.triggerEl?.focus();
      }
    }
  }

  private get selectedLabel(): string {
    const found = this.options.find(o => o.value === this.value);
    return found?.label ?? '';
  }

  private get hasSelection(): boolean {
    return !!this.options.find(o => o.value === this.value);
  }

  render() {
    const label = this.hasSelection ? this.selectedLabel : this.placeholder;
    const showPlaceholder = !this.hasSelection;

    return (
      <Host class={{ 'select-host': true, inactive: this.inactive }}>
        <button
          ref={el => {
            this.triggerEl = (el as HTMLButtonElement) ?? null;
          }}
          type="button"
          class={{ trigger: true, 'trigger--open': this.isOpen }}
          disabled={this.inactive}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={this.isOpen}
          aria-label={this.ariaLabel}
          aria-labelledby={this.ariaLabelledby}
          onClick={() => this.toggle()}
        >
          <span class={{ 'trigger__label': true, 'trigger__label--placeholder': showPlaceholder }}>
            {label}
          </span>
          <svg
            class="trigger__chevron"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M4 6L8 10L12 6"
              stroke="currentColor"
              stroke-width="1.25"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <ds-menu
          ref={el => {
            this.menuEl = (el as HTMLDsMenuElement) ?? null;
          }}
          side="bottom"
          align="start"
        />
      </Host>
    );
  }
}
