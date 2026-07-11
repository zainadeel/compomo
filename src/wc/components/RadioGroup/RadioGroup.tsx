import { AttachInternals, Component, Prop, State, Event, EventEmitter, Element, Listen, Watch, h, Host } from '@stencil/core';

export interface RadioOption {
  label: string;
  value: string;
  isInactive?: boolean;
}

@Component({
  tag: 'ds-radio-group',
  styleUrl: 'RadioGroup.css',
  scoped: true,
  formAssociated: true,
})
export class RadioGroup {
  @Element() el!: HTMLElement;
  @AttachInternals() internals!: ElementInternals;

  @Prop() options: RadioOption[] = [];
  @Prop({ mutable: true }) value: string = '';
  @Prop({ reflect: true }) name: string | undefined;
  @Prop({ reflect: true }) disabled: boolean = false;
  @Prop({ reflect: true }) required: boolean = false;
  @Prop() requiredMessage: string = 'This field is required.';
  @Prop() direction: 'vertical' | 'horizontal' = 'vertical';
  @Prop() isInactive: boolean = false;
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;
  @Prop({ attribute: 'aria-labelledby' }) ariaLabelledby: string | undefined;

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
    const selectedIdx = this.options.findIndex(o => o.value === this.value);
    const firstActiveIdx = this.options.findIndex(o => !inactive && !o.isInactive);
    const focusableIdx = selectedIdx >= 0 && !inactive && !this.options[selectedIdx]?.isInactive
      ? selectedIdx
      : firstActiveIdx;

    return (
      <Host
        role="radiogroup"
        aria-label={this.ariaLabel}
        aria-labelledby={this.ariaLabelledby}
        class={{ group: true, 'group--horizontal': this.direction === 'horizontal' }}
      >
        {this.options.map((opt, i) => {
          const isItemInactive = inactive || !!opt.isInactive;
          const isChecked = opt.value === this.value;
          const tabIdx = isItemInactive ? -1 : (i === focusableIdx ? 0 : -1);

          return (
            <div
              key={opt.value}
              role="radio"
              aria-checked={String(isChecked)}
              aria-disabled={isItemInactive ? 'true' : undefined}
              tabIndex={tabIdx}
              data-radio-item
              data-value={opt.value}
              data-inactive={isItemInactive || undefined}
              class={{ 'radio-item': true, 'ds-control-inactive': isItemInactive }}
              onClick={() => !isItemInactive && this.selectItem(opt.value)}
              onKeyDown={(e: KeyboardEvent) => {
                if ((e.key === ' ' || e.key === 'Enter') && !isItemInactive) {
                  e.preventDefault();
                  this.selectItem(opt.value);
                }
              }}
            >
              <span class={{ circle: true, 'circle--checked': isChecked }}>
                {isChecked && <span class="dot" />}
              </span>
              <ds-text class="radio-label" as="span" variant="text-body-medium">
                {opt.label}
              </ds-text>
            </div>
          );
        })}
      </Host>
    );
  }
}
