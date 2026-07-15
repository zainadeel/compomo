import { Component, Event, EventEmitter, Prop, h, Host } from '@stencil/core';
import { CONTROL_TEXT_VARIANT } from '../../utils';

export type TagIntent   = 'neutral' | 'brand' | 'ai' | 'negative' | 'warning' | 'caution' | 'positive';
export type TagContrast = 'strong' | 'bold' | 'medium' | 'faint';
export type TagSize     = 'md' | 'sm' | 'xs';

/**
 * `ds-icon` size prop matching control-density icon metrics
 * (md→20 / sm→16 / xs→12 via `--dimension-iconography-*`).
 */
const ICON_SIZE: Record<TagSize, 'md' | 'sm' | 'xs'> = {
  md: 'md',
  sm: 'sm',
  xs: 'xs',
};

@Component({
  tag: 'ds-tag',
  styleUrl: 'Tag.css',
  scoped: true,
})
export class Tag {
  @Prop() label!: string;
  /** Canonical icon name rendered before the visible label. */
  @Prop() icon: string = '';
  @Prop() intent: TagIntent = 'neutral';
  @Prop() contrast: TagContrast = 'faint';
  @Prop() size: TagSize = 'md';
  @Prop() rounded: boolean = false;
  @Prop() maxWidth: string | number | undefined;
  /** Render a menu-trigger button with a fixed ChevronUpDown suffix. */
  @Prop() interactive: boolean = false;
  /** Controlled open state for the menu triggered by an interactive Tag. */
  @Prop() expanded: boolean = false;
  /** ID of the menu controlled by an interactive Tag. */
  @Prop() ariaControls: string | undefined;
  /** Disable an interactive Tag and apply the shared inactive treatment. */
  @Prop() isInactive: boolean = false;

  /** Fired when the interactive Tag button is activated. */
  @Event() dsClick!: EventEmitter<MouseEvent>;

  private handleClick = (event: MouseEvent) => {
    if (!this.interactive || this.isInactive) return;
    this.dsClick.emit(event);
  };

  render() {
    const textVariant = CONTROL_TEXT_VARIANT[this.size];
    const iconSize = ICON_SIZE[this.size];

    const maxWidthStyle = this.maxWidth != null
      ? { maxWidth: typeof this.maxWidth === 'number' ? `${this.maxWidth}px` : this.maxWidth }
      : undefined;
    const hostClass = {
      'tag': true,
      [`tag--intent-${this.intent}`]: true,
      [`tag--contrast-${this.contrast}`]: true,
      [`tag--size-${this.size}`]: true,
      'ds-control--md': this.size === 'md',
      'ds-control--sm': this.size === 'sm',
      'ds-control--xs': this.size === 'xs',
      'tag--rounded': this.rounded,
      'tag--interactive': this.interactive,
      'ds-control-inactive': this.interactive && this.isInactive,
    };
    const content = [
      this.icon && (
        <ds-icon
          class="tag__prefix-icon"
          name={this.icon}
          size={iconSize}
          color="inherit"
        ></ds-icon>
      ),
      <ds-text class="tag__label" as="span" variant={textVariant} color="inherit">
        {this.label}
      </ds-text>,
    ];

    if (!this.interactive) {
      return <Host class={hostClass} style={maxWidthStyle}>{content}</Host>;
    }

    return (
      <Host class={hostClass} style={maxWidthStyle}>
        <button
          type="button"
          class="tag__button ds-interaction-fill ds-focus-ring-inset"
          aria-haspopup="menu"
          aria-expanded={this.expanded ? 'true' : 'false'}
          aria-controls={this.ariaControls}
          disabled={this.isInactive || undefined}
          onClick={this.handleClick}
        >
          {content}
          <ds-icon
            class="tag__suffix-icon"
            name="ChevronUpDown"
            size={iconSize}
            color="inherit"
          ></ds-icon>
        </button>
      </Host>
    );
  }
}
