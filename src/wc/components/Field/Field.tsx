import { Component, Element, Prop, State, Watch, h, Host } from '@stencil/core';

interface FieldControl extends HTMLElement {
  value?: string | string[];
  inputId?: string;
  error?: boolean;
  disabled?: boolean;
  isInactive?: boolean;
  required?: boolean;
  setFocus?: () => Promise<void> | void;
}

interface AuthoredAria {
  labelledby: string[];
  describedby: string[];
}

let fieldCounter = 0;

const tokens = (value: string | null | undefined): string[] =>
  value?.split(/\s+/).filter(Boolean) ?? [];

const uniqueTokens = (...groups: string[][]): string[] => [...new Set(groups.flat())];

@Component({
  tag: 'ds-field',
  styleUrl: 'Field.css',
  scoped: true,
})
export class Field {
  @Element() el!: HTMLElement;

  /** Persistent visible label for the single slotted control. */
  @Prop() label!: string;
  /** Explicit ID for the slotted control; generated when omitted. */
  @Prop() fieldId: string | undefined;
  /** Optional guidance associated with the slotted control while no visible error is shown. */
  @Prop() description: string | undefined;
  /** Invalid visual and accessible state forwarded to supported ds controls. */
  @Prop() error: boolean = false;
  /** Visible error associated with the slotted control while error is true. */
  @Prop() errorMessage: string | undefined;

  @State() private focused = false;
  @State() private filled = false;
  @State() private dirty = false;
  @State() private touched = false;
  @State() private controlDisabled = false;
  @State() private controlRequired = false;

  private readonly generatedId = `ds-field-${++fieldCounter}`;
  private controlContainer?: HTMLDivElement;
  private control?: FieldControl;
  private initialValue = '';
  private authoredAria = new WeakMap<FieldControl, AuthoredAria>();

  componentDidLoad() {
    this.syncControl();
    requestAnimationFrame(() => this.syncControl());
  }

  componentDidRender() {
    this.syncControl();
  }

  @Watch('fieldId')
  @Watch('description')
  @Watch('error')
  @Watch('errorMessage')
  onFieldContractChange() {
    this.syncControl();
  }

  private get controlId(): string {
    return this.fieldId || this.generatedId;
  }

  private get labelId(): string {
    return `${this.controlId}-label`;
  }

  private get descriptionId(): string {
    return `${this.controlId}-description`;
  }

  private get errorId(): string {
    return `${this.controlId}-error`;
  }

  private get renderedDescription(): boolean {
    return Boolean(this.description) && !this.renderedError;
  }

  private get renderedError(): boolean {
    return this.error && Boolean(this.errorMessage);
  }

  private readValue(control: FieldControl): string {
    const value = control.value;
    return Array.isArray(value) ? value.join('\u001f') : String(value ?? '');
  }

  private updateControlAttribute(control: FieldControl, name: string, value: string | undefined) {
    if (value === undefined) {
      if (control.hasAttribute(name)) control.removeAttribute(name);
      return;
    }
    if (control.getAttribute(name) !== value) control.setAttribute(name, value);
  }

  private findControl(): FieldControl | undefined {
    return this.controlContainer?.querySelector<FieldControl>(':scope > :not(slot)') ?? undefined;
  }

  private syncControl = () => {
    const control = this.findControl();
    if (!control) return;

    if (control !== this.control) {
      this.control = control;
      this.initialValue = this.readValue(control);
      this.authoredAria.set(control, {
        labelledby: tokens(control.getAttribute('aria-labelledby')),
        describedby: tokens(control.getAttribute('aria-describedby')),
      });
    }

    const isDsControl = control.tagName.startsWith('DS-');
    if (isDsControl && 'inputId' in control) control.inputId = this.controlId;
    else this.updateControlAttribute(control, 'id', this.controlId);

    const authored = this.authoredAria.get(control) ?? { labelledby: [], describedby: [] };
    const labelledby = uniqueTokens(authored.labelledby, [this.labelId]).join(' ');
    const describedby = uniqueTokens(
      authored.describedby,
      this.renderedDescription ? [this.descriptionId] : [],
      this.renderedError ? [this.errorId] : [],
    ).join(' ');

    this.updateControlAttribute(control, 'aria-labelledby', labelledby);
    this.updateControlAttribute(control, 'aria-describedby', describedby || undefined);
    this.updateControlAttribute(control, 'aria-invalid', this.error ? 'true' : undefined);

    if (isDsControl && 'error' in control && control.error !== this.error) control.error = this.error;

    const value = this.readValue(control);
    this.filled = value.length > 0;
    this.dirty = value !== this.initialValue;
    this.controlDisabled = Boolean(control.disabled || control.isInactive || control.hasAttribute('disabled'));
    this.controlRequired = Boolean(control.required || control.hasAttribute('required'));
  };

  private handleLabelClick = (event: MouseEvent) => {
    if (!this.control?.tagName.startsWith('DS-')) return;
    event.preventDefault();
    this.control.setFocus?.();
  };

  private handleFocusIn = () => {
    this.focused = true;
  };

  private handleFocusOut = (event: FocusEvent) => {
    if (event.relatedTarget instanceof Node && this.el.contains(event.relatedTarget)) return;
    this.focused = false;
    this.touched = true;
  };

  private handleValueChange = () => {
    this.syncControl();
  };

  render() {
    return (
      <Host
        data-focused={this.focused ? '' : undefined}
        data-filled={this.filled ? '' : undefined}
        data-dirty={this.dirty ? '' : undefined}
        data-touched={this.touched ? '' : undefined}
        data-invalid={this.error ? '' : undefined}
        data-disabled={this.controlDisabled ? '' : undefined}
        data-required={this.controlRequired ? '' : undefined}
        onFocusin={this.handleFocusIn}
        onFocusout={this.handleFocusOut}
        onInput={this.handleValueChange}
        onChange={this.handleValueChange}
        onDsChange={this.handleValueChange}
      >
        <div class="field">
          <ds-text
            class="field__label"
            as="label"
            variant="text-body-small"
            color="primary"
            emphasis
            for={this.controlId}
            textId={this.labelId}
            onClick={this.handleLabelClick}
          >
            {this.label}
          </ds-text>
          <div class="field__control" ref={el => (this.controlContainer = el)}>
            <slot onSlotchange={this.syncControl} />
          </div>
          {this.renderedDescription && (
            <ds-text
              class="field__description"
              as="div"
              variant="text-body-small"
              color="secondary"
              textId={this.descriptionId}
            >
              {this.description}
            </ds-text>
          )}
          {this.renderedError && (
            <ds-text
              class="field__error"
              as="div"
              variant="text-body-small"
              color="negative"
              textId={this.errorId}
              role="alert"
            >
              {this.errorMessage}
            </ds-text>
          )}
        </div>
      </Host>
    );
  }
}
