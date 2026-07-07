import { Component, Prop, Event, EventEmitter, h, Host } from '@stencil/core';
import {
  SHELL_GRADIENT_PRESET_LABELS,
  buildShellRadialGradientForPreset,
  DEFAULT_SHELL_GRADIENT_PRESET,
  type ShellGradientPreset,
} from './shell-gradient-swatch-types';
import { SHELL_GRADIENT_OPACITY } from '../../nav/shell-gradient';

@Component({
  tag: 'ds-shell-gradient-swatch',
  styleUrl: 'ShellGradientSwatch.css',
  scoped: true,
})
export class ShellGradientSwatch {
  /** Wash preset this orb previews. */
  @Prop({ reflect: true }) preset: ShellGradientPreset = DEFAULT_SHELL_GRADIENT_PRESET;

  /** Selected — brand stroke + halo over inner fill/border/interaction stack. */
  @Prop({ reflect: true }) selected = false;

  @Prop() inactive = false;

  @Prop({ attribute: 'aria-label' }) ariaLabel: string | undefined;

  @Event() dsSelect!: EventEmitter<ShellGradientPreset>;

  private handleClick = () => {
    if (this.inactive) return;
    this.dsSelect.emit(this.preset);
  };

  render() {
    const label = this.ariaLabel ?? SHELL_GRADIENT_PRESET_LABELS[this.preset];

    return (
      <Host>
        <button
          type="button"
          class={{
            'shell-gradient-swatch': true,
            'ds-focus-ring-inset': true,
            'shell-gradient-swatch--selected': this.selected,
            'shell-gradient-swatch--none': this.preset === 'none',
          }}
          style={
            this.preset === 'none'
              ? undefined
              : {
                  '--_swatch-gradient-image': buildShellRadialGradientForPreset(this.preset),
                  '--ds-shell-gradient-opacity': SHELL_GRADIENT_OPACITY,
                }
          }
          aria-label={label}
          aria-pressed={this.selected ? 'true' : 'false'}
          disabled={this.inactive}
          onClick={this.handleClick}
        >
          <span class="shell-gradient-swatch__fill" aria-hidden="true" />
          <span class="shell-gradient-swatch__border" aria-hidden="true" />
          <span class="shell-gradient-swatch__interaction" aria-hidden="true" />
          <span class="shell-gradient-swatch__halo" aria-hidden="true" />
          <span class="shell-gradient-swatch__stroke" aria-hidden="true" />
        </button>
      </Host>
    );
  }
}
