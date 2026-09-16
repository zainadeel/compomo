import {
  AttachInternals,
  Component,
  Prop,
  State,
  Event,
  EventEmitter,
  Element,
  Method,
  Watch,
  h,
  Host,
} from '@stencil/core';
import {
  controlWidthClass,
  CONTROL_TEXT_VARIANT,
  DEFAULT_REQUIRED_MESSAGE,
  restoreStringFormState,
  restoreStringArrayFormState,
  setRepeatedFormControlValue,
  resolveCssLengthPx,
  TOKEN_DEFAULTS,
  setFormControlValue,
  type ControlWidth,
} from '../../utils';

import { AnchoredPositionController } from '../../utils/anchored-position-controller';
import { AnchoredOverlayInteractionController } from '../../utils/anchored-overlay-interaction-controller';
import { resolveAnchoredOverlayBoundaryRect } from '../../utils/anchored-overlay-boundary';
import { ChoiceOptionRow } from '../../utils/choice-list-parts';
import { lengthLimit, textConstraintValidity } from '../../utils/text-constraints';

export type InputType = 'text' | 'email' | 'tel' | 'url' | 'search' | 'password' | 'number';
export type InputSize = 'lg' | 'md' | 'sm' | 'xs';
export type InputWidth = ControlWidth;
export type InputTextAlign = 'start' | 'end';

const CONTROL_ADORNMENT = 'ds-select, ds-button-unfilled, ds-button-filled';

