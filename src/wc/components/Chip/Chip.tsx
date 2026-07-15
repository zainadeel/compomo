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
  @Prop() maxWidth: string | number | undefined;
  @Prop() isInactive: boolean = false;
  /** Accessible remove action. Use `{label}` as the chip-label placeholder. */
  @Prop() removeLabel: string = 'Remove {label}';

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
          'tag--removable': true,
          /* Hover overlay on the chip surface — dismiss is the only action. */
          'ds-interaction-fill': !this.isInactive,
          'ds-control-inactive': this.isInactive,
        }}
        style={maxWidthStyle}
        aria-disabled={this.isInactive ? 'true' : undefined}
      >
        <ds-text class="tag__label" as="span" variant={textVariant} color="inherit">
          {this.label}
        </ds-text>
        <button
          type="button"
          class="tag__remove ds-focus-ring-inset"
          onClick={this.handleRemove}
          aria-label={this.removeLabel.replace('{label}', this.label)}
          disabled={this.isInactive || undefined}
        >
          <ds-icon class="tag__remove-x" name="Cross" size={iconSize} color="inherit"></ds-icon>
        </button>
      </Host>
    );
  }
}
