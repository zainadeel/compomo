import { AttachInternals, Component, Prop, State, Event, EventEmitter, Element, Method, Watch, h, Host } from '@stencil/core';
import {
  controlWidthClass,
  CONTROL_TEXT_VARIANT,
  DEFAULT_REQUIRED_MESSAGE,
  restoreStringFormState,
  setFormControlValue,
  setRequiredValidity,
  type ControlWidth,
} from '../../utils';

export type InputType = 'text' | 'email' | 'tel' | 'url' | 'search' | 'password' | 'number';
export type InputSize = 'lg' | 'md' | 'sm' | 'xs';
export type InputWidth = ControlWidth;

const ICON_SIZE: Record<InputSize, 'lg' | 'md' | 'sm' | 'xs'> = {
  lg: 'lg',
  md: 'md',
  sm: 'sm',
  xs: 'xs',
};

const CLEAR_BUTTON_SIZE: Record<InputSize, 'md' | 'sm' | 'xs'> = {
  lg: 'md',
  md: 'sm',
  sm: 'xs',
  xs: 'xs',
};

let idCounter = 0;

@Component({
  tag: 'ds-input',
  styleUrl: 'Input.css',
  scoped: true,
  formAssociated: true,
})
export class Input {
  @Element() el!: HTMLElement;
  @AttachInternals() internals!: ElementInternals;

  private generatedId = `ds-input-${++idCounter}`;
  private errorId = `${this.generatedId}-error`;

  @Prop({ mutable: true }) value: string = '';
  @Prop({ reflect: true }) name: string | undefined;
  @Prop({ reflect: true }) form: string | undefined;
  @Prop({ reflect: true }) disabled: boolean = false;
  /** Keeps the value focusable and submittable while preventing edits. */
  @Prop({ reflect: true }) readOnly: boolean = false;
  @Prop({ reflect: true }) required: boolean = false;
  @Prop() requiredMessage: string = DEFAULT_REQUIRED_MESSAGE;
  @Prop() clearLabel: string = 'Clear';
  @Prop() placeholder: string | undefined;
  @Prop() type: InputType = 'text';
  /** Minimum accepted value when type is number. */
  @Prop() min: number | undefined;
  /** Maximum accepted value when type is number. */
  @Prop() max: number | undefined;
  /** Numeric increment used by native stepping and constraint validation. */
  @Prop() step: number | undefined;
  /** Native browser autofill hint. */
  @Prop({ attribute: 'autocomplete' }) autoComplete: string | undefined;
  /** Preferred virtual keyboard without changing the value semantics. */
  @Prop({ attribute: 'inputmode' }) inputMode: string = '';
  /** Preferred virtual-keyboard action label. */
  @Prop({ attribute: 'enterkeyhint' }) enterKeyHint: string = '';
  /** Control density. */
  @Prop() size: InputSize = 'md';
  /** Width fit — fill the parent (default) or hug the available content. */
  @Prop() width: InputWidth = 'fill';
  /** Show the standard inset border, including focused and invalid strokes. */
  @Prop() hasBorder: boolean = true;
  /** Optional leading icon name. */
  @Prop() icon: string | undefined;
  @Prop() isInactive: boolean = false;
  @Prop() autoFocus: boolean = false;
  @Prop() error: boolean = false;
  @Prop() errorMessage: string | undefined;
  /** Associates the internal input with an external <label>. */
  @Prop() inputId: string | undefined;
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;
  @Prop({ attribute: 'aria-labelledby' }) ariaLabelledby: string | undefined;
  @Prop({ attribute: 'aria-describedby' }) ariaDescribedby: string | undefined;

  @Event() dsChange!: EventEmitter<string>;
  @Event() dsClear!: EventEmitter<void>;

  private initialValue = '';
  @State() private formDisabled = false;
  @State() private hasSuffix = false;
  @State() private focused = false;
  @State() private touched = false;

  componentWillLoad() {
    this.initialValue = this.value;
    this.hasSuffix = Boolean(this.el.querySelector('[slot="suffix"]'));
    this.syncFormValue();
  }

  componentDidRender() {
    const hasSuffix = Boolean(this.el.querySelector('[slot="suffix"]'));
    if (hasSuffix !== this.hasSuffix) this.hasSuffix = hasSuffix;
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
    this.el.querySelector('input')?.focus();
  }

  private handleInput = (e: Event) => {
    this.value = (e.target as HTMLInputElement).value;
    this.dsChange.emit(this.value);
  };

  private handleFocus = () => {
    this.focused = true;
  };

  private handleBlur = () => {
    this.focused = false;
    this.touched = true;
  };

  private handleClear = () => {
    this.value = '';
    this.dsChange.emit('');
    this.dsClear.emit();
    this.el.querySelector('input')?.focus();
  };

  render() {
    const inputId = this.inputId ?? this.generatedId;
    const inactive = this.isInactive || this.disabled || this.formDisabled;
    const filled = this.value.length > 0;
    const dirty = this.value !== this.initialValue;
    const showClear = this.type === 'search' && filled && !inactive && !this.readOnly;
    const showError = this.error && Boolean(this.errorMessage);
    const textVariant = CONTROL_TEXT_VARIANT[this.size];
    const iconSize = ICON_SIZE[this.size];
    const numeric = this.type === 'number';

    const describedBy = [
      this.ariaDescribedby,
      showError ? this.errorId : undefined,
    ].filter(Boolean).join(' ') || undefined;

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
            'ds-interaction-fill': true,
            [`ds-control--${this.size}`]: true,
          }}
        >
          {this.icon && (
            <span class="input-control__prefix ds-control-icon-box ds-interaction-fill__content" aria-hidden="true">
              <ds-icon name={this.icon} size={iconSize} color="inherit" />
            </span>
          )}
          <input
            type={this.type}
            id={inputId}
            value={this.value}
            placeholder={this.placeholder}
            min={numeric ? this.min : undefined}
            max={numeric ? this.max : undefined}
            step={numeric ? this.step : undefined}
            disabled={inactive}
            readOnly={this.readOnly}
            required={this.required}
            autoFocus={this.autoFocus}
            autoComplete={this.autoComplete}
            inputMode={this.inputMode || undefined}
            enterKeyHint={this.enterKeyHint || undefined}
            class={`native-input ds-control-label-box ds-text--${textVariant.replace('text-', '')} ds-text--regular ds-interaction-fill__content`}
            aria-label={this.ariaLabel}
            aria-labelledby={this.ariaLabelledby}
            aria-describedby={describedBy}
            aria-invalid={this.error ? 'true' : undefined}
            onInput={this.handleInput}
            onFocus={this.handleFocus}
            onBlur={this.handleBlur}
          />
          <span class={{ 'input-control__suffix': true, 'ds-control-icon-box': true, 'input-control__suffix--empty': !this.hasSuffix }}>
            <slot name="suffix" />
          </span>
          {showClear && (
            <ds-button-unfilled
              class="input-control__clear"
              variant="icon"
              size={CLEAR_BUTTON_SIZE[this.size]}
              icon="CrossCircle"
              hasBorder={false}
              rounded
              ariaLabel={this.clearLabel}
              onDsClick={this.handleClear}
            />
          )}
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