function isControlAdornment(element: Element): boolean {
  return element.matches(CONTROL_ADORNMENT) || Boolean(element.querySelector(CONTROL_ADORNMENT));
}

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
  @Prop() showPasswordLabel: string = 'Show password';
  @Prop() hidePasswordLabel: string = 'Hide password';
  /** Minimum non-empty text length, in native UTF-16 code units. */
  @Prop() minLength: number | undefined;
  /** Maximum text length. A visible counter accompanies this constraint by default. */
  @Prop() maxLength: number | undefined;
  /** Error preserves extra text; restrict uses the browser's hard input limit. */
  @Prop() lengthBehavior: 'error' | 'restrict' = 'error';
  @Prop() showCharacterCount: boolean = true;
  /** Native whole-value regular expression for text-like input types. */
  @Prop() pattern: string | undefined;
  @Prop() patternMessage: string | undefined;
  /** Optional local suggestions; free text always remains valid. Used with text/search fields. */
  @Prop() suggestions: string[] = [];
  /** Free-text tokens entered with Enter/comma and removable chips. Used with text/search fields. */
  @Prop({ reflect: true }) tokenized: boolean = false;
  /** Committed values; value remains the editable draft when tokenized. */
  @Prop({ mutable: true }) tokens: string[] = [];
  @Prop() removeTokenLabel: string = 'Remove {label}';
  @Prop() placeholder: string | undefined;
  @Prop() type: InputType = 'text';
  /** Minimum accepted value when type is number. */
  @Prop() min: number | undefined;
  /** Maximum accepted value when type is number. */
  @Prop() max: number | undefined;
  /** Numeric increment used by native stepping and constraint validation. */
  @Prop() step: number | undefined;
  /** Show inset increment/decrement actions for number fields. Native numeric editing remains available when hidden. */
  @Prop() showStepper: boolean = true;
  @Prop() incrementLabel: string = 'Increase value';
  @Prop() decrementLabel: string = 'Decrease value';
  /** Align the editable value; number steppers sit on the opposite inline edge. */
  @Prop() textAlign: InputTextAlign = 'start';
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
  /** Show the standard hover and pressed fill when the field is not embedded in interactive chrome. */
  @Prop() hasInteractionFill: boolean = true;
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
  /** Identifies the results or popup controlled by the editable field. */
  @Prop({ attribute: 'aria-controls' }) ariaControls: string | undefined;
  /** Identifies the active descendant while focus remains in the editable field. */
  @Prop({ attribute: 'aria-activedescendant' }) ariaActiveDescendant: string | undefined;

  @Event() dsChange!: EventEmitter<string>;
  @Event() dsTokensChange!: EventEmitter<string[]>;
  @Event() dsSuggestionSelect!: EventEmitter<string>;
  @Event() dsClear!: EventEmitter<void>;

  @State() private constraintMessage = '';
  @State() private submitted = false;
  private get managedByField(): boolean {
    return Boolean(this.el.closest('ds-field'));
  }
  private get visibleConstraintMessage(): string {
    return this.touched ||
      this.submitted ||
      (this.maxLength !== undefined && this.value.length > this.maxLength)
      ? this.constraintMessage
      : '';
  }
  private get hasCounter(): boolean {
    return (
      this.showCharacterCount && lengthLimit(this.maxLength) !== undefined && this.type !== 'number'
    );
  }

  @State() private suggestionsOpen = false;
  @State() private activeSuggestion = -1;
  @State() private suggestionPosition = { x: 0, y: 0 };
  @State() private suggestionsReady = false;
  private controlEl?: HTMLElement;
  private initialTokens: string[] = [];
  private get supportsTextFeatures(): boolean {
    return this.type === 'text' || this.type === 'search';
  }
  private get isTokenized(): boolean {
    return this.tokenized && this.supportsTextFeatures;
  }
  private get filteredSuggestions(): string[] {
    if (!this.supportsTextFeatures) return [];
    const query = this.value.trim().toLocaleLowerCase();
    return [...new Set(this.suggestions)].filter(
      value =>
        value.toLocaleLowerCase().includes(query) &&
        (!this.isTokenized || !this.tokens.includes(value))
    );
  }
  private readonly suggestionPlacement = new AnchoredPositionController({
    getAnchor: () => this.controlEl ?? null,
    getPopup: () => this.el.querySelector<HTMLElement>('.input-suggestions'),
    getOwnerDocument: () => this.el.ownerDocument,
    measure: (anchor, popup) => {
      if (!this.suggestionsOpen) return null;
      const gap = resolveCssLengthPx(TOKEN_DEFAULTS.space050, TOKEN_DEFAULTS.space050);
      return {
        anchorRect: anchor.getBoundingClientRect(),
        popupWidth: popup.offsetWidth,
        popupHeight: popup.offsetHeight,
        side: 'bottom',
        align: 'start',
        sideOffsetPx: gap,
        alignOffsetPx: 0,
        viewportPadPx: gap,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        collisionRect: resolveAnchoredOverlayBoundaryRect(anchor),
      };
    },
    apply: ({ x, y }) => {
      this.suggestionPosition = { x, y };
    },
    onReady: () => {
      this.suggestionsReady = true;
    },
    topLayer: true,
    observeResize: true,
    liveUpdate: 'frame',
  });
  private readonly suggestionInteraction = new AnchoredOverlayInteractionController({
    getAnchor: () => this.controlEl ?? null,
    getPopup: () => this.el.querySelector<HTMLElement>('.input-suggestions'),
    getOwnerDocument: () => this.el.ownerDocument,
    onOutsideActivation: () => this.closeSuggestions(),
  });

  private initialValue = '';
  private inputEl?: HTMLInputElement;
  @State() private formDisabled = false;
  @State() private hasPrefix = false;
  @State() private hasPrefixControl = false;
  @State() private hasSuffix = false;
  @State() private hasSuffixControl = false;
  @State() private focused = false;
  @State() private touched = false;
  @State() private passwordRevealed = false;
  private restorePasswordFocus = false;

  componentWillLoad() {
    this.value = String(this.value ?? '');
    this.tokens = Array.isArray(this.tokens) ? this.tokens : [];
    this.initialValue = this.value;
    this.initialTokens = [...this.tokens];
    this.syncAdornmentSlots();
    this.syncFormValue();
  }

  disconnectedCallback() {
    this.closeSuggestions();
  }

  componentDidRender() {
    this.syncAdornmentSlots();
    if (this.suggestionsOpen) this.suggestionPlacement.schedule();
    if (!this.restorePasswordFocus) return;
    this.restorePasswordFocus = false;
    this.inputEl?.focus({ preventScroll: true });
  }

  @Watch('type')
  onTypeChange() {
    if (this.type !== 'password') this.passwordRevealed = false;
  }

  private syncAdornmentSlots() {
    const prefixNodes = [...this.el.querySelectorAll('[slot="prefix"]')];
    const suffixNodes = [...this.el.querySelectorAll('[slot="suffix"]')];
    const hasPrefix = prefixNodes.length > 0;
    const hasPrefixControl = prefixNodes.some(isControlAdornment);
    const hasSuffix = suffixNodes.length > 0;
    const hasSuffixControl = suffixNodes.some(isControlAdornment);
    if (hasPrefix !== this.hasPrefix) this.hasPrefix = hasPrefix;
    if (hasPrefixControl !== this.hasPrefixControl) this.hasPrefixControl = hasPrefixControl;
    if (hasSuffix !== this.hasSuffix) this.hasSuffix = hasSuffix;
    if (hasSuffixControl !== this.hasSuffixControl) this.hasSuffixControl = hasSuffixControl;
  }

  @Watch('tokens')
  @Watch('tokenized')
  @Watch('name')
  @Watch('value')
  @Watch('disabled')
  @Watch('isInactive')
  @Watch('required')
  @Watch('readOnly')
  @Watch('minLength')
  @Watch('maxLength')
  @Watch('requiredMessage')
  @Watch('pattern')
  @Watch('patternMessage')
  @Watch('type')
  @Watch('min')
  @Watch('max')
  @Watch('step')
  syncFormValue() {
    if (typeof this.value !== 'string') {
      this.value = String(this.value ?? '');
    }
    if (!Array.isArray(this.tokens)) this.tokens = [];
    const inactive = this.isInactive || this.disabled || this.formDisabled;
    if (this.isTokenized)
      setRepeatedFormControlValue(this.internals, this.name, this.tokens, { inactive });
    else setFormControlValue(this.internals, this.value, { inactive });
    let validity =
      inactive || this.readOnly
        ? { flags: {}, message: '' }
        : textConstraintValidity({
            ...this.textConstraints(),
            required: this.required && !this.isTokenized,
          });
    if (this.isTokenized && !inactive && !this.readOnly) {
      const invalidToken = this.tokens
        .map(value => textConstraintValidity({ ...this.textConstraints(), value, required: false }))
        .find(result => result.message);
      if (invalidToken) validity = invalidToken;
      else if (this.required && this.tokens.length === 0)
        validity = { flags: { valueMissing: true }, message: this.requiredMessage };
      else if (this.value.trim() && !validity.message)
        validity = { flags: { customError: true }, message: 'Press Enter to add this value.' };
    }
    if (inactive || this.readOnly) this.closeSuggestions();
    this.constraintMessage = validity.message;
    this.internals.setValidity(validity.flags, validity.message);
  }

  private textConstraints() {
    return {
      value: this.value,
      type: this.type,
      required: this.required,
      requiredMessage: this.requiredMessage,
      minLength: this.minLength,
      maxLength: this.maxLength,
      pattern: this.pattern,
      patternMessage: this.patternMessage,
      min: this.min,
      max: this.max,
      step: this.step,
    };
  }

  formDisabledCallback(disabled: boolean) {
    this.formDisabled = disabled;
    this.syncFormValue();
  }

  formResetCallback() {
    this.value = this.initialValue;
    this.tokens = [...this.initialTokens];
    this.closeSuggestions();
    this.touched = false;
    this.submitted = false;
    this.passwordRevealed = false;
  }

  formStateRestoreCallback(state: string | File | FormData | null) {
    if (this.isTokenized) this.tokens = restoreStringArrayFormState(state);
    else this.value = restoreStringFormState(state);
  }

  @Method()
  async setFocus() {
    this.inputEl?.focus();
  }

  private handleInput = (e: Event) => {
    this.value = (e.target as HTMLInputElement).value;
    this.dsChange.emit(this.value);
    this.activeSuggestion = -1;
    this.openSuggestions();
  };

  private handleFocus = () => {
    this.focused = true;
  };

  private handleBlur = () => {
    this.focused = false;
    this.touched = true;
    this.closeSuggestions();
  };

  private handleClear = () => {
    this.value = '';
    if (this.isTokenized) {
      this.tokens = [];
      this.dsTokensChange.emit([]);
    }
    this.closeSuggestions();
    this.dsChange.emit('');
    this.dsClear.emit();
    this.inputEl?.focus();
  };

  private handleTogglePassword = () => {
    this.passwordRevealed = !this.passwordRevealed;
    this.restorePasswordFocus = true;
  };

  @Watch('suggestions')
  onSuggestionsChanged() {
    this.activeSuggestion = -1;
    if (this.focused && this.value) this.openSuggestions();
  }

  private openSuggestions() {
    if (
      this.disabled ||
      this.formDisabled ||
      this.isInactive ||
      this.readOnly ||
      !this.filteredSuggestions.length
    ) {
      this.closeSuggestions();
      return;
    }
    if (this.suggestionsOpen) return;
    this.suggestionsReady = false;
    this.suggestionsOpen = true;
    this.suggestionInteraction.connect();
    this.suggestionPlacement.observe();
    this.suggestionPlacement.schedule();
  }
  private closeSuggestions() {
    this.suggestionPlacement.unobserve();
    this.suggestionInteraction.disconnect();
    const popup = this.el.querySelector<HTMLElement>('.input-suggestions');
    if (popup?.matches(':popover-open')) popup.hidePopover();
    this.suggestionsOpen = false;
    this.activeSuggestion = -1;
  }
  private addTokens(text: string) {
    if (this.readOnly || this.disabled || this.isInactive || this.formDisabled) return;
    const values = text
      .split(/[,\n\r]+/)
      .map(value => {
        const trimmed = value.trim();
        const max = lengthLimit(this.maxLength);
        return this.lengthBehavior === 'restrict' && max !== undefined
          ? trimmed.slice(0, max)
          : trimmed;
      })
      .filter(Boolean);
    if (!values.length) return;
    this.tokens = [...new Set([...this.tokens, ...values])];
    this.value = '';
    this.dsTokensChange.emit([...this.tokens]);
    this.dsChange.emit('');
    this.closeSuggestions();
  }
  private removeToken(index: number) {
    if (this.readOnly || this.disabled || this.isInactive || this.formDisabled) return;
    this.tokens = this.tokens.filter((_, tokenIndex) => index !== tokenIndex);
    this.dsTokensChange.emit([...this.tokens]);
    this.inputEl?.focus();
  }
  private selectSuggestion(value: string) {
    if (this.isTokenized) this.addTokens(value);
    else {
      const max = lengthLimit(this.maxLength);
      this.value =
        this.lengthBehavior === 'restrict' && max !== undefined ? value.slice(0, max) : value;
      this.dsChange.emit(this.value);
    }
    this.dsSuggestionSelect.emit(value);
    this.closeSuggestions();
    this.inputEl?.focus();
  }
  private handleTextKeyDown = (event: KeyboardEvent) => {
    if (event.isComposing || this.readOnly || this.disabled || this.isInactive || this.formDisabled)
      return;
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && this.filteredSuggestions.length) {
      event.preventDefault();
      this.openSuggestions();
      const length = this.filteredSuggestions.length;
      this.activeSuggestion =
        this.activeSuggestion < 0
          ? event.key === 'ArrowDown'
            ? 0
            : length - 1
          : Math.max(
              0,
              Math.min(length - 1, this.activeSuggestion + (event.key === 'ArrowDown' ? 1 : -1))
            );
      requestAnimationFrame(() =>
        this.el
          .querySelector(`#${this.generatedId}-suggestion-${this.activeSuggestion}`)
          ?.scrollIntoView({ block: 'nearest' })
      );
    } else if (event.key === 'Escape' && this.suggestionsOpen) {
      event.preventDefault();
      event.stopPropagation();
      this.closeSuggestions();
    } else if (event.key === 'Enter' && this.suggestionsOpen && this.activeSuggestion >= 0) {
      event.preventDefault();
      this.selectSuggestion(this.filteredSuggestions[this.activeSuggestion]);
    } else if (
      this.isTokenized &&
      (event.key === 'Enter' || event.key === ',') &&
      this.value.trim()
    ) {
      event.preventDefault();
      this.addTokens(this.value);
    } else if (this.isTokenized && event.key === 'Backspace' && !this.value && this.tokens.length) {
      event.preventDefault();
      this.removeToken(this.tokens.length - 1);
    } else if (event.key === 'Tab') this.closeSuggestions();
  };
  private handlePaste = (event: ClipboardEvent) => {
    if (!this.isTokenized || this.readOnly || this.disabled || this.isInactive || this.formDisabled)
      return;
    const pasted = event.clipboardData?.getData('text') ?? '';
    if (!/[,\r\n]/.test(pasted)) return;
    event.preventDefault();
    const start = this.inputEl?.selectionStart ?? this.value.length;
    const end = this.inputEl?.selectionEnd ?? start;
    this.addTokens(this.value.slice(0, start) + pasted + this.value.slice(end));
  };

  private numericStepDisabled(direction: 1 | -1): boolean {
    if (this.value.trim() === '') return false;
    const value = Number(this.value);
    if (!Number.isFinite(value)) return false;
    if (direction > 0 && this.max !== undefined) return value >= this.max;
    if (direction < 0 && this.min !== undefined) return value <= this.min;
    return false;
  }

  private handleNumericStep = (direction: 1 | -1) => {
    const input = this.inputEl;
    if (!input || input.disabled || input.readOnly || this.numericStepDisabled(direction)) return;

    const previous = input.value;
    if (direction > 0) input.stepUp();
    else input.stepDown();
    input.focus({ preventScroll: true });
    if (input.value === previous) return;

    this.value = input.value;
    this.dsChange.emit(this.value);
  };

  private renderNumericStepper(inactive: boolean) {
    const incrementDisabled = inactive || this.readOnly || this.numericStepDisabled(1);
    const decrementDisabled = inactive || this.readOnly || this.numericStepDisabled(-1);

    return (
      <span class="input-control__number-stepper">
        <ds-button-unfilled
          class="input-control__number-step input-control__number-step--increment"
          variant="icon"
          size={this.size}
          icon="Plus"
          hasBorder={false}
          isInset
          isInactive={incrementDisabled}
          ariaLabel={this.incrementLabel}
          onDsClick={() => this.handleNumericStep(1)}
        />
        <ds-divider orientation="vertical" length="var(--ds-control-icon)" />
        <ds-button-unfilled
          class="input-control__number-step input-control__number-step--decrement"
          variant="icon"
          size={this.size}
          icon="Minus"
          hasBorder={false}
          isInset
          isInactive={decrementDisabled}
          ariaLabel={this.decrementLabel}
          onDsClick={() => this.handleNumericStep(-1)}
        />
      </span>
    );
  }

  render() {
    const inputId = this.inputId ?? this.generatedId;
    const inactive = this.isInactive || this.disabled || this.formDisabled;
    const filled = this.value.length > 0 || (this.isTokenized && this.tokens.length > 0);
    const dirty =
      this.value !== this.initialValue ||
      (this.isTokenized && JSON.stringify(this.tokens) !== JSON.stringify(this.initialTokens));
    const showClear = this.type === 'search' && filled && !inactive && !this.readOnly;
    const showPasswordToggle = this.type === 'password';
    const nativeType = showPasswordToggle && this.passwordRevealed ? 'text' : this.type;
    const message =
      this.error && this.errorMessage ? this.errorMessage : this.visibleConstraintMessage;
    const invalid = this.error || Boolean(this.visibleConstraintMessage);
    const showError = Boolean(message) && !this.managedByField;
    const showCounter = this.hasCounter && !this.managedByField;
    const textVariant = CONTROL_TEXT_VARIANT[this.size];
    const iconSize = ICON_SIZE[this.size];
    const numeric = this.type === 'number';
    const showNumericStepper = numeric && this.showStepper;
    const resolvedAutoComplete = this.autoComplete ?? (this.type === 'search' ? 'off' : undefined);
    const suppressBrowserChrome = this.type === 'search' || this.type === 'password';

    const describedBy =
      [
        this.ariaDescribedby,
        showError ? this.errorId : undefined,
        showCounter ? `${this.generatedId}-count` : undefined,
      ]
        .filter(Boolean)
        .join(' ') || undefined;

    return (
      <Host
        class={{
          'input-host': true,
          'ds-field-stack': true,
          'ds-field-stack--supporting-inset': !this.hasBorder,
          'ds-control-inactive': inactive,
          [`ds-control--${this.size}`]: true,
          ...controlWidthClass(this.width),
        }}
        data-disabled={inactive ? '' : undefined}
        data-readonly={this.readOnly ? '' : undefined}
        data-required={this.required ? '' : undefined}
        data-invalid={invalid ? '' : undefined}
        data-constraint-message={this.visibleConstraintMessage || undefined}
        data-character-count={this.hasCounter ? String(this.value.length) : undefined}
        data-character-limit={this.hasCounter ? String(lengthLimit(this.maxLength)) : undefined}
        onInvalid={() => {
          this.submitted = true;
        }}
        data-filled={filled ? '' : undefined}
        data-focused={this.focused ? '' : undefined}
        data-dirty={dirty ? '' : undefined}
        data-touched={this.touched ? '' : undefined}
      >
        <div
          ref={element => {
            this.controlEl = element;
          }}
          class={{
            'input-control--tokenized': this.isTokenized,
            'input-control--has-tokens': this.isTokenized && this.tokens.length > 0,
            'input-control': true,
            'input-control--number': numeric,
            'input-control--stepper': showNumericStepper,
            'input-control--align-start': this.textAlign === 'start',
            'input-control--align-end': this.textAlign === 'end',
            'ds-control-frame': true,
            'input-control--bordered': this.hasBorder,
            'input-control--error': this.hasBorder && invalid,
            'input-control--prefix-control': this.hasPrefixControl,
            'input-control--suffix-control': this.hasSuffixControl,
            'ds-interaction-fill': this.hasInteractionFill,
            [`ds-control--${this.size}`]: true,
          }}
        >
          {showNumericStepper && this.textAlign === 'end' && this.renderNumericStepper(inactive)}
          {this.icon && (
            <span
              class="input-control__prefix ds-control-icon-box ds-interaction-fill__content"
              aria-hidden="true"
            >
              <ds-icon name={this.icon} size={iconSize} color="inherit" />
            </span>
          )}
          <span
            class={{
              'input-control__prefix-text': true,
              'ds-control-label-box': !this.hasPrefixControl,
              'ds-interaction-fill__content': true,
              'input-control__prefix-text--control': this.hasPrefixControl,
              'input-control__prefix-text--empty': !this.hasPrefix,
            }}
          >
            <slot name="prefix" onSlotchange={() => this.syncAdornmentSlots()} />
            {this.hasPrefixControl && (
              <ds-divider
                class="input-control__adornment-divider"
                orientation="vertical"
                length="var(--ds-control-icon)"
              />
            )}
          </span>
          {this.isTokenized &&
            this.tokens.map((token, index) => (
              <ds-chip
                key={`${index}-${token}`}
                class="input-token"
                label={token}
                size={this.size === 'lg' ? 'md' : this.size}
                isInset
                insetDepth="double"
                isInactive={inactive || this.readOnly}
                removeLabel={this.removeTokenLabel}
                state={
                  textConstraintValidity({
                    ...this.textConstraints(),
                    value: token,
                    required: false,
                  }).message
                    ? 'error'
                    : 'default'
                }
                onDsRemove={event => {
                  event.stopPropagation();
                  this.removeToken(index);
                }}
              />
            ))}
          <input
            ref={element => {
              this.inputEl = element;
            }}
            type={nativeType}
            id={inputId}
            value={this.value}
            placeholder={this.placeholder}
            min={numeric ? this.min : undefined}
            max={numeric ? this.max : undefined}
            step={numeric ? this.step : undefined}
            disabled={inactive}
            readOnly={this.readOnly}
            required={this.required && !this.isTokenized}
            minLength={lengthLimit(this.minLength)}
            maxLength={this.lengthBehavior === 'restrict' ? lengthLimit(this.maxLength) : undefined}
            pattern={this.pattern}
            autoFocus={this.autoFocus}
            autoComplete={resolvedAutoComplete}
            autoCapitalize={suppressBrowserChrome ? 'none' : undefined}
            autoCorrect={suppressBrowserChrome ? 'off' : undefined}
            spellcheck={suppressBrowserChrome ? false : undefined}
            inputMode={this.inputMode || undefined}
            enterKeyHint={this.enterKeyHint || undefined}
            class={`native-input native-input--align-${this.textAlign} ds-control-label-box ds-text--${textVariant.replace('text-', '')} ds-text--regular ds-interaction-fill__content`}
            aria-label={this.ariaLabel}
            aria-labelledby={this.ariaLabelledby}
            aria-describedby={describedBy}
            role={this.suggestions.length && this.supportsTextFeatures ? 'combobox' : undefined}
            aria-autocomplete={
              this.suggestions.length && this.supportsTextFeatures ? 'list' : undefined
            }
            aria-expanded={
              this.suggestions.length && this.supportsTextFeatures
                ? String(this.suggestionsOpen)
                : undefined
            }
            aria-controls={
              this.suggestionsOpen ? `${this.generatedId}-suggestions` : this.ariaControls
            }
            aria-activedescendant={
              this.suggestionsOpen && this.activeSuggestion >= 0
                ? `${this.generatedId}-suggestion-${this.activeSuggestion}`
                : this.ariaActiveDescendant
            }
            aria-invalid={invalid ? 'true' : undefined}
            onInput={this.handleInput}
            onKeyDown={this.handleTextKeyDown}
            onPaste={this.handlePaste}
            onFocus={this.handleFocus}
            onBlur={this.handleBlur}
          />
          <span
            class={{
              'input-control__suffix': true,
              'ds-control-label-box': !this.hasSuffixControl,
              'input-control__suffix--control': this.hasSuffixControl,
              'input-control__suffix--empty': !this.hasSuffix,
            }}
          >
            {this.hasSuffixControl && (
              <ds-divider
                class="input-control__adornment-divider"
                orientation="vertical"
                length="var(--ds-control-icon)"
              />
            )}
            <slot name="suffix" onSlotchange={() => this.syncAdornmentSlots()} />
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
          {showPasswordToggle && (
            <ds-button-unfilled
              class="input-control__trailing-action"
              variant="icon"
              size={this.size}
              icon={this.passwordRevealed ? 'EyeStrikethrough' : 'Eye'}
              hasBorder={false}
              isInset
              isInactive={inactive}
              ariaLabel={this.passwordRevealed ? this.hidePasswordLabel : this.showPasswordLabel}
              onDsClick={this.handleTogglePassword}
            />
          )}
          {showNumericStepper && this.textAlign === 'start' && this.renderNumericStepper(inactive)}
        </div>
        {this.suggestionsOpen && (
          <div
            popover="manual"
            class="input-suggestions ds-choice-popup"
            style={{
              position: 'fixed',
              left: `${this.suggestionPosition.x}px`,
              top: `${this.suggestionPosition.y}px`,
              width: `${this.controlEl?.getBoundingClientRect().width ?? 0}px`,
              visibility: this.suggestionsReady ? 'visible' : 'hidden',
            }}
            onMouseDown={event => event.preventDefault()}
          >
            <div
              class="input-suggestions__list ds-choice-list"
              id={`${this.generatedId}-suggestions`}
              role="listbox"
              aria-label="Suggestions"
            >
              {this.filteredSuggestions.map((value, index) => (
                <ChoiceOptionRow
                  size={this.size}
                  id={`${this.generatedId}-suggestion-${index}`}
                  option={{ label: value, value }}
                  selected={false}
                  active={index === this.activeSuggestion}
                  focusRingVisible={false}
                  usesSubtext={false}
                  tabIndex={-1}
                  onHover={() => {
                    this.activeSuggestion = index;
                  }}
                  onSelect={() => this.selectSuggestion(value)}
                />
              ))}
            </div>
          </div>
        )}
        {(showError || showCounter) && (
          <div class="text-field-support">
            {showError && (
              <ds-text
                class="error-text"
                as="div"
                variant="text-body-small"
                color="negative"
                textId={this.errorId}
                role="alert"
              >
                {message}
              </ds-text>
            )}
            {showCounter && (
              <ds-text
                as="span"
                class="text-field-count"
                variant="text-body-small"
                color={invalid ? 'negative' : 'secondary'}
                textId={`${this.generatedId}-count`}
              >
                {this.value.length}/{lengthLimit(this.maxLength)}
              </ds-text>
            )}
          </div>
        )}
      </Host>
    );
  }
}
