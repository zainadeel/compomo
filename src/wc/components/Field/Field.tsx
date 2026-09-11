import { Component, Element, Prop, State, Watch, h, Host } from '@stencil/core';

interface FieldControl extends HTMLElement {
  value?: string | string[];
  inputId?: string;
  error?: boolean;
  disabled?: boolean;
  isInactive?: boolean;
  required?: boolean;
  hasBorder?: boolean;
  size?: string;
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

const CONTROL_SIZES = ['lg', 'md', 'sm', 'xs'] as const;
type FieldControlSize = (typeof CONTROL_SIZES)[number];

const readControlSize = (control: FieldControl): FieldControlSize =>
  CONTROL_SIZES.includes(control.size as FieldControlSize)
    ? (control.size as FieldControlSize)
    : 'md';

@Component({
  tag: 'ds-field',
  styleUrl: 'Field.css',
  scoped: true,
})
export class Field {
  @Element() el!: HTMLElement;

  /** Visible label for the slotted control. Omit when a nearby heading already names the field. */
  @Prop() label?: string;
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
  @State() private controlBorderless = false;
  @State() private controlSize: 'lg' | 'md' | 'sm' | 'xs' = 'md';
  /** Bumped to let Stencil relocate a control added after the initial render. */
  @State() private slotRevision = 0;

  private readonly generatedId = `ds-field-${++fieldCounter}`;
  private controlContainer?: HTMLDivElement;
  private control?: FieldControl;
  private initialValue = '';
  private authoredAria = new WeakMap<FieldControl, AuthoredAria>();
  private childObserver?: MutationObserver;
  private controlAttrObserver?: MutationObserver;
  private didLoad = false;

  connectedCallback() {
    if (this.didLoad) this.observeLateControls();
  }

  disconnectedCallback() {
    this.childObserver?.disconnect();
    this.childObserver = undefined;
    this.controlAttrObserver?.disconnect();
    this.controlAttrObserver = undefined;
  }

  componentDidLoad() {
    this.syncControl();
    this.didLoad = true;
    this.observeLateControls();
    requestAnimationFrame(() => this.syncControl());
  }

  componentDidRender() {
    this.syncControl();
  }

  @Watch('fieldId')
  @Watch('label')
  @Watch('description')
  @Watch('error')
  @Watch('errorMessage')
  onFieldContractChange() {
    this.syncControl();
  }

  private get hasLabel(): boolean {
    return Boolean(this.label?.trim());
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

  private observeLateControls() {
    if (this.childObserver || typeof MutationObserver === 'undefined') return;
    this.childObserver = new MutationObserver(records => {
      const addedControl = records.some(record =>
        Array.from(record.addedNodes).some(node => node.nodeType === 1)
      );
      if (addedControl) this.slotRevision++;
    });
    this.childObserver.observe(this.el, { childList: true });
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
      this.observeControlAttributes(control);
    }

    const isDsControl = control.tagName.startsWith('DS-');
    if (isDsControl && 'inputId' in control) control.inputId = this.controlId;
    else this.updateControlAttribute(control, 'id', this.controlId);

    const authored = this.authoredAria.get(control) ?? { labelledby: [], describedby: [] };
    const labelledby = uniqueTokens(authored.labelledby, this.hasLabel ? [this.labelId] : []).join(
      ' '
    );
    const describedby = uniqueTokens(
      authored.describedby,
      this.renderedDescription ? [this.descriptionId] : [],
      this.renderedError ? [this.errorId] : []
    ).join(' ');

    this.updateControlAttribute(control, 'aria-labelledby', labelledby || undefined);
    this.updateControlAttribute(control, 'aria-describedby', describedby || undefined);
    this.updateControlAttribute(control, 'aria-invalid', this.error ? 'true' : undefined);

    if (isDsControl && 'error' in control && control.error !== this.error)
      control.error = this.error;

    const value = this.readValue(control);
    this.filled = value.length > 0;
    this.dirty = value !== this.initialValue;
    this.controlDisabled = Boolean(
      control.disabled || control.isInactive || control.hasAttribute('disabled')
    );
    this.controlRequired = Boolean(control.required || control.hasAttribute('required'));
    this.controlBorderless = control.hasBorder === false;
    this.controlSize = readControlSize(control);
  };

  private observeControlAttributes(control: FieldControl) {
    this.controlAttrObserver?.disconnect();
    this.controlAttrObserver = new MutationObserver(() => this.syncControl());
    this.controlAttrObserver.observe(control, {
      attributes: true,
      attributeFilter: ['has-border', 'size', 'class'],
    });
  }

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
        <div
          class={{
            field: true,
            'ds-field-stack': true,
            'ds-field-stack--supporting-inset': this.controlBorderless,
            [`ds-control--${this.controlSize}`]: true,
          }}
        >
          {this.hasLabel ? (
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
          ) : null}
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
