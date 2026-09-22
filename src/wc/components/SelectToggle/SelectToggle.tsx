import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Prop,
  State,
  Watch,
} from '@stencil/core';
import { controlWidthClass, CONTROL_TEXT_VARIANT, type ControlWidth } from '../../utils';
import { observeTableCaptionCompact } from '../../utils/table-caption-compact';

export interface SelectToggleOption {
  value: string;
  label: string;
  icon?: string;
}

export type SelectToggleVariant = 'label' | 'icon' | 'icon-label';
export type SelectToggleSize = 'sm' | 'md' | 'lg';

@Component({ tag: 'ds-select-toggle', styleUrl: 'SelectToggle.css', scoped: true })
export class SelectToggle {
  @Element() el!: HTMLElement;

  /** Exactly two or three choices, each with a unique value and accessible label. */
  @Prop() options: SelectToggleOption[] = [];

  /** Current choice. User activation updates this value and emits dsChange. */
  @Prop({ mutable: true }) value: string = '';

  /** Show the current label, icon, or both. Icon variants require an icon on each choice. */
  @Prop() variant: SelectToggleVariant = 'label';

  /** Collapse an icon-label choice to its icon in a narrow table caption or data toolbar. */
  @Prop({ reflect: true }) collapseLabel: boolean = false;

  /** Control density: small, medium, or large; the trailing indicator scales with it. */
  @Prop() size: SelectToggleSize = 'md';

  /** Hug the content or fill the parent. */
  @Prop() width: ControlWidth = 'hug';

  /** Show an inset border; both treatments keep the transparent unfilled surface. */
  @Prop() hasBorder: boolean = true;

  /** Prevent interaction. */
  @Prop() isInactive: boolean = false;

  /** Optional stable context prepended to the changing accessible choice name. */
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | null = null;

  @Event() dsChange!: EventEmitter<string>;

  @State() private captionCompact = false;

  private captionCompactDisconnect: (() => void) | undefined;
  private hasLoaded = false;

  componentWillLoad() {
    this.reconcileValue();
  }

  componentDidLoad(): void {
    this.hasLoaded = true;
    this.syncCaptionCompactObserver();
  }

  connectedCallback(): void {
    if (this.hasLoaded) this.syncCaptionCompactObserver();
  }

  disconnectedCallback(): void {
    this.disconnectCaptionCompactObserver();
  }

  @Watch('collapseLabel')
  onCollapseLabelChange(): void {
    this.syncCaptionCompactObserver();
  }

  @Watch('options')
  @Watch('value')
  reconcileValue() {
    const choices = this.validOptions;
    if (choices.length && !choices.some(option => option.value === this.value)) {
      this.value = choices[0].value;
    }
  }

  private get validOptions(): SelectToggleOption[] {
    if (this.options.length < 2 || this.options.length > 3) return [];
    if (
      this.options.some(option => !option.value || !option.label) ||
      new Set(this.options.map(option => option.value)).size !== this.options.length
    ) {
      return [];
    }
    return this.options;
  }

  private advance = () => {
    const choices = this.validOptions;
    if (this.isInactive || !choices.length) return;
    const current = Math.max(
      0,
      choices.findIndex(option => option.value === this.value)
    );
    const next = choices[(current + 1) % choices.length];
    this.value = next.value;
    this.dsChange.emit(next.value);
  };

  private syncCaptionCompactObserver(): void {
    this.disconnectCaptionCompactObserver();
    if (!this.collapseLabel) {
      if (this.captionCompact) this.captionCompact = false;
      return;
    }
    this.captionCompactDisconnect = observeTableCaptionCompact(this.el, compact => {
      if (this.captionCompact !== compact) this.captionCompact = compact;
    });
  }

  private disconnectCaptionCompactObserver(): void {
    this.captionCompactDisconnect?.();
    this.captionCompactDisconnect = undefined;
  }

  render() {
    const choices = this.validOptions;
    const activeIndex = Math.max(
      0,
      choices.findIndex(option => option.value === this.value)
    );
    const active = choices[activeIndex];
    const next = choices[(activeIndex + 1) % choices.length];
    const showIcon = this.variant !== 'label';
    const showLabel =
      this.variant !== 'icon' &&
      !(this.collapseLabel && this.captionCompact && this.variant === 'icon-label' && active?.icon);
    const accessibleName = active
      ? `${this.ariaLabel ? `${this.ariaLabel}: ` : ''}${active.label}, ${activeIndex + 1} of ${choices.length}. Next: ${next.label}`
      : undefined;

    return (
      <Host
        class={{
          [`ds-control--${this.size}`]: true,
          ...controlWidthClass(this.width),
        }}
      >
        {active && (
          <button
            type="button"
            class={{
              trigger: true,
              'ds-control-frame': true,
              'ds-focus-ring-inset': true,
              'ds-interaction-fill': true,
              'ds-control-inactive': this.isInactive,
              'trigger--bordered': this.hasBorder,
            }}
            aria-label={accessibleName}
            disabled={this.isInactive}
            onClick={this.advance}
          >
            <span class="trigger__content ds-interaction-fill__content">
              {showIcon && active.icon && (
                <span class="trigger__icon ds-control-icon-box" aria-hidden="true">
                  <ds-icon name={active.icon} size={this.size} color="inherit" />
                </span>
              )}
              {showLabel && (
                <ds-text
                  class="trigger__label ds-control-label-box"
                  as="span"
                  variant={CONTROL_TEXT_VARIANT[this.size]}
                  color="inherit"
                  lineTruncation={1}
                >
                  {active.label}
                </ds-text>
              )}
            </span>
            <span class="trigger__indicator ds-interaction-fill__content" aria-hidden="true">
              {choices.map((option, index) => (
                <span key={option.value} class="trigger__dot-position">
                  <span
                    class={{
                      trigger__dot: true,
                      'trigger__dot--active': index === activeIndex,
                    }}
                  />
                </span>
              ))}
            </span>
          </button>
        )}
      </Host>
    );
  }
}
