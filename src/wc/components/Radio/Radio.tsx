import { AttachInternals, Component, Prop, State, Event, EventEmitter, Element, Listen, Watch, h, Host } from '@stencil/core';
import { DEFAULT_REQUIRED_MESSAGE, setRequiredValidity } from '../../utils';

export interface RadioOption {
  label: string;
  value: string;
  isInactive?: boolean;
}

export type RadioSize = 'md' | 'sm' | 'xs';

const LABEL_VARIANT: Record<RadioSize, 'text-body-medium' | 'text-body-small' | 'text-caption'> = {
  md: 'text-body-medium',
  sm: 'text-body-small',
  xs: 'text-caption',
};

@Component({
  tag: 'ds-radio',
  styleUrl: 'Radio.css',
  scoped: true,
  formAssociated: true,
})
export class Radio {
  @Element() el!: HTMLElement;
  @AttachInternals() internals!: ElementInternals;

  /** Visible choices in this one-of-many set. */
  @Prop() options: RadioOption[] = [];
  /** Selected option value. */
  @Prop({ mutable: true }) value: string = '';
  /** Visual and placement density for every option. */
  @Prop() size: RadioSize = 'md';
  /** Native form field name. */
  @Prop({ reflect: true }) name: string | undefined;
  /** Associates the radio set with a form by id when rendered outside that form. */
  @Prop({ reflect: true }) form: string | undefined;
  /** Native disabled state for the complete set. */
  @Prop({ reflect: true }) disabled: boolean = false;
  /** Require one option to be selected for form validity. */
  @Prop({ reflect: true }) required: boolean = false;
  /** Validation message used when a required set has no selection. */
  @Prop() requiredMessage: string = DEFAULT_REQUIRED_MESSAGE;
  /** Layout direction for the option set. */
  @Prop() direction: 'vertical' | 'horizontal' = 'vertical';
  /** Design-system inactive state for the complete set. */
  @Prop() isInactive: boolean = false;
  /** Accessible name when visible group labeling is unavailable. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;
  /** Id reference for a visible group label. */
  @Prop({ attribute: 'aria-labelledby' }) ariaLabelledby: string | undefined;

  /** Emitted after user selection with the selected option value. */
  @Event() dsChange!: EventEmitter<string>;

  private initialValue = '';
  @State() private formDisabled = false;

  componentWillLoad() {
    this.initialValue = this.value;
    this.syncFormValue();
  }

  @Watch('value')
  @Watch('disabled')
  @Watch('isInactive')
  @Watch('required')
  syncFormValue() {
    const inactive = this.isInactive || this.disabled || this.formDisabled;
    this.internals.setFormValue(inactive ? null : this.value);
    const missing = this.required && !inactive && this.value.length === 0;
    setRequiredValidity(this.internals, missing, this.requiredMessage);
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

  private get activeItems(): HTMLElement[] {
    return Array.from(this.el.querySelectorAll<HTMLElement>('[data-radio-item]:not([data-inactive])'));
  }

  @Listen('keydown')
  handleKeyDown(e: KeyboardEvent) {
    const items = this.activeItems;
    if (!items.length) return;

    const focused = items.find(item => item === document.activeElement);
    if (!focused) return;

    const idx = items.indexOf(focused);
    let next = -1;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        next = (idx + 1) % items.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        next = (idx - 1 + items.length) % items.length;
        break;
      case 'Home':
        e.preventDefault();
        next = 0;
        break;
      case 'End':
        e.preventDefault();
        next = items.length - 1;
        break;
    }

    if (next >= 0) {
      items[next].focus();
      const nextValue = items[next].dataset['value'];
      if (nextValue && nextValue !== this.value) {
        this.value = nextValue;
        this.dsChange.emit(nextValue);
      }
    }
  }

  private selectItem(optValue: string) {
    if (this.isInactive || this.disabled || this.formDisabled) return;
    if (optValue !== this.value) {
      this.value = optValue;
      this.dsChange.emit(optValue);
    }
  }

  render() {
    const inactive = this.isInactive || this.disabled || this.formDisabled;
    const invalid = this.required && !inactive && this.value.length === 0;
    const selectedIdx = this.options.findIndex(option => option.value === this.value);
    const firstActiveIdx = this.options.findIndex(option => !inactive && !option.isInactive);
    const focusableIdx = selectedIdx >= 0 && !inactive && !this.options[selectedIdx]?.isInactive
      ? selectedIdx
      : firstActiveIdx;

    return (
      <Host
        role="radiogroup"
        aria-label={this.ariaLabel}
        aria-labelledby={this.ariaLabelledby}
        aria-required={this.required ? 'true' : undefined}
        aria-invalid={invalid ? 'true' : undefined}
        class={{
          radio: true,
          'radio--horizontal': this.direction === 'horizontal',
          [`radio--${this.size}`]: true,
        }}
      >
        {this.options.map((option, index) => {
          const isItemInactive = inactive || !!option.isInactive;
          const isChecked = option.value === this.value;
          const tabIdx = isItemInactive ? -1 : index === focusableIdx ? 0 : -1;

          return (
            <div
              key={option.value}
              role="radio"
              aria-checked={String(isChecked)}
              aria-disabled={isItemInactive ? 'true' : undefined}
              tabIndex={tabIdx}
              data-radio-item
              data-value={option.value}
              data-inactive={isItemInactive || undefined}
              class={{
                radio__item: true,
                [`ds-control--${this.size}`]: true,
                'ds-control-inactive': isItemInactive,
                'ds-focus-ring-inset': !isItemInactive,
                'ds-interaction-fill': !isItemInactive,
              }}
              onClick={() => !isItemInactive && this.selectItem(option.value)}
              onKeyDown={(e: KeyboardEvent) => {
                if ((e.key === ' ' || e.key === 'Enter') && !isItemInactive) {
                  e.preventDefault();
                  this.selectItem(option.value);
                }
              }}
            >
              <span class="radio__placement ds-interaction-fill__content" aria-hidden="true">
                <span class={{ radio__circle: true, 'radio__circle--checked': isChecked }}>
                  {isChecked && <span class="radio__dot" />}
                </span>
              </span>
              <ds-text
                class="radio__label ds-interaction-fill__content"
                as="span"
                variant={LABEL_VARIANT[this.size]}
              >
                {option.label}
              </ds-text>
            </div>
          );
        })}
      </Host>
    );
  }
}
