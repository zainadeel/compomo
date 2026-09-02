import {
  AttachInternals,
  Component,
  Element,
  Event,
  EventEmitter,
  Method,
  Prop,
  State,
  Watch,
  h,
  Host,
} from '@stencil/core';
import {
  controlWidthClass,
  CONTROL_TEXT_VARIANT,
  DEFAULT_REQUIRED_MESSAGE,
  restoreStringFormState,
  setFormControlValue,
  setRequiredValidity,
  type ControlWidth,
} from '../../utils';

export type TextareaSize = 'lg' | 'md' | 'sm' | 'xs';
export type TextareaWidth = ControlWidth;
export type TextareaResize = 'vertical' | 'none';

let idCounter = 0;

@Component({
  tag: 'ds-textarea',
  styleUrl: 'Textarea.css',
  scoped: true,
  formAssociated: true,
})
export class Textarea {
  @Element() el!: HTMLElement;
  @AttachInternals() internals!: ElementInternals;

  private generatedId = `ds-textarea-${++idCounter}`;
  private errorId = `${this.generatedId}-error`;

  @Prop({ mutable: true }) value: string = '';
  @Prop({ reflect: true }) name: string | undefined;
  @Prop({ reflect: true }) form: string | undefined;
  @Prop({ reflect: true }) disabled: boolean = false;
  /** Keeps the value focusable and submittable while preventing edits. */
  @Prop({ reflect: true }) readOnly: boolean = false;
  @Prop({ reflect: true }) required: boolean = false;
  @Prop() requiredMessage: string = DEFAULT_REQUIRED_MESSAGE;
  @Prop() placeholder: string | undefined;
  /** Visible text rows before the field scrolls. */
  @Prop() rows: number = 4;
  /** Whether the user can resize the field vertically. */
  @Prop() resize: TextareaResize = 'vertical';
  /** Native browser autofill hint. */
  @Prop({ attribute: 'autocomplete' }) autoComplete: string | undefined;
  /** Preferred virtual keyboard without changing the value semantics. */
  @Prop({ attribute: 'inputmode' }) inputMode: string = '';
  /** Preferred virtual-keyboard action label. */
  @Prop({ attribute: 'enterkeyhint' }) enterKeyHint: string = '';
  /** Whether the browser should check spelling and grammar. */
  @Prop({ attribute: 'spellcheck' }) spellCheck: boolean = true;
  /** Control density for typography and inset spacing. */
  @Prop() size: TextareaSize = 'md';
  /** Width fit — fill the parent (default) or hug the available content. */
  @Prop() width: TextareaWidth = 'fill';
  /** Show the standard inset border, including focused and invalid strokes. */
  @Prop() hasBorder: boolean = true;
  /** Show the standard hover and pressed fill when the field is not embedded in interactive chrome. */
  @Prop() hasInteractionFill: boolean = true;
  @Prop() isInactive: boolean = false;
  @Prop() autoFocus: boolean = false;
  @Prop() error: boolean = false;
  @Prop() errorMessage: string | undefined;
  /** Associates the internal textarea with an external <label>. */
  @Prop() inputId: string | undefined;
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;
  @Prop({ attribute: 'aria-labelledby' }) ariaLabelledby: string | undefined;
  @Prop({ attribute: 'aria-describedby' }) ariaDescribedby: string | undefined;

  @Event() dsChange!: EventEmitter<string>;

  private initialValue = '';
  private textareaEl?: HTMLTextAreaElement;
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
    this.textareaEl?.focus();
  }

  private handleInput = (event: Event) => {
    this.value = (event.target as HTMLTextAreaElement).value;
    this.dsChange.emit(this.value);
  };

  private handleFocus = () => {
    this.focused = true;
  };

  private handleBlur = () => {
    this.focused = false;
    this.touched = true;
  };

  render() {
    const inputId = this.inputId ?? this.generatedId;
    const inactive = this.isInactive || this.disabled || this.formDisabled;
    const filled = this.value.length > 0;
    const dirty = this.value !== this.initialValue;
    const showError = this.error && Boolean(this.errorMessage);
    const textVariant = CONTROL_TEXT_VARIANT[this.size];
    const rows = Number.isFinite(this.rows) ? Math.max(1, Math.floor(this.rows)) : 4;
    const describedBy =
      [this.ariaDescribedby, showError ? this.errorId : undefined].filter(Boolean).join(' ') ||
      undefined;

    return (
      <Host
        class={{
          'textarea-host': true,
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
            'textarea-control': true,
            'textarea-control--bordered': this.hasBorder,
            'textarea-control--error': this.hasBorder && this.error,
            'ds-interaction-fill': this.hasInteractionFill,
            [`ds-control--${this.size}`]: true,
          }}
        >
          <textarea
            ref={element => {
              this.textareaEl = element;
            }}
            id={inputId}
            value={this.value}
            placeholder={this.placeholder}
            rows={rows}
            disabled={inactive}
            readOnly={this.readOnly}
            required={this.required}
            autoFocus={this.autoFocus}
            autoComplete={this.autoComplete}
            inputMode={this.inputMode || undefined}
            enterKeyHint={this.enterKeyHint || undefined}
            spellcheck={this.spellCheck}
            class={`native-textarea native-textarea--resize-${this.resize} ds-text--${textVariant.replace('text-', '')} ds-text--regular ds-interaction-fill__content`}
            aria-label={this.ariaLabel}
            aria-labelledby={this.ariaLabelledby}
            aria-describedby={describedBy}
            aria-invalid={this.error ? 'true' : undefined}
            onInput={this.handleInput}
            onFocus={this.handleFocus}
            onBlur={this.handleBlur}
          />
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
