import {
  AttachInternals,
  Component,
  Element,
  Prop,
  State,
  Event,
  EventEmitter,
  Listen,
  Method,
  Watch,
  h,
  Host,
} from '@stencil/core';
import {
  controlWidthClass,
  CONTROL_TEXT_VARIANT,
  DEFAULT_REQUIRED_MESSAGE,
  formatClockTimeLabel,
  isClockTime,
  parseLooseClockTime,
  resolveChoicePopupAlignOffset,
  resolveCssLengthPx,
  resolveMotionTimeMs,
  restoreStringFormState,
  setFormControlValue,
  setRequiredValidity,
  TOKEN_DEFAULTS,
  type ControlSize,
  type ControlWidth,
} from '../../utils';
import { AnchoredPositionController } from '../../utils/anchored-position-controller';
import { AnchoredOverlayInteractionController } from '../../utils/anchored-overlay-interaction-controller';
import { resolveAnchoredOverlayBoundaryRect } from '../../utils/anchored-overlay-boundary';

export type InputTimeSize = ControlSize;
export type InputTimeWidth = ControlWidth;

let idCounter = 0;

@Component({
  tag: 'ds-input-time',
  styleUrl: 'InputTime.css',
  scoped: true,
  formAssociated: true,
})
export class InputTime {
  @Element() el!: HTMLElement;
  @AttachInternals() internals!: ElementInternals;

  private generatedId = `ds-input-time-${++idCounter}`;
  private errorId = `${this.generatedId}-error`;
  private popupId = `${this.generatedId}-popup`;

  @Prop({ mutable: true }) value: string = '';
  @Prop({ reflect: true }) name: string | undefined;
  @Prop({ reflect: true }) form: string | undefined;
  @Prop({ reflect: true }) disabled: boolean = false;
  @Prop({ reflect: true }) readOnly: boolean = false;
  @Prop({ reflect: true }) required: boolean = false;
  @Prop() requiredMessage: string = DEFAULT_REQUIRED_MESSAGE;
  /** Native time step in seconds. Defaults to minutes (`60`). */
  @Prop() step: string | number = 60;
  @Prop() min: string | undefined;
  @Prop() max: string | undefined;
  @Prop() size: InputTimeSize = 'md';
  @Prop() width: InputTimeWidth = 'fill';
  @Prop() hasBorder: boolean = true;
  @Prop() hasInteractionFill: boolean = true;
  @Prop() isInactive: boolean = false;
  @Prop() autoFocus: boolean = false;
  @Prop() error: boolean = false;
  @Prop() errorMessage: string | undefined;
  @Prop() inputId: string | undefined;
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;
  @Prop({ attribute: 'aria-labelledby' }) ariaLabelledby: string | undefined;
  @Prop({ attribute: 'aria-describedby' }) ariaDescribedby: string | undefined;

  @Event() dsChange!: EventEmitter<string>;

  private initialValue = '';
  private inputEl?: HTMLInputElement;
  private controlEl?: HTMLElement;
  private clockButton?: HTMLDsButtonUnfilledElement;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  @State() private formDisabled = false;
  @State() private focused = false;
  @State() private touched = false;
  @State() private draftText = '';
  @State() private open = false;
  @State() private shouldRender = false;
  @State() private closing = false;
  @State() private positionReady = false;
  @State() private pos = { x: 0, y: 0 };

  private readonly position = new AnchoredPositionController({
    getAnchor: () => this.controlEl ?? null,
    getPopup: () => this.el.querySelector<HTMLElement>('.input-time-popup'),
    getOwnerDocument: () => this.el.ownerDocument,
    measure: (anchor, popup) => {
      if (!this.open) return null;
      const sectionInsetPx = resolveCssLengthPx(TOKEN_DEFAULTS.space050, TOKEN_DEFAULTS.space050);
      return {
        anchorRect: anchor.getBoundingClientRect(),
        popupWidth: popup.offsetWidth || this.popupFallbackWidth,
        popupHeight: popup.offsetHeight || this.popupFallbackHeight,
        side: 'bottom',
        align: 'end',
        sideOffsetPx: resolveCssLengthPx(TOKEN_DEFAULTS.space050, TOKEN_DEFAULTS.space050),
        alignOffsetPx: resolveChoicePopupAlignOffset({
          align: 'end',
          alignOffsetPx: 0,
          sectionInsetPx,
          anchorAlignment: 'popup-frame',
        }),
        viewportPadPx: resolveCssLengthPx(TOKEN_DEFAULTS.space050, TOKEN_DEFAULTS.space050),
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        collisionRect: resolveAnchoredOverlayBoundaryRect(anchor),
      };
    },
    apply: ({ x, y }) => {
      this.pos = { x, y };
    },
    onReady: () => {
      this.positionReady = true;
    },
    liveUpdate: 'double-frame',
    observeResize: true,
    topLayer: true,
  });
  private readonly interaction = new AnchoredOverlayInteractionController({
    getAnchor: () => this.controlEl ?? null,
    getPopup: () => this.el.querySelector<HTMLElement>('.input-time-popup'),
    getOwnerDocument: () => this.el.ownerDocument,
    onOutsideActivation: () => this.closePicker(false),
  });

