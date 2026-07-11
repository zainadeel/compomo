import { AttachInternals, Component, Prop, State, Event, EventEmitter, Watch, h, Host } from '@stencil/core';

@Component({
  tag: 'ds-toggle',
  styleUrl: 'Toggle.css',
  shadow: true,
  formAssociated: true,
})
export class Toggle {
  @AttachInternals() internals!: ElementInternals;
  @Prop({ mutable: true }) checked: boolean = false;
  @Prop({ reflect: true }) name: string | undefined;
  @Prop() value: string = 'on';
  @Prop({ reflect: true }) disabled: boolean = false;
  @Prop({ reflect: true }) required: boolean = false;
  @Prop() requiredMessage: string = 'This field is required.';
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

  private handleClick = () => {
    if (this.isInactive || this.disabled || this.formDisabled) return;
    this.checked = !this.checked;
    this.dsChange.emit(this.checked);
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (this.isInactive || this.disabled || this.formDisabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this.handleClick();
    }
  };

  render() {
    const inactive = this.isInactive || this.disabled || this.formDisabled;
    return (
      <Host
        role="switch"
        aria-checked={String(this.checked)}
        aria-disabled={inactive ? 'true' : undefined}
        tabIndex={inactive ? -1 : 0}
        class={{ toggle: true, checked: this.checked, 'ds-control-inactive': inactive }}
        onClick={this.handleClick}
        onKeyDown={this.handleKeyDown}
      >
        <span class="thumb" />
      </Host>
    );
  }
}
