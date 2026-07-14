import { AttachInternals, Component, Prop, State, Event, EventEmitter, Element, Watch, Listen, h, Host } from '@stencil/core';
import {
  controlWidthClass,
  CONTROL_TEXT_VARIANT,
  resolveCssLengthPx,
  TOKEN_DEFAULTS,
  type ControlWidth,
} from '../../utils';
import type { MenuItemData } from '../Menu/menu-types';

export interface SelectOption {
  label: string;
  value: string;
}

export type SelectSize = 'md' | 'sm' | 'xs';

export type SelectWidth = ControlWidth;

/** `ds-icon` size matching control-density icon metrics. */
const ICON_SIZE: Record<SelectSize, 'md' | 'sm' | 'xs'> = {
  md: 'md',
  sm: 'sm',
  xs: 'xs',
};

/**
 * Dropdown select — unfilled-button chrome (label + trailing ChevronDown) in
 * control-density sizes, with `ds-menu` for the option list.
 */
@Component({
  tag: 'ds-select',
  styleUrl: 'Select.css',
  scoped: true,
  formAssociated: true,
})
export class Select {
  @Element() el!: HTMLElement;
  @AttachInternals() internals!: ElementInternals;

  /**
   * Array of options. Set via JS property.
   * @example el.options = [{ label: 'Apple', value: 'apple' }];
   */
  @Prop() options: SelectOption[] = [];

  /** Currently selected value. */
  @Prop({ mutable: true }) value: string = '';

  @Prop({ reflect: true }) name: string | undefined;

  @Prop({ reflect: true }) disabled: boolean = false;

  @Prop({ reflect: true }) required: boolean = false;

  @Prop() requiredMessage: string = 'This field is required.';

  /** Placeholder shown when no value is selected. */
  @Prop() placeholder: string = 'Select';

  /** Control density (height, padding, icon, type). */
  @Prop() size: SelectSize = 'md';

  /** Width fit — fill the parent (default) or hug content. */
  @Prop() width: SelectWidth = 'fill';

  /** Disables interaction (25% opacity via ds-control-inactive). */
  @Prop() isInactive: boolean = false;

  /**
   * When a value is selected, render the selected interaction fill (same recipe
   * as unfilled-button `activeFill`). Default `true`. Pass `false` for
   * foreground-only selection (primary label, no fill).
   * A selected value promotes the label to primary; chevron stays secondary.
   */
  @Prop() activeFill: boolean = true;

  /** Show a 1px secondary inset border. Default on (matches unfilled button). */
  @Prop() hasBorder: boolean = true;

  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;
  @Prop({ attribute: 'aria-labelledby' }) ariaLabelledby: string | undefined;

  /** Emits the selected value string. */
  @Event() dsChange!: EventEmitter<string>;

  @State() private isOpen: boolean = false;

  private triggerEl: HTMLButtonElement | null = null;
  private menuEl: HTMLDsMenuElement | null = null;
  /** True when the open was keyboard-driven — menu shows initial focus ring. */
  private openWithFocusVisible = false;
  private initialValue = '';
  @State() private formDisabled = false;

  componentWillLoad() {
    this.initialValue = this.value;
    this.syncFormValue();
  }

  componentDidLoad() {
    if (this.menuEl && this.triggerEl) {
      this.menuEl.anchor = this.triggerEl;
    }
    this.menuEl?.addEventListener('dsSelect', this.handleMenuSelect);
    this.menuEl?.addEventListener('dsClose', this.handleMenuClose);
    this.syncMenuItems();
  }

  disconnectedCallback() {
    this.menuEl?.removeEventListener('dsSelect', this.handleMenuSelect);
    this.menuEl?.removeEventListener('dsClose', this.handleMenuClose);
  }

  @Watch('isOpen')
  onIsOpenChange(open: boolean) {
    if (!this.menuEl) return;
    this.menuEl.initialFocusVisible = open && this.openWithFocusVisible;
    this.menuEl.open = open;
  }

  @Watch('options')
  onOptionsChange() {
    this.syncMenuItems();
  }

  @Watch('value')
  onValueChange() {
    this.syncMenuItems();
  }

  @Watch('value')
  @Watch('disabled')
  @Watch('isInactive')
  @Watch('required')
  syncFormValue() {
    const inactive = this.isInactive || this.disabled || this.formDisabled;
    this.internals.setFormValue(inactive ? null : this.value);
    const missing = this.required && !inactive && this.value.length === 0;
    this.internals.setValidity(missing ? { valueMissing: true } : {}, missing ? this.requiredMessage : '');
  }

  formDisabledCallback(disabled: boolean) {
    this.formDisabled = disabled;
    this.syncFormValue();
  }

  formResetCallback() {
    this.value = this.initialValue;
  }