  private get popupFallbackWidth(): number {
    return resolveCssLengthPx(TOKEN_DEFAULTS.menuWidthXs, TOKEN_DEFAULTS.menuWidthXs);
  }

  private get popupFallbackHeight(): number {
    return resolveCssLengthPx(TOKEN_DEFAULTS.menuFallbackHeight, TOKEN_DEFAULTS.menuFallbackHeight);
  }

  componentWillLoad() {
    this.initialValue = this.value;
    this.syncFormValue();
  }

  disconnectedCallback() {
    this.position.unobserve();
    this.teardownListeners();
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
    this.draftText = this.displayValue;
  }

  formStateRestoreCallback(state: string | File | FormData | null) {
    this.value = restoreStringFormState(state);
    this.draftText = this.displayValue;
  }

  @Method()
  async setFocus() {
    this.inputEl?.focus();
  }

  @Listen('keydown')
  handleHostKeyDown(event: KeyboardEvent) {
    if (!this.shouldRender || this.closing) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closePicker('button');
      return;
    }
    if (event.key !== 'Tab') return;
    const popup = this.el.querySelector<HTMLElement>('.input-time-popup');
    if (!popup || !event.composedPath().includes(popup)) return;
    if (!this.interaction.tabLeavesPopup(event)) return;
    event.preventDefault();
    this.closePicker(false);
    this.interaction.moveFocusAfterTab(event.shiftKey);
  }

  private get displayValue(): string {
    return formatClockTimeLabel(this.value);
  }

  private parseDraft(text: string): string | null {
    const trimmed = text.trim();
    if (!trimmed) return '';
    const iso = parseLooseClockTime(trimmed);
    if (!iso) return null;
    if (this.min && isClockTime(this.min) && iso < this.min) return null;
    if (this.max && isClockTime(this.max) && iso > this.max) return null;
    return iso;
  }

  private commitIso(iso: string, emit = true) {
    if (this.value !== iso) {
      this.value = iso;
      if (emit) this.dsChange.emit(iso);
    }
    this.draftText = formatClockTimeLabel(iso);
  }

  private teardownListeners() {
    this.position.unobserve();
    this.interaction.disconnect();
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  private openPicker() {
    const inactive = this.isInactive || this.disabled || this.formDisabled || this.readOnly;
    if (inactive || this.open) return;
    this.shouldRender = true;
    this.closing = false;
    this.positionReady = false;
    this.open = true;
    this.teardownListeners();
    this.interaction.connect();
    this.position.observe();
    this.position.schedule();
  }

  private closePicker(restore: 'input' | 'button' | false) {
    if (!this.shouldRender || this.closing) return;
    this.open = false;
    this.position.cancel();
    this.closing = true;
    this.interaction.disconnect();
    this.position.unobserve();
    if (restore === 'input') this.inputEl?.focus();
    if (restore === 'button') void this.clockButton?.setFocus();
    const duration = resolveMotionTimeMs(
      TOKEN_DEFAULTS.motionShort2,
      TOKEN_DEFAULTS.animationDurationShort3
    );
    if (duration <= 0) {
      this.finishClose();
      return;
    }
    this.closeTimer = setTimeout(() => this.finishClose(), duration);
  }

  private finishClose() {
    const popup = this.el.querySelector<HTMLElement>('.input-time-popup');
    if (popup?.matches(':popover-open')) popup.hidePopover();
    this.shouldRender = false;
    this.closing = false;
    this.closeTimer = null;
  }

  private togglePicker = () => {
    if (this.isInactive || this.disabled || this.formDisabled || this.readOnly) return;
    if (this.open) this.closePicker('button');
    else this.openPicker();
  };

  private handleInput = (event: Event) => {
    this.draftText = (event.target as HTMLInputElement).value;
    const parsed = this.parseDraft(this.draftText);
    if (parsed === null) return;
    this.commitIso(parsed);
  };

  private handleFocus = () => {
    this.draftText = this.displayValue || this.value;
    this.focused = true;
  };

  private handleBlur = () => {
    this.focused = false;
    this.touched = true;
    const parsed = this.parseDraft(this.draftText);
    if (parsed === null) {
      this.draftText = this.displayValue;
      return;
    }
    this.commitIso(parsed);
  };

  private handleTimeChange = (event: CustomEvent<string>) => {
    event.stopPropagation();
    if (!isClockTime(event.detail)) return;
    this.commitIso(event.detail);
  };

  render() {
    const inputId = this.inputId ?? this.generatedId;
    const inactive = this.isInactive || this.disabled || this.formDisabled;
    const filled = this.value.length > 0;
    const dirty = this.value !== this.initialValue;
    const showError = this.error && Boolean(this.errorMessage);
    const textVariant = CONTROL_TEXT_VARIANT[this.size];
    const textClass = `ds-text--${textVariant.replace('text-', '')}`;
    const describedBy =
      [this.ariaDescribedby, showError ? this.errorId : undefined].filter(Boolean).join(' ') ||
      undefined;
    const popupStyle = {
      position: 'fixed',
      left: '0',
      top: '0',
      transform: `translate(${Math.round(this.pos.x)}px, ${Math.round(this.pos.y)}px)`,
      zIndex: 'var(--dimension-z-index-floating)',
      visibility: this.positionReady ? 'visible' : 'hidden',
    };

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
        data-invalid={this.error ? '' : undefined}
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
            'input-control': true,
            'ds-control-frame': true,
            'input-control--bordered': this.hasBorder,
            'input-control--error': this.hasBorder && this.error,
            'ds-interaction-fill': this.hasInteractionFill,
            [`ds-control--${this.size}`]: true,
          }}
        >
          <input
            ref={element => {
              this.inputEl = element;
            }}
            type="text"
            id={inputId}
            value={this.focused ? this.draftText : this.displayValue}
            disabled={inactive}
            readOnly={this.readOnly}
            required={this.required}
            autoFocus={this.autoFocus}
            autoComplete="off"
            spellcheck={false}
            class={{
              'native-input': true,
              'native-input--align-start': true,
              'ds-control-label-box': true,
              [textClass]: true,
              'ds-text--regular': true,
            }}
            aria-label={this.ariaLabel}
            aria-labelledby={this.ariaLabelledby}
            aria-describedby={describedBy}
            aria-invalid={this.error ? 'true' : undefined}
            onInput={this.handleInput}
            onFocus={this.handleFocus}
            onBlur={this.handleBlur}
          />
          <ds-button-unfilled
            ref={element => {
              this.clockButton = element as HTMLDsButtonUnfilledElement | undefined;
            }}
            class="input-control__datetime-action"
            variant="icon"
            size={this.size}
            icon="Clock"
            hasBorder={false}
            isInset
            isInactive={inactive || this.readOnly}
            ariaLabel="Choose time"
            haspopup="dialog"
            expanded={this.open}
            surfaceOpen={this.open || this.closing}
            controls={this.open ? this.popupId : undefined}
            onDsClick={this.togglePicker}
          />
        </div>
        {this.shouldRender ? (
          <div
            id={this.popupId}
            popover="manual"
            class={{
              'input-time-popup': true,
              'ds-choice-popup': true,
              'ds-choice-popup--closing': this.closing,
              'ds-chrome-column': true,
              'ds-chrome-space--sm': true,
            }}
            style={popupStyle}
            role="dialog"
            aria-label="Choose time"
          >
            <ds-time-picker
              value={this.value}
              min={this.min}
              max={this.max}
              step={this.step}
              autoFocus
              onDsChange={this.handleTimeChange}
            />
          </div>
        ) : null}
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
