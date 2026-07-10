import { Component, Prop, Event, EventEmitter, h, Host } from '@stencil/core';
import { CONTROL_TEXT_VARIANT } from '../../utils';

/**
 * Semantic chip state — replaces Tag’s intent × contrast matrix.
 * - `default` — neutral faint
 * - `active` — brand faint
 * - `error` — negative faint
 * - `caution` — caution faint
 */
export type ChipState = 'default' | 'active' | 'error' | 'caution';
export type ChipSize = 'md' | 'sm' | 'xs';
export type ChipBackground = 'faint' | 'medium' | 'bold' | 'strong' | 'always-dark';

/** Dismiss `ds-icon` size — same iconography metrics as Tag’s leading icon. */
const ICON_SIZE: Record<ChipSize, 'md' | 'sm' | 'xs'> = {
  md: 'md',
  sm: 'sm',
  xs: 'xs',
};

/**
 * Removable chip — same density recipe as Tag, but colored by semantic `state`
 * (not intent × contrast). Not a toggle/select control; the only intentional
 * action is remove.
 */
@Component({
  tag: 'ds-chip',
  styleUrl: 'Chip.css',
  scoped: true,
})
export class Chip {
  @Prop() label!: string;
  /** Semantic color state. @default 'default' */
  @Prop() state: ChipState = 'default';
  @Prop() size: ChipSize = 'md';
  @Prop() rounded: boolean = false;
  /** When true (default), shows the trailing dismiss control. */
  @Prop() removable: boolean = true;
  @Prop() maxWidth: string | number | undefined;
  @Prop() isInactive: boolean = false;
  /** Surface context for interaction-fill tokens when the chip sits on a non-default surface. */
  @Prop() background: ChipBackground | undefined;

  /** Fired when the remove button is clicked. */
  @Event() dsRemove!: EventEmitter<void>;

  private handleRemove = (e: MouseEvent) => {
    e.stopPropagation();
    if (this.isInactive) return;
    this.dsRemove.emit();
  };

  render() {
    const textVariant = CONTROL_TEXT_VARIANT[this.size];
    const iconSize = ICON_SIZE[this.size];

    const maxWidthStyle = this.maxWidth != null
      ? { maxWidth: typeof this.maxWidth === 'number' ? `${this.maxWidth}px` : this.maxWidth }
      : undefined;

    return (
      <Host
        class={{
          'tag': true,
          'chip': true,
          [`chip--${this.state}`]: true,
          [`tag--size-${this.size}`]: true,
          'ds-control--md': this.size === 'md',
          'ds-control--sm': this.size === 'sm',
          'ds-control--xs': this.size === 'xs',
          'tag--rounded': this.rounded,
          'tag--removable': this.removable,
          /* Hover overlay on the chip surface — dismiss is the only action. */
          'ds-interaction-fill': !this.isInactive && this.removable,
          'ds-interaction-fill--on-medium': this.background === 'medium',
          'ds-interaction-fill--on-bold': this.background === 'bold',
          'ds-interaction-fill--on-strong': this.background === 'strong',
          'ds-interaction-fill--on-always-dark': this.background === 'always-dark',
          'ds-control-inactive': this.isInactive,
        }}
        style={maxWidthStyle}
        aria-disabled={this.isInactive || undefined}
      >
        <span class="tag__label">
          <ds-text as="span" variant={textVariant} color="inherit">
            {this.label}
          </ds-text>
        </span>
        {this.removable && (
          <button
            type="button"
            class="tag__remove ds-focus-ring-inset"
            onClick={this.handleRemove}
            aria-label={`Remove ${this.label}`}
            disabled={this.isInactive || undefined}
          >
            <slot name="remove-icon">
              <ds-icon class="tag__remove-x" name="Cross" size={iconSize} color="inherit"></ds-icon>
            </slot>
          </button>
        )}
      </Host>
    );
  }
}
