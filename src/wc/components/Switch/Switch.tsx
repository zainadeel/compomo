import { AttachInternals, Component, Element, Prop, State, Event, EventEmitter, Watch, h, Host } from '@stencil/core';

export type SwitchSize = 'md' | 'sm' | 'xs';

let generatedLabelId = 0;

@Component({
  tag: 'ds-switch',
  styleUrl: 'Switch.css',
  shadow: true,
  formAssociated: true,
})
export class Switch {
  @Element() el!: HTMLElement;
  @AttachInternals() internals!: ElementInternals;

  /** Current on/off state. The initial value is restored when the owning form resets. */
  @Prop({ mutable: true }) checked: boolean = false;

  @Prop({ reflect: true }) name: string | undefined;
  @Prop() value: string = 'on';

  /** Optional value submitted when unchecked; omitted by default like a native checkbox. */
  @Prop() uncheckedValue: string | undefined;

  /** Associates the switch with a form by id when it is rendered outside that form. */
  @Prop({ reflect: true }) form: string | undefined;

  @Prop({ reflect: true }) disabled: boolean = false;
  @Prop({ reflect: true }) readOnly: boolean = false;
  @Prop({ reflect: true }) required: boolean = false;
  @Prop() requiredMessage: string = 'This field is required.';
  @Prop() isInactive: boolean = false;

  /** Compact track size for placement inside controls, menus, and form rows. */
  @Prop() size: SwitchSize = 'md';

  /**
   * Removes standalone control semantics so a composite owner such as a
   * `menuitemcheckbox` can use the switch as an aria-hidden visual indicator.
   */
  @Prop() presentation: boolean = false;

  @Event() dsChange!: EventEmitter<boolean>;

  private initialChecked = false;
  @State() private formDisabled = false;

  componentWillLoad() {
    this.initialChecked = this.checked;
    this.syncFormValue();
  }

  componentDidLoad() {
    this.syncNativeLabels();
  }

  @Watch('checked')
  @Watch('value')
  @Watch('uncheckedValue')
  @Watch('disabled')
  @Watch('isInactive')
  @Watch('presentation')
  @Watch('required')
  syncFormValue() {
    const inactive = this.presentation || this.isInactive || this.disabled || this.formDisabled;
    const submissionValue = this.checked ? this.value : this.uncheckedValue ?? null;
    const state = this.checked ? 'checked' : 'unchecked';
    this.internals.setFormValue(inactive ? null : submissionValue, state);

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

  formStateRestoreCallback(state: string | File | FormData | null) {
    this.checked = state === 'checked';
  }

  private syncNativeLabels() {
    if (this.presentation) return;
    if (this.el.hasAttribute('aria-label') || this.el.hasAttribute('aria-labelledby')) return;

    const labelIds = (Array.from(this.internals.labels) as HTMLLabelElement[]).map(label => {
      if (!label.id) label.id = `ds-switch-label-${++generatedLabelId}`;
      return label.id;
    });
    if (labelIds.length) this.el.setAttribute('aria-labelledby', labelIds.join(' '));
  }

  private handleClick = () => {
    if (this.presentation || this.readOnly || this.isInactive || this.disabled || this.formDisabled) return;
    this.checked = !this.checked;
    this.dsChange.emit(this.checked);
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    if (this.presentation || this.readOnly || this.isInactive || this.disabled || this.formDisabled) return;
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.handleClick();
    }
  };

  render() {
    const inactive = this.isInactive || this.disabled || this.formDisabled;
    return (
      <Host
        role={this.presentation ? undefined : 'switch'}
        aria-checked={this.presentation ? undefined : String(this.checked)}
        aria-disabled={!this.presentation && inactive ? 'true' : undefined}
        aria-readonly={!this.presentation && this.readOnly ? 'true' : undefined}
        aria-hidden={this.presentation ? 'true' : undefined}
        data-checked={this.checked ? '' : undefined}
        data-unchecked={!this.checked ? '' : undefined}
        data-disabled={inactive ? '' : undefined}
        data-readonly={this.readOnly ? '' : undefined}
        data-required={this.required ? '' : undefined}
        tabIndex={this.presentation || inactive ? -1 : 0}
        class={{
          switch: true,
          checked: this.checked,
          'switch--md': this.size === 'md',
          'switch--sm': this.size === 'sm',
          'switch--xs': this.size === 'xs',
          'switch--readonly': this.readOnly,
          'switch--presentation': this.presentation,
          'ds-focus-ring': true,
          'ds-interaction-fill': true,
          'ds-interaction-fill--bordered': true,
          'ds-control-inactive': inactive,
        }}
        onClick={this.handleClick}
        onKeyDown={this.handleKeyDown}
      >
        <span class="thumb ds-interaction-fill__content" />
      </Host>
    );
  }
}
