import {
  AttachInternals,
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Method,
  Prop,
  State,
  Watch,
} from '@stencil/core';

export type SliderValue = number | number[];
export type SliderSize = 'md' | 'sm' | 'xs';
export type SliderOrientation = 'horizontal' | 'vertical';
export type SliderThumbAlignment = 'edge' | 'center';

const LABEL_VARIANT: Record<SliderSize, 'text-body-medium' | 'text-body-small' | 'text-caption'> = {
  md: 'text-body-medium',
  sm: 'text-body-small',
  xs: 'text-caption',
};

let sliderId = 0;
let sliderExternalLabelId = 0;

@Component({
  tag: 'ds-slider',
  styleUrl: 'Slider.css',
  scoped: true,
  formAssociated: true,
})
export class Slider {
  @Element() el!: HTMLElement;
  @AttachInternals() internals!: ElementInternals;

  /** Current value. Assign a two-number array through the JavaScript property for a range slider. */
  @Prop({ mutable: true }) value: SliderValue = 0;
  @Prop() min: number = 0;
  @Prop() max: number = 100;
  @Prop() step: number = 1;
  /** Minimum number of steps kept between two range thumbs. */
  @Prop() minStepsBetweenValues: number = 0;
  /** Visible field label. Supply aria-label when the label is intentionally hidden. */
  @Prop() label: string | undefined;
  /** Show the formatted current value beside the visible label. */
  @Prop() showValue: boolean = true;
  @Prop() size: SliderSize = 'md';
  @Prop() orientation: SliderOrientation = 'horizontal';
  /** Keep the complete thumb inside the rail bounds, or center it on the endpoints. */
  @Prop() thumbAlignment: SliderThumbAlignment = 'edge';
  @Prop({ reflect: true }) name: string | undefined;
  @Prop({ reflect: true }) form: string | undefined;
  @Prop({ reflect: true }) disabled: boolean = false;
  /** Keep the value focusable and submittable while preventing changes. */
  @Prop({ reflect: true }) readOnly: boolean = false;
  @Prop() isInactive: boolean = false;
  /** Direct accessible name for a single-thumb slider without a visible label. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;
  /** Id references for a visible single-thumb slider label. */
  @Prop({ attribute: 'aria-labelledby' }) ariaLabelledby: string | undefined;
  /** Id references for supporting guidance or error text. */
  @Prop({ attribute: 'aria-describedby' }) ariaDescribedby: string | undefined;
  /** Accessible label for the lower thumb in a range slider. */
  @Prop() startLabel: string = 'Minimum value';
  /** Accessible label for the upper thumb in a range slider. */
  @Prop() endLabel: string = 'Maximum value';
  /** Human-readable value text for a single slider or both range thumbs. */
  @Prop() valueText: string | undefined;
  /** Per-thumb human-readable value text for a range slider. Assign through the JavaScript property. */
  @Prop() valueTexts: string[] = [];
  /** Locale used by Intl.NumberFormat for the visible value. */
  @Prop() locale: string | undefined;
  /** Intl.NumberFormat options. Assign objects through the JavaScript property. */
  @Prop() formatOptions: Intl.NumberFormatOptions | undefined;
  @Prop() valuePrefix: string = '';
  @Prop() valueSuffix: string = '';
  @Prop() rangeSeparator: string = '–';
  /** Id applied to the first native range input. */
  @Prop() inputId: string | undefined;

  /** Emitted continuously while the value changes. */
  @Event() dsChange!: EventEmitter<SliderValue>;
  /** Emitted when a pointer or keyboard value change is committed. */
  @Event() dsCommit!: EventEmitter<SliderValue>;

  @State() private formDisabled = false;
  @State() private dragging = false;
  @State() private focused = false;
  @State() private touched = false;
  @State() private activeThumbIndex = 0;
  @State() private externalLabelledby: string | undefined;

