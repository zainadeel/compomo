import { Component, Prop, Event, EventEmitter, Element, State, h, Host } from '@stencil/core';

export type ButtonVariant   = 'primary' | 'secondary';
export type ButtonElevation = 'none' | 'flat' | 'elevated' | 'floating';
export type ButtonIntent    = 'none' | 'neutral' | 'brand' | 'ai' | 'negative' | 'warning' | 'caution' | 'positive';
export type ButtonSize      = 'xs' | 'sm' | 'md' | 'lg';
export type ButtonContrast  = 'strong' | 'bold' | 'medium' | 'faint';
export type ButtonBackground = 'faint' | 'medium' | 'bold' | 'strong' | 'always-dark';

const ICON_SIZE: Record<ButtonSize, number> = { xs: 12, sm: 16, md: 20, lg: 24 };
const TEXT_CLASS: Record<ButtonSize, string> = {
  xs: 'text-caption-emphasis',
  sm: 'text-body-small-emphasis',
  md: 'text-body-medium-emphasis',
  lg: 'text-body-large-emphasis',
};

@Component({
  tag: 'ds-button',
  styleUrl: 'Button.css',
  scoped: true,
})
export class Button {
  @Element() el!: HTMLElement;

  @Prop() variant: ButtonVariant = 'primary';
  @Prop() intent: ButtonIntent = 'brand';
  @Prop() size: ButtonSize = 'md';
  @Prop() label: string | undefined;
  @Prop() rounded: boolean = false;
  @Prop() fullWidth: boolean = false;
  @Prop() width: string | undefined;
  @Prop() contrast: ButtonContrast = 'bold';
  @Prop() background: ButtonBackground | undefined;
  @Prop() dropdown: boolean = false;
  @Prop() badgeCount: number | undefined;
  @Prop() elevation: ButtonElevation | undefined;
  @Prop() loading: boolean = false;
  @Prop() inactive: boolean = false;
  @Prop() href: string | undefined;
  @Prop() target: string | undefined;
  @Prop() type: 'button' | 'submit' | 'reset' = 'button';
  @Prop({ attribute: 'aria-label' }) ariaLabel: string | undefined;
  @Prop({ attribute: 'aria-labelledby' }) ariaLabelledby: string | undefined;

  @State() private hasIcon: boolean = false;

  @Event() dsClick!: EventEmitter<MouseEvent>;
  @Event() dsMouseEnter!: EventEmitter<MouseEvent>;
  @Event() dsMouseLeave!: EventEmitter<MouseEvent>;

  componentWillLoad() {
    this.hasIcon = !!this.el.querySelector('[slot="icon"]');
  }

  private handleClick = (e: MouseEvent) => {
    if (this.inactive || this.loading) return;
    this.dsClick.emit(e);
  };

  private get effectiveElevation(): ButtonElevation {
    return this.elevation ?? (this.variant === 'primary' ? 'none' : 'flat');
  }

  render() {
    const Tag = this.href ? 'a' : 'button';
    const size = this.size;
    const iconSize = ICON_SIZE[size];
    const textClass = TEXT_CLASS[size];
    const elev = this.effectiveElevation;
    const hasLabel = !!this.label;
    const showLeading = this.hasIcon || this.loading;
    const isIconOnly = showLeading && !hasLabel;
    const isLabelOnly = hasLabel && !showLeading;
    const isIconAndLabel = showLeading && hasLabel;
    const bg = this.background;

    const btnCls: Record<string, boolean> = {
      btn: true,
      [this.variant]: true,
      [`intent${cap(this.intent)}`]: true,
      [`size${size.toUpperCase()}`]: size !== 'md',
      rounded: this.rounded,
      inactive: this.inactive || this.loading,
      iconOnly: isIconOnly,
      labelOnly: isLabelOnly,
      iconAndLabel: isIconAndLabel,
      dropdown: this.dropdown,
      [`contrast${cap(this.contrast)}`]: this.variant === 'primary' && this.intent !== 'none' && this.contrast !== 'bold',
      [`elevation${cap(elev)}`]: true,
      onMedium: bg === 'medium',
      onBold: bg === 'bold',
      onStrong: bg === 'strong',
      onAlwaysDark: bg === 'always-dark',
      fullWidth: this.fullWidth,
    };

    const extraProps: Record<string, unknown> = {};
    if (Tag === 'button') {
      extraProps.type = this.type;
      extraProps.disabled = this.inactive || this.loading;
    }
    if (this.href) extraProps.href = this.href;
    if (this.target) extraProps.target = this.target;

    return (
      <Host class={{ 'btn-host': true, 'btn-host--full': this.fullWidth }}>
        <Tag
          class={btnCls}
          style={this.width ? { width: this.width } : undefined}
          aria-label={this.ariaLabel}
          aria-labelledby={this.ariaLabelledby}
          aria-disabled={this.inactive || this.loading || undefined}
          aria-busy={this.loading || undefined}
          onClick={this.handleClick}
          onMouseEnter={(e: MouseEvent) => !this.inactive && !this.loading && this.dsMouseEnter.emit(e)}
          onMouseLeave={(e: MouseEvent) => !this.inactive && !this.loading && this.dsMouseLeave.emit(e)}
          {...extraProps}
        >
          {/* Leading icon / loader */}
          <span class="btn__icon" style={{ fontSize: `${iconSize}px`, display: showLeading ? undefined : 'none' }}>
            {this.loading
              ? <ds-loader size={iconSize} />
              : <slot name="icon" />
            }
          </span>
          {/* Label */}
          {hasLabel && (
            <span class={`btn__label ${textClass}`}>{this.label}</span>
          )}
          {/* Trailing chevron */}
          {this.dropdown && (
            <svg
              class="btn__chevron"
              width={iconSize}
              height={iconSize}
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          )}
          {/* Badge */}
          {this.badgeCount != null && this.badgeCount > 0 && (
            <span class="btn__badge">
              {this.badgeCount > 9 ? '+' : this.badgeCount}
            </span>
          )}
        </Tag>
      </Host>
    );
  }
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