  formStateRestoreCallback(state: string | File | FormData | null) {
    this.value = typeof state === 'string' ? state : '';
  }

  private handleMenuSelect = (e: Event) => {
    const detail = (e as CustomEvent<MenuItemData>).detail;
    if (detail?.value !== undefined) {
      this.value = String(detail.value);
      this.dsChange.emit(this.value);
    }
    this.close();
  };

  private handleMenuClose = () => {
    this.close();
  };

  private syncMenuItems() {
    if (!this.menuEl) return;
    this.menuEl.items = this.options.map(opt => ({
      label: opt.label,
      value: opt.value,
      isSelected: opt.value === this.value,
    }));
  }

  /**
   * Size/place the menu so option labels line up with the select label.
   * Menu section padding insets items; we expand min-width by that chrome and
   * shift left by the same amount (`alignOffset`). Menu can grow wider than
   * the field (left-bottom / `align="start"`) when labels need more room.
   */
  private syncMenuLayout() {
    if (!this.menuEl || !this.triggerEl) return;
    const sectionPadPx = resolveCssLengthPx(TOKEN_DEFAULTS.space050, TOKEN_DEFAULTS.space050);
    const triggerW = this.triggerEl.offsetWidth;
    // Prefer min-width over fixed width so long options can grow the menu.
    this.menuEl.menuWidth = '';
    this.menuEl.minWidth = `${triggerW + sectionPadPx * 2}px`;
    this.menuEl.alignOffset = -sectionPadPx;
    this.menuEl.anchor = this.triggerEl;
  }

  private open(opts: { focusVisible: boolean } = { focusVisible: false }) {
    if (this.isInactive || this.disabled || this.formDisabled || !this.options.length) return;
    this.openWithFocusVisible = opts.focusVisible;
    this.syncMenuLayout();
    this.syncMenuItems();
    this.isOpen = true;
  }

  private close() {
    this.isOpen = false;
    this.openWithFocusVisible = false;
  }

  private toggle(opts: { focusVisible: boolean }) {
    if (this.isOpen) {
      this.close();
    } else {
      this.open(opts);
    }
  }

  @Listen('keydown')
  handleKeyDown(e: KeyboardEvent) {
    if (document.activeElement !== this.triggerEl) return;

    if (!this.isOpen) {
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowUp':
        case 'Enter':
        case ' ':
          e.preventDefault();
          this.open({ focusVisible: true });
          break;
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
      this.triggerEl?.focus();
    }
  }

  private get selectedLabel(): string {
    return this.options.find(o => o.value === this.value)?.label ?? '';
  }

  private get hasSelection(): boolean {
    return this.options.some(o => o.value === this.value);
  }

  render() {
    const inactive = this.isInactive || this.disabled || this.formDisabled;
    const showPlaceholder = !this.hasSelection;
    const hasValue = !showPlaceholder;
    const label = showPlaceholder ? this.placeholder : this.selectedLabel;
    const textVariant = CONTROL_TEXT_VARIANT[this.size];
    const iconSize = ICON_SIZE[this.size];
    const density = `ds-control--${this.size}`;
    // Opening the menu is transient interaction, not selected product state.
    const showSelectedFill = !inactive && this.activeFill && hasValue;

    return (
      <Host
        class={{
          'select-host': true,
          'ds-control-inactive': inactive,
          'ds-control--md': this.size === 'md',
          'ds-control--sm': this.size === 'sm',
          'ds-control--xs': this.size === 'xs',
          ...controlWidthClass(this.width),
        }}
      >
        <button
          ref={el => {
            this.triggerEl = (el as HTMLButtonElement) ?? null;
          }}
          type="button"
          class={{
            trigger: true,
            'ds-focus-ring-inset': true,
            'ds-interaction-fill': true,
            'ds-interaction-fill--selected': showSelectedFill,
            'trigger--bordered': this.hasBorder,
            'trigger--placeholder': showPlaceholder,
            'trigger--has-value': hasValue,
            [density]: true,
          }}
          disabled={inactive}
          role="combobox"
          aria-haspopup="menu"
          aria-expanded={String(this.isOpen)}
          aria-label={this.ariaLabel}
          aria-labelledby={this.ariaLabelledby}
          onClick={() => this.toggle({ focusVisible: false })}
        >
          <ds-text
            class="trigger__label ds-interaction-fill__content"
            as="span"
            variant={textVariant}
            color="inherit"
            lineTruncation={1}
          >
            {label}
          </ds-text>
          <span class="trigger__chevron ds-interaction-fill__content" aria-hidden="true">
            <ds-icon name="ChevronDown" size={iconSize} color="inherit" />
          </span>
        </button>
        {/* bottom + start: left-aligned under the field; wider menus grow right. */}
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