  private readonly generatedId = `ds-slider-${++sliderId}`;
  private readonly labelId = `${this.generatedId}-label`;
  private initialValue: SliderValue = 0;
  private lastCommittedValue: SliderValue = 0;
  private pointerId: number | null = null;
  private pointerStartValue: SliderValue = 0;
  private controlEl: HTMLDivElement | null = null;

  componentWillLoad() {
    this.initialValue = this.cloneValue(this.publicValue);
    this.lastCommittedValue = this.cloneValue(this.publicValue);
    this.syncFormValue();
  }

  componentDidLoad() {
    this.syncNativeLabels();
  }

  @Watch('value')
  @Watch('min')
  @Watch('max')
  @Watch('step')
  @Watch('minStepsBetweenValues')
  @Watch('name')
  @Watch('disabled')
  @Watch('isInactive')
  syncFormValue() {
    const values = this.resolvedValues;
    if (this.isDisabled || !this.name) {
      this.internals.setFormValue(null);
      return;
    }

    if (this.isRange) {
      const data = new FormData();
      values.forEach(value => data.append(this.name as string, String(value)));
      this.internals.setFormValue(data, JSON.stringify(values));
    } else {
      this.internals.setFormValue(String(values[0]), String(values[0]));
    }
  }

  formDisabledCallback(disabled: boolean) {
    this.formDisabled = disabled;
    this.syncFormValue();
  }

  formResetCallback() {
    this.value = this.cloneValue(this.initialValue);
    this.lastCommittedValue = this.cloneValue(this.initialValue);
    this.dragging = false;
    this.focused = false;
    this.touched = false;
  }

  formStateRestoreCallback(state: string | File | FormData | null) {
    if (typeof state !== 'string') return;
    if (this.isRange) {
      try {
        const restored = JSON.parse(state);
        if (Array.isArray(restored)) this.value = restored.map(Number).slice(0, 2);
      } catch {
        this.value = this.cloneValue(this.initialValue);
      }
    } else {
      const restored = Number(state);
      if (Number.isFinite(restored)) this.value = restored;
    }
    this.lastCommittedValue = this.cloneValue(this.publicValue);
  }

  @Method()
  async setFocus(index: number = 0) {
    const inputs = this.el.querySelectorAll<HTMLInputElement>('.slider__input');
    inputs[Math.max(0, Math.min(index, inputs.length - 1))]?.focus();
  }

  private get isDisabled(): boolean {
    return this.disabled || this.isInactive || this.formDisabled;
  }

  private get isRange(): boolean {
    return Array.isArray(this.value);
  }

  private get safeStep(): number {
    return Number.isFinite(this.step) && this.step > 0 ? this.step : 1;
  }

  private get safeMin(): number {
    return Number.isFinite(this.min) ? this.min : 0;
  }

  private get safeMax(): number {
    const minimum = this.safeMin;
    return Number.isFinite(this.max) && this.max > minimum ? this.max : minimum + this.safeStep;
  }

  private get minimumGap(): number {
    const steps = Number.isFinite(this.minStepsBetweenValues)
      ? Math.max(0, Math.floor(this.minStepsBetweenValues))
      : 0;
    return steps * this.safeStep;
  }

  private get resolvedValues(): number[] {
    const minimum = this.safeMin;
    const maximum = this.safeMax;
    if (!this.isRange) return [this.snap(Number(this.value))];

    const raw = this.value as number[];
    let lower = this.snap(Number(raw[0] ?? minimum));
    let upper = this.snap(Number(raw[1] ?? maximum));
    if (lower > upper) [lower, upper] = [upper, lower];

    const gap = Math.min(this.minimumGap, maximum - minimum);
    if (upper - lower < gap) {
      upper = Math.min(maximum, this.snap(lower + gap));
      lower = Math.max(minimum, this.snap(upper - gap));
    }
    return [lower, upper];
  }

  private get publicValue(): SliderValue {
    const values = this.resolvedValues;
    return this.isRange ? [...values] : values[0];
  }

  private cloneValue(value: SliderValue): SliderValue {
    return Array.isArray(value) ? [...value] : value;
  }

