import {
  AttachInternals,
  Component,
  Prop,
  State,
  Event,
  EventEmitter,
  Method,
  Watch,
  h,
  Host,
} from '@stencil/core';
import {
  controlWidthClass,
  CONTROL_TEXT_VARIANT,
  DEFAULT_REQUIRED_MESSAGE,
  formatIsoCalendarDateLabel,
  restoreStringFormState,
  setFormControlValue,
  setRequiredValidity,
  type ControlSize,
  type ControlWidth,
} from '../../utils';

export type InputDateSize = ControlSize;
export type InputDateWidth = ControlWidth;

const ICON_SIZE: Record<InputDateSize, 'lg' | 'md' | 'sm' | 'xs'> = {
  lg: 'lg',
  md: 'md',
  sm: 'sm',
  xs: 'xs',
};

let idCounter = 0;

@Component({
  tag: 'ds-input-date',
  styleUrl: 'InputDate.css',
  scoped: true,
  formAssociated: true,
})
export class InputDate {
  @AttachInternals() internals!: ElementInternals;

  private generatedId = `ds-input-date-${++idCounter}`;
  private errorId = `${this.generatedId}-error`;

  @Prop({ mutable: true }) value: string = '';
  @Prop({ reflect: true }) name: string | undefined;
  @Prop({ reflect: true }) form: string | undefined;
  @Prop({ reflect: true }) disabled: boolean = false;
  @Prop({ reflect: true }) readOnly: boolean = false;
  @Prop({ reflect: true }) required: boolean = false;
  @Prop() requiredMessage: string = DEFAULT_REQUIRED_MESSAGE;
  @Prop() min: string | undefined;
  @Prop() max: string | undefined;
  @Prop() size: InputDateSize = 'md';
  @Prop() width: InputDateWidth = 'fill';
  @Prop() hasBorder: boolean = true;
  @Prop() hasInteractionFill: boolean = true;
  @Prop() isInactive: boolean = false;
  @Prop() autoFocus: boolean = false;
  @Prop() error: boolean = false;
  @Prop() errorMessage: string | undefined;
  @Prop() inputId: string | undefined;
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;
  @Prop({ attribute: 'aria-labelledby' }) ariaLabelledby: string | undefined;
  @Prop({ attribute: 'aria-describedby' }) ariaDescribedby: string | undefined;

  @Event() dsChange!: EventEmitter<string>;

  private initialValue = '';
  private inputEl?: HTMLInputElement;
  @State() private formDisabled = false;
  @State() private focused = false;
  @State() private touched = false;

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
    setFormControlValue(this.internals, this.value, { inactive });
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
    this.value = restoreStringFormState(state);
  }

  @Method()
  async setFocus() {
    this.inputEl?.focus();
  }

  private handleInput = (event: Event) => {
    this.value = (event.target as HTMLInputElement).value;
    this.dsChange.emit(this.value);
  };

  private handleFocus = () => {
    this.focused = true;
  };

  private handleBlur = () => {
    this.focused = false;
    this.touched = true;
  };

  private openPicker = () => {
    if (this.isInactive || this.disabled || this.formDisabled || this.readOnly) return;
    this.inputEl?.showPicker?.();
    this.inputEl?.focus({ preventScroll: true });
  };

  render() {
    const inputId = this.inputId ?? this.generatedId;
    const inactive = this.isInactive || this.disabled || this.formDisabled;
    const filled = this.value.length > 0;
    const dirty = this.value !== this.initialValue;
    const showError = this.error && Boolean(this.errorMessage);
    const textVariant = CONTROL_TEXT_VARIANT[this.size];
    const iconSize = ICON_SIZE[this.size];
    const displayLabel = formatIsoCalendarDateLabel(this.value);
    const describedBy =
      [this.ariaDescribedby, showError ? this.errorId : undefined].filter(Boolean).join(' ') ||
      undefined;

    return (
      <Host
        class={{
          'input-host': true,
          'ds-field-stack': true,
          'ds-control-inactive': inactive,
          [`ds-control--${this.size}`]: true,
          ...controlWidthClass(this.width),
        }}
        data-disabled={inactive ? '' : undefined}
        data-readonly={this.readOnly ? '' : undefined}
        data-required={this.required ? '' : undefined}
        data-invalid={this.error ? '' : undefined}
        data-filled={filled ? '' : undefined}
        data-focused={this.focused ? '' : undefined}
        data-dirty={dirty ? '' : undefined}
        data-touched={this.touched ? '' : undefined}
      >
        <div
          class={{
            'input-control': true,
            'ds-control-frame': true,
            'input-control--bordered': this.hasBorder,
            'input-control--error': this.hasBorder && this.error,
            'ds-interaction-fill': this.hasInteractionFill,
            [`ds-control--${this.size}`]: true,
          }}
        >
          <input
            ref={element => {
              this.inputEl = element;
            }}
            type="date"
            id={inputId}
            value={this.value}
            min={this.min}
            max={this.max}
            disabled={inactive}
            readOnly={this.readOnly}
            required={this.required}
            autoFocus={this.autoFocus}
            class={{
              'native-input': true,
              'native-input--align-start': true,
              'native-input--date-filled': Boolean(displayLabel),
              'ds-control-label-box': true,
              [`ds-text--${textVariant.replace('text-', '')}`]: true,
              'ds-text--regular': true,
              'ds-interaction-fill__content': true,
            }}
            aria-label={this.ariaLabel}
            aria-labelledby={this.ariaLabelledby}
            aria-describedby={describedBy}
            aria-invalid={this.error ? 'true' : undefined}
            onInput={this.handleInput}
            onFocus={this.handleFocus}
            onBlur={this.handleBlur}
          />
          {displayLabel ? (
            <span
              class={`input-control__formatted-date ds-control-label-box ds-text--${textVariant.replace('text-', '')} ds-text--regular`}
              aria-hidden="true"
            >
              {displayLabel}
            </span>
          ) : null}
          <button
            type="button"
            class="input-control__picker ds-control-icon-box ds-focus-ring-inset ds-interaction-fill__content"
            disabled={inactive || this.readOnly}
            tabIndex={-1}
            aria-hidden="true"
            onClick={this.openPicker}
          >
            <ds-icon name="Calendar" size={iconSize} color="inherit" />
          </button>
        </div>
        {showError && (
          <ds-text
            class="error-text"
            as="div"
            variant="text-body-small"
            color="negative"
            textId={this.errorId}
            role="alert"
          >
            {this.errorMessage}
          </ds-text>
        )}
      </Host>
    );
  }
}
