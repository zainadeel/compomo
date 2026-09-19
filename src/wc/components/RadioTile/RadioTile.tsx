import {
  AttachInternals,
  Component,
  Element,
  Event,
  EventEmitter,
  Prop,
  State,
  Watch,
  Method,
  h,
  Host,
} from '@stencil/core';
import {
  DEFAULT_REQUIRED_MESSAGE,
  restoreStringFormState,
  setFormControlValue,
  setRequiredValidity,
} from '../../utils';

export interface RadioTileOption {
  value: string;
  label: string;
  description?: string;
  isInactive?: boolean;
}
let tileId = 0;

@Component({ tag: 'ds-radio-tile', styleUrl: 'RadioTile.css', scoped: true, formAssociated: true })
export class RadioTile {
  @Element() el!: HTMLElement;
  @AttachInternals() internals!: ElementInternals;
  /** One-of-many choices displayed as fully clickable tiles. */
  @Prop() options: RadioTileOption[] = [];
  @Prop({ mutable: true }) value: string = '';
  @Prop({ reflect: true }) name: string | undefined;
  @Prop({ reflect: true }) form: string | undefined;
  @Prop({ reflect: true }) disabled: boolean = false;
  @Prop() isInactive: boolean = false;
  @Prop({ reflect: true }) required: boolean = false;
  @Prop() requiredMessage: string = DEFAULT_REQUIRED_MESSAGE;
  @Prop() direction: 'horizontal' | 'vertical' = 'vertical';
  @Prop() inputId: string | undefined;
  @Prop() error: boolean = false;
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;
  @Prop({ attribute: 'aria-labelledby' }) ariaLabelledby: string | undefined;
  @Prop({ attribute: 'aria-describedby' }) ariaDescribedby: string | undefined;
  @Event() dsChange!: EventEmitter<string>;
  @State() private formDisabled = false;
  private readonly generatedId = `ds-radio-tile-${++tileId}`;
  private initialValue = '';
  private get inactive() {
    return this.disabled || this.isInactive || this.formDisabled;
  }
  componentWillLoad() {
    this.initialValue = this.value;
    this.syncFormValue();
  }
  @Watch('value')
  @Watch('options')
  @Watch('disabled')
  @Watch('isInactive')
  @Watch('required')
  @Watch('requiredMessage')
  syncFormValue() {
    const selected = this.options.some(option => option.value === this.value && !option.isInactive);
    setFormControlValue(this.internals, selected ? this.value : '', {
      inactive: this.inactive,
      state: this.value,
    });
    setRequiredValidity(
      this.internals,
      this.required && !this.inactive && !selected,
      this.requiredMessage
    );
  }
  formDisabledCallback(disabled: boolean) {
    this.formDisabled = disabled;
    this.syncFormValue();
  }
  formResetCallback() {
    this.value = this.initialValue;
  }
  formStateRestoreCallback(state: string | File | FormData | null) {
    this.value = restoreStringFormState(state);
  }
  @Method()
  async setFocus() {
    (
      this.el.querySelector<HTMLInputElement>('input:checked:not(:disabled)') ??
      this.el.querySelector<HTMLInputElement>('input:not(:disabled)')
    )?.focus();
  }
  private select(value: string) {
    if (this.inactive || value === this.value) return;
    this.value = value;
    this.dsChange.emit(value);
  }
  render() {
    return (
      <Host
        role="radiogroup"
        aria-label={this.ariaLabel}
        aria-labelledby={this.ariaLabelledby}
        aria-describedby={this.ariaDescribedby}
        aria-required={this.required ? 'true' : undefined}
        aria-invalid={this.error ? 'true' : undefined}
        class={{ 'radio-tiles': true, 'radio-tiles--horizontal': this.direction === 'horizontal' }}
      >
        {this.options.map((option, index) => {
          const selected = option.value === this.value;
          const inactive = this.inactive || Boolean(option.isInactive);
          return (
            <label
              class={{
                'radio-tile': true,
                'radio-tile--selected': selected,
                'ds-interaction-fill': !inactive,
                'ds-control-inactive': inactive,
              }}
              key={option.value}
            >
              <input
                type="radio"
                class="radio-tile__input"
                id={index === 0 ? this.inputId : undefined}
                name={this.generatedId}
                form=""
                value={option.value}
                checked={selected}
                disabled={inactive}
                aria-labelledby={`${this.generatedId}-label-${index}`}
                aria-describedby={
                  option.description ? `${this.generatedId}-description-${index}` : undefined
                }
                onChange={() => this.select(option.value)}
              />
              <span class="radio-tile__outline" aria-hidden="true" />
              <span class="radio-tile__placement ds-interaction-fill__content" aria-hidden="true">
                <span class="radio-tile__indicator">{selected && <span />}</span>
              </span>
              <span class="radio-tile__copy ds-interaction-fill__content">
                <ds-text
                  as="span"
                  variant="text-body-medium"
                  color={option.description ? 'primary' : 'secondary'}
                  emphasis={Boolean(option.description)}
                  textId={`${this.generatedId}-label-${index}`}
                >
                  {option.label}
                </ds-text>
                {option.description && (
                  <ds-text
                    as="span"
                    variant="text-body-medium"
                    color="secondary"
                    textId={`${this.generatedId}-description-${index}`}
                  >
                    {option.description}
                  </ds-text>
                )}
              </span>
            </label>
          );
        })}
      </Host>
    );
  }
}
