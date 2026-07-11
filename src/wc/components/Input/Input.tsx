import { AttachInternals, Component, Prop, State, Event, EventEmitter, Element, Method, Watch, h, Host } from '@stencil/core';

export type InputType = 'text' | 'email' | 'tel' | 'url' | 'search' | 'password';

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
  @Prop({ reflect: true }) disabled: boolean = false;
  @Prop({ reflect: true }) required: boolean = false;
  @Prop() requiredMessage: string = 'This field is required.';
  @Prop() clearLabel: string = 'Clear';
  @Prop() placeholder: string | undefined;
  @Prop() type: InputType = 'text';
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

  @Method()
  async setFocus() {
    this.el.querySelector('input')?.focus();
  }

  private handleInput = (e: Event) => {
    this.value = (e.target as HTMLInputElement).value;
    this.dsChange.emit(this.value);
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
    const showClear = this.type === 'search' && this.value.length > 0 && !inactive;
    const showError = this.error && Boolean(this.errorMessage);

    const describedBy = [
      this.ariaDescribedby,
      showError ? this.errorId : undefined,
    ].filter(Boolean).join(' ') || undefined;

    return (
      <Host class={{ 'input-container': true, 'ds-control-inactive': inactive }}>
        <div class={{ wrapper: true, 'wrapper--error': this.error }}>
          <div class="row">
            <input
              type={this.type}
              id={inputId}
              value={this.value}
              placeholder={this.placeholder}
              disabled={inactive}
              required={this.required}
              autoFocus={this.autoFocus}
              class="native-input ds-text--body-medium ds-text--regular"
              aria-label={this.ariaLabel}
              aria-labelledby={this.ariaLabelledby}
              aria-describedby={describedBy}
              aria-invalid={this.error || undefined}
              onInput={this.handleInput}
            />
            {showClear && (
              <button
                type="button"
                class="clear-btn"
                onClick={this.handleClear}
                aria-label={this.clearLabel}
              >
                <span aria-hidden="true">&times;</span>
              </button>
            )}
            <span class="suffix">
              <slot name="suffix" />
            </span>
          </div>
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
