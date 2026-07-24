import { AttachInternals, Component, Prop, State, Event, EventEmitter, Watch, h, Host } from '@stencil/core';
import { DEFAULT_REQUIRED_MESSAGE, setRequiredValidity } from '../../utils';

export type CheckboxSize = 'md' | 'sm' | 'xs';

const LABEL_VARIANT: Record<CheckboxSize, 'text-body-medium' | 'text-body-small' | 'text-caption'> = {
  md: 'text-body-medium',
  sm: 'text-body-small',
  xs: 'text-caption',
};

let idCounter = 0;

@Component({
  tag: 'ds-checkbox',
  styleUrl: 'Checkbox.css',
  scoped: true,
  formAssociated: true,
})
export class Checkbox {
  @AttachInternals() internals!: ElementInternals;
  private labelId = `ds-checkbox-label-${++idCounter}`;

  /** Visible label and accessible name. Omitted only in presentation mode. */
  @Prop() label!: string;
  /** Current checked state. */
  @Prop({ mutable: true }) checked: boolean = false;
  /** Visual and placement density. */
  @Prop() size: CheckboxSize = 'md';
  /** Native form field name. */
  @Prop({ reflect: true }) name: string | undefined;
  /** Submitted value when checked. */
  @Prop() value: string = 'on';
  /** Native disabled state. */
  @Prop({ reflect: true }) disabled: boolean = false;
  /** Require the checkbox to be checked for form validity. */
  @Prop({ reflect: true }) required: boolean = false;
  /** Validation message used when a required checkbox is unchecked. */
  @Prop() requiredMessage: string = DEFAULT_REQUIRED_MESSAGE;
  /** Mixed visual state. Activation clears it before toggling checked. */
  @Prop({ mutable: true }) indeterminate: boolean = false;
  /** Design-system inactive state. */
  @Prop() isInactive: boolean = false;
  /** Visual-only indicator for a composite control that owns selection semantics. */
  @Prop() presentation: boolean = false;

  /** Emitted after user activation with the new checked state. */
  @Event() dsChange!: EventEmitter<boolean>;

  private initialChecked = false;
  private initialIndeterminate = false;
  @State() private formDisabled = false;

  componentWillLoad() {
    this.initialChecked = this.checked;
    this.initialIndeterminate = this.indeterminate;
    this.syncFormValue();
  }

  @Watch('checked')
  @Watch('value')
  @Watch('disabled')
  @Watch('isInactive')
  @Watch('required')
  @Watch('presentation')
  syncFormValue() {
    const inactive = this.isInactive || this.disabled || this.formDisabled || this.presentation;
    this.internals.setFormValue(!inactive && this.checked ? this.value : null);
    const missing = this.required && !inactive && !this.checked;
    setRequiredValidity(this.internals, missing, this.requiredMessage);
  }

  formDisabledCallback(disabled: boolean) {
    this.formDisabled = disabled;
    this.syncFormValue();
  }

  formResetCallback() {
    this.checked = this.initialChecked;
    this.indeterminate = this.initialIndeterminate;
  }

  private handleActivate = () => {
    if (this.isInactive || this.disabled || this.formDisabled || this.presentation) return;
    if (this.indeterminate) this.indeterminate = false;
    this.checked = !this.checked;
    this.dsChange.emit(this.checked);
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.handleActivate();
    }
  };

  render() {
    const inactive = this.isInactive || this.disabled || this.formDisabled;
    const isMarked = this.checked || this.indeterminate;
    const invalid = this.required && !inactive && !this.checked;

    return (
      <Host
        role={this.presentation ? undefined : 'checkbox'}
        aria-checked={this.presentation ? undefined : this.indeterminate ? 'mixed' : String(this.checked)}
        aria-disabled={!this.presentation && inactive ? 'true' : undefined}
        aria-required={!this.presentation && this.required ? 'true' : undefined}
        aria-invalid={!this.presentation && invalid ? 'true' : undefined}
        aria-labelledby={this.presentation ? undefined : this.labelId}
        aria-hidden={this.presentation ? 'true' : undefined}
        tabIndex={this.presentation || inactive ? -1 : 0}
        class={{
          checkbox: true,
          'checkbox--presentation': this.presentation,
          [`checkbox--${this.size}`]: true,
          [`ds-control--${this.size}`]: true,
          'ds-control-inactive': inactive && !this.presentation,
          'ds-focus-ring-inset': !this.presentation,
          'ds-interaction-fill': !inactive && !this.presentation,
        }}
        onClick={this.presentation ? undefined : this.handleActivate}
        onKeyDown={this.presentation ? undefined : this.handleKeyDown}
      >
        <span class="checkbox__placement ds-interaction-fill__content" aria-hidden="true">
          <span class={{ box: true, 'box--marked': isMarked }}>
            {isMarked && (
              // eslint-disable-next-line local/prefer-ds-icon -- Checkbox owns this density-specific state mark and its optical stroke.
              <svg
                class={{
                  checkbox__mark: true,
                  'checkbox__mark--checked': !this.indeterminate,
                }}
                viewBox="0 0 16 16"
                fill="none"
                focusable="false"
              >
                <path
                  d={this.indeterminate ? 'M4 8H12' : 'M3.5 8.25L6.75 11.5L12.5 4.75'}
                  vector-effect="non-scaling-stroke"
                />
              </svg>
            )}
          </span>
        </span>
        {!this.presentation && (
          <ds-text
            class="checkbox__label ds-interaction-fill__content"
            as="span"
            variant={LABEL_VARIANT[this.size]}
            textId={this.labelId}
          >
            {this.label}
          </ds-text>
        )}
      </Host>
    );
  }
}
