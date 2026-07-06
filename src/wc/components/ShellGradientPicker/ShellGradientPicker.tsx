import { Component, Prop, Event, EventEmitter, h, Host } from '@stencil/core';
import {
  SHELL_GRADIENT_PRESETS,
  DEFAULT_SHELL_GRADIENT_PRESET,
  type ShellGradientPreset,
} from '../ShellGradientSwatch/shell-gradient-swatch-types';

@Component({
  tag: 'ds-shell-gradient-picker',
  styleUrl: 'ShellGradientPicker.css',
  scoped: true,
})
export class ShellGradientPicker {
  /** Active shell wash preset. */
  @Prop({ mutable: true, reflect: true }) value: ShellGradientPreset =
    DEFAULT_SHELL_GRADIENT_PRESET;

  @Event() dsChange!: EventEmitter<ShellGradientPreset>;

  private handleSwatchSelect = (preset: ShellGradientPreset) => {
    if (preset === this.value) return;
    this.value = preset;
    this.dsChange.emit(preset);
  };

  render() {
    return (
      <Host>
        <div
          class="shell-gradient-picker"
          role="radiogroup"
          aria-label="Shell gradient theme"
        >
          {SHELL_GRADIENT_PRESETS.map(preset => (
            <ds-shell-gradient-swatch
              key={preset}
              preset={preset}
              selected={this.value === preset}
              onDsSelect={(e: CustomEvent<ShellGradientPreset>) => {
                e.stopPropagation();
                this.handleSwatchSelect(e.detail);
              }}
            />
          ))}
        </div>
      </Host>
    );
  }
}