  private valuesEqual(a: SliderValue, b: SliderValue): boolean {
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.length === b.length && a.every((value, index) => value === b[index]);
    }
    return !Array.isArray(a) && !Array.isArray(b) && a === b;
  }

  private decimalPlaces(value: number): number {
    const text = String(value).toLowerCase();
    if (text.includes('e-')) return Number(text.split('e-')[1]) || 0;
    return text.includes('.') ? text.split('.')[1].length : 0;
  }

  private snap(value: number): number {
    const minimum = this.safeMin;
    const maximum = this.safeMax;
    const candidate = Number.isFinite(value) ? value : minimum;
    const stepped = minimum + Math.round((candidate - minimum) / this.safeStep) * this.safeStep;
    const precision = Math.min(10, Math.max(
      this.decimalPlaces(minimum),
      this.decimalPlaces(maximum),
      this.decimalPlaces(this.safeStep),
    ));
    return Number(Math.min(maximum, Math.max(minimum, stepped)).toFixed(precision));
  }

  private percent(value: number): number {
    return ((value - this.safeMin) / (this.safeMax - this.safeMin)) * 100;
  }

  private allowedMin(index: number, values = this.resolvedValues): number {
    return this.isRange && index === 1
      ? Math.min(this.safeMax, values[0] + this.minimumGap)
      : this.safeMin;
  }

  private allowedMax(index: number, values = this.resolvedValues): number {
    return this.isRange && index === 0
      ? Math.max(this.safeMin, values[1] - this.minimumGap)
      : this.safeMax;
  }

  private setValueAt(index: number, next: number): boolean {
    const previous = this.publicValue;
    const values = this.resolvedValues;
    const constrained = Math.min(this.allowedMax(index, values), Math.max(this.allowedMin(index, values), this.snap(next)));
    values[index] = constrained;
    const nextValue: SliderValue = this.isRange ? [...values] : values[0];
    if (this.valuesEqual(previous, nextValue)) return false;

    this.value = nextValue;
    this.dsChange.emit(this.cloneValue(nextValue));
    return true;
  }

  private commitIfChanged() {
    const current = this.publicValue;
    if (this.valuesEqual(current, this.lastCommittedValue)) return;
    this.lastCommittedValue = this.cloneValue(current);
    this.dsCommit.emit(this.cloneValue(current));
  }

  private syncNativeLabels() {
    if (this.label || this.ariaLabel || this.ariaLabelledby || this.isRange) return;
    const ids = (Array.from(this.internals.labels) as HTMLLabelElement[]).map(label => {
      if (!label.id) label.id = `ds-slider-label-${++sliderExternalLabelId}`;
      return label.id;
    });
    if (ids.length) this.externalLabelledby = ids.join(' ');
  }

  private formattedValue(value: number, index: number): string {
    const authored = this.valueTexts[index] ?? this.valueText;
    if (authored) return authored;
    let number: string;
    try {
      number = new Intl.NumberFormat(this.locale, this.formatOptions).format(value);
    } catch {
      number = String(value);
    }
    return `${this.valuePrefix}${number}${this.valueSuffix}`;
  }

  private ariaValueText(value: number, index: number): string | undefined {
    if (this.valueTexts[index] || this.valueText || this.valuePrefix || this.valueSuffix || this.formatOptions) {
      return this.formattedValue(value, index);
    }
    return undefined;
  }

  private handleNativeInput = (event: Event, index: number) => {
    const input = event.target as HTMLInputElement;
    this.activeThumbIndex = index;
    if (this.readOnly || this.isDisabled) {
      input.value = String(this.resolvedValues[index]);
      return;
    }
    this.setValueAt(index, Number(input.value));
  };

  private handleNativeChange = () => {
    if (!this.readOnly && !this.isDisabled) this.commitIfChanged();
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    if (!this.readOnly) return;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) {
      event.preventDefault();
    }
  };

  private handleFocus = (index: number) => {
    this.activeThumbIndex = index;
    this.focused = true;
  };

  private handleBlur = (event: FocusEvent) => {
    const next = event.relatedTarget;
    if (next instanceof Node && this.el.contains(next)) return;
    this.focused = false;
    this.touched = true;
  };

  private handleHostClick = (event: MouseEvent) => {
    if (event.target !== this.el || this.isDisabled) return;
    const inputs = this.el.querySelectorAll<HTMLInputElement>('.slider__input');
    inputs[Math.min(this.activeThumbIndex, inputs.length - 1)]?.focus();
  };

  private pointerPercent(event: PointerEvent): number {
    const control = this.controlEl;
    if (!control) return 0;
    const rect = control.getBoundingClientRect();
    const thumb = this.el.querySelector<HTMLElement>('.slider__thumb');
    const thumbSize = thumb
      ? this.orientation === 'horizontal' ? thumb.offsetWidth : thumb.offsetHeight
      : 0;
    const inset = this.thumbAlignment === 'edge' ? thumbSize / 2 : 0;

    if (this.orientation === 'vertical') {
      const travel = Math.max(1, rect.height - inset * 2);
      return Math.min(1, Math.max(0, (rect.bottom - inset - event.clientY) / travel));
    }

    const travel = Math.max(1, rect.width - inset * 2);
    let percent = (event.clientX - rect.left - inset) / travel;
    if (getComputedStyle(this.el).direction === 'rtl') percent = 1 - percent;
    return Math.min(1, Math.max(0, percent));
  }

  private valueFromPointer(event: PointerEvent): number {
    return this.snap(this.safeMin + this.pointerPercent(event) * (this.safeMax - this.safeMin));
  }

  private closestThumbIndex(value: number, target: EventTarget | null): number {
    const targetElement = target instanceof HTMLElement
      ? target.closest<HTMLElement>('.slider__thumb')
      : null;
    if (targetElement?.dataset['index']) return Number(targetElement.dataset['index']);
    if (!this.isRange) return 0;

    const values = this.resolvedValues;
    const lowerDistance = Math.abs(value - values[0]);
    const upperDistance = Math.abs(value - values[1]);
    if (lowerDistance === upperDistance) return value >= values[0] ? 1 : 0;
    return lowerDistance < upperDistance ? 0 : 1;
  }

  private handlePointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || this.isDisabled || this.readOnly) return;
    event.preventDefault();
    const value = this.valueFromPointer(event);
    const index = this.closestThumbIndex(value, event.target);
    this.activeThumbIndex = index;
    this.pointerId = event.pointerId;
    this.pointerStartValue = this.cloneValue(this.publicValue);
    this.dragging = true;
    this.setValueAt(index, value);
    this.controlEl?.setPointerCapture(event.pointerId);
    requestAnimationFrame(() => this.el.querySelectorAll<HTMLInputElement>('.slider__input')[index]?.focus({ preventScroll: true }));
  };

  private handlePointerMove = (event: PointerEvent) => {
    if (this.pointerId !== event.pointerId || !this.dragging) return;
    event.preventDefault();
    this.setValueAt(this.activeThumbIndex, this.valueFromPointer(event));
  };

  private endPointerInteraction(event: PointerEvent, canceled: boolean) {
    if (this.pointerId !== event.pointerId) return;
    if (this.controlEl?.hasPointerCapture(event.pointerId)) this.controlEl.releasePointerCapture(event.pointerId);
    this.pointerId = null;
    this.dragging = false;
    this.touched = true;
    if (!canceled && !this.valuesEqual(this.pointerStartValue, this.publicValue)) this.commitIfChanged();
  }

  private renderThumb(value: number, index: number) {
    const inputId = index === 0
      ? this.inputId ?? `${this.generatedId}-input`
      : `${this.inputId ?? `${this.generatedId}-input`}-end`;
    const rangeLabel = index === 0 ? this.startLabel : this.endLabel;
    const labelledby = this.isRange
      ? undefined
      : this.ariaLabelledby ?? (this.label ? this.labelId : this.externalLabelledby);
    const directLabel = this.isRange ? rangeLabel : labelledby ? undefined : this.ariaLabel;

    return (
      <div
        class={{
          slider__thumb: true,
          'slider__thumb--active': index === this.activeThumbIndex,
        }}
        data-index={String(index)}
        style={{ '--ds-slider-thumb-pct': String(this.percent(value)) } as Record<string, string>}
      >
        <input
          class="slider__input"
          type="range"
          id={inputId}
          min={this.allowedMin(index)}
          max={this.allowedMax(index)}
          step={this.safeStep}
          value={value}
          disabled={this.isDisabled}
          aria-label={directLabel}
          aria-labelledby={labelledby}
          aria-describedby={this.ariaDescribedby}
          aria-valuetext={this.ariaValueText(value, index)}
          aria-orientation={this.orientation === 'vertical' ? 'vertical' : undefined}
          aria-readonly={this.readOnly ? 'true' : undefined}
          onInput={(event: Event) => this.handleNativeInput(event, index)}
          onChange={this.handleNativeChange}
          onKeyDown={this.handleKeyDown}
          onFocus={() => this.handleFocus(index)}
          onBlur={this.handleBlur}
        />
        <span class="slider__thumb-visual" aria-hidden="true"><span class="slider__thumb-wash" /></span>
      </div>
    );
  }

  render() {
    const values = this.resolvedValues;
    const first = values[0];
    const last = values[values.length - 1];
    const firstInputId = this.inputId ?? `${this.generatedId}-input`;
    const dirty = !this.valuesEqual(this.publicValue, this.initialValue);
    const valueDisplay = values.map((value, index) => this.formattedValue(value, index)).join(` ${this.rangeSeparator} `);

    return (
      <Host
        aria-disabled={this.isDisabled ? 'true' : undefined}
        class={{
          slider: true,
          [`slider--${this.size}`]: true,
          [`slider--${this.orientation}`]: true,
          [`slider--thumb-${this.thumbAlignment}`]: true,
          'slider--range': this.isRange,
          'slider--readonly': this.readOnly,
          'ds-control-inactive': this.isDisabled,
        }}
        data-orientation={this.orientation}
        data-disabled={this.isDisabled ? '' : undefined}
        data-readonly={this.readOnly ? '' : undefined}
        data-dragging={this.dragging ? '' : undefined}
        data-focused={this.focused ? '' : undefined}
        data-filled=""
        data-dirty={dirty ? '' : undefined}
        data-touched={this.touched ? '' : undefined}
        data-valid={!this.isDisabled ? '' : undefined}
        onClick={this.handleHostClick}
      >
        {(this.label || this.showValue) && (
          <div class="slider__label-row">
            {this.label && (
              <ds-text
                class="slider__label"
                as="label"
                variant={LABEL_VARIANT[this.size]}
                emphasis
                for={firstInputId}
                textId={this.labelId}
              >
                {this.label}
              </ds-text>
            )}
            {this.showValue && (
              <ds-text
                class="slider__value"
                as="span"
                variant={LABEL_VARIANT[this.size]}
                emphasis
                fontFeature="tabular-nums"
              >
                {valueDisplay}
              </ds-text>
            )}
          </div>
        )}
        <div
          class="slider__control"
          ref={element => { this.controlEl = element ?? null; }}
          style={{
            '--ds-slider-start-pct': String(this.isRange ? this.percent(first) : 0),
            '--ds-slider-end-pct': String(this.percent(last)),
          } as Record<string, string>}
          onPointerDown={this.handlePointerDown}
          onPointerMove={this.handlePointerMove}
          onPointerUp={(event: PointerEvent) => this.endPointerInteraction(event, false)}
          onPointerCancel={(event: PointerEvent) => this.endPointerInteraction(event, true)}
        >
          <div class="slider__rail" aria-hidden="true"><div class="slider__indicator" /></div>
          {values.map((value, index) => this.renderThumb(value, index))}
        </div>
      </Host>
    );
  }
}
