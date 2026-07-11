import { AttachInternals, Component, Prop, State, Event, EventEmitter, Watch, h, Host } from '@stencil/core';

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

  @Prop() label!: string;
  @Prop({ mutable: true }) checked: boolean = false;
  @Prop({ reflect: true }) name: string | undefined;
  @Prop() value: string = 'on';
  @Prop({ reflect: true }) disabled: boolean = false;
  @Prop({ reflect: true }) required: boolean = false;
  @Prop() requiredMessage: string = 'This field is required.';
  @Prop() indeterminate: boolean = false;
  @Prop() isInactive: boolean = false;

  @Event() dsChange!: EventEmitter<boolean>;

  private initialChecked = false;
  @State() private formDisabled = false;

  componentWillLoad() {
    this.initialChecked = this.checked;
    this.syncFormValue();
  }

  @Watch('checked')
  @Watch('value')
  @Watch('disabled')
  @Watch('isInactive')
  @Watch('required')
  syncFormValue() {
    const inactive = this.isInactive || this.disabled || this.formDisabled;
    this.internals.setFormValue(!inactive && this.checked ? this.value : null);
    const missing = this.required && !inactive && !this.checked;
    this.internals.setValidity(missing ? { valueMissing: true } : {}, missing ? this.requiredMessage : '');
  }

  formDisabledCallback(disabled: boolean) {
    this.formDisabled = disabled;
    this.syncFormValue();
  }

  formResetCallback() {
    this.checked = this.initialChecked;
  }

  private handleActivate = () => {
    if (this.isInactive || this.disabled || this.formDisabled) return;
    this.checked = !this.checked;
    this.dsChange.emit(this.checked);
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this.handleActivate();
    }
  };

  render() {
    const inactive = this.isInactive || this.disabled || this.formDisabled;
    const isMarked = this.checked || this.indeterminate;

    return (
      <Host
        role="checkbox"
        aria-checked={this.indeterminate ? 'mixed' : String(this.checked)}
        aria-disabled={inactive ? 'true' : undefined}
        aria-labelledby={this.labelId}
        tabIndex={inactive ? -1 : 0}
        class={{ checkbox: true, 'ds-control-inactive': inactive }}
        onClick={this.handleActivate}
        onKeyDown={this.handleKeyDown}
      >
        <span class={{ box: true, 'box--marked': isMarked }}>
          {isMarked && (
            <span class="checkmark" aria-hidden="true">
              {this.indeterminate ? '−' : '✓'}
            </span>
          )}
        </span>
        <ds-text class="checkbox__label" as="span" variant="text-body-medium" textId={this.labelId}>
          {this.label}
        </ds-text>
      </Host>
    );
  }
}
