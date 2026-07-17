import { Component, Prop, Event, EventEmitter, h, Host } from '@stencil/core';
import {
  DEFAULT_SHELL_GRADIENT_PRESET,
  normalizeShellGradientPreset,
  type ShellGradientPreset,
} from '../ShellGradientSwatch/shell-gradient-swatch-types';
import { shellGradientPickerSections } from '../../shell/shell-gradient-presets';

/** @deprecated Use `ds-swatch-picker` with shell preset options. */
@Component({
  tag: 'ds-shell-gradient-picker',
  styleUrl: 'ShellGradientPicker.css',
  scoped: true,
})
export class ShellGradientPicker {
  /** Active shell wash preset. */
  @Prop({ mutable: true, reflect: true }) value: ShellGradientPreset =
    DEFAULT_SHELL_GRADIENT_PRESET;
  @Prop() groupLabel: string = 'Shell gradient theme';

  @Event() dsChange!: EventEmitter<ShellGradientPreset>;

  private handleChange = (value: string) => {
    const normalized = normalizeShellGradientPreset(value);
    if (normalized === normalizeShellGradientPreset(this.value)) return;
    this.value = normalized;
    this.dsChange.emit(normalized);
  };

  render() {
    return (
      <Host>
        <ds-swatch-picker
          value={normalizeShellGradientPreset(this.value)}
          groupLabel={this.groupLabel}
          sections={shellGradientPickerSections()}
          onDsChange={(event: CustomEvent<string>) => {
            event.stopPropagation();
            this.handleChange(event.detail);
          }}
        />
      </Host>
    );
  }
}
