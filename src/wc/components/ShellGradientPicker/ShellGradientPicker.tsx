import { Component, Prop, Event, EventEmitter, Element, h, Host } from '@stencil/core';
import {
  SHELL_GRADIENT_PRESETS,
  SHELL_GRADIENT_WASH_PRESETS,
  DEFAULT_SHELL_GRADIENT_PRESET,
  normalizeShellGradientPreset,
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
  @Prop() groupLabel: string = 'Shell gradient theme';

  @Event() dsChange!: EventEmitter<ShellGradientPreset>;

  @Element() el!: HTMLElement;

  private handleSwatchSelect = (preset: ShellGradientPreset) => {
    const normalized = normalizeShellGradientPreset(preset);
    if (normalized === normalizeShellGradientPreset(this.value)) return;
    this.value = normalized;
    this.dsChange.emit(normalized);
  };

  private focusSwatch(preset: ShellGradientPreset) {
    requestAnimationFrame(() => {
      const swatch = this.el.querySelector<HTMLElement>(
        `ds-shell-gradient-swatch[preset="${preset}"]`,
      );
      swatch?.querySelector<HTMLButtonElement>('button')?.focus();
    });
  }

  private handleSwatchKeyDown = (event: KeyboardEvent, preset: ShellGradientPreset) => {
    const currentIndex = SHELL_GRADIENT_PRESETS.indexOf(preset);
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % SHELL_GRADIENT_PRESETS.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + SHELL_GRADIENT_PRESETS.length) % SHELL_GRADIENT_PRESETS.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = SHELL_GRADIENT_PRESETS.length - 1;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    const nextPreset = SHELL_GRADIENT_PRESETS[nextIndex];
    this.handleSwatchSelect(nextPreset);
    this.focusSwatch(nextPreset);
  };

  private renderSwatch(preset: ShellGradientPreset) {
    const selected = normalizeShellGradientPreset(this.value) === preset;
    return (
      <ds-shell-gradient-swatch
        key={preset}
        preset={preset}
        selected={selected}
        onKeyDown={(event: KeyboardEvent) => this.handleSwatchKeyDown(event, preset)}
        onDsSelect={(e: CustomEvent<ShellGradientPreset>) => {
          e.stopPropagation();
          this.handleSwatchSelect(e.detail);
        }}
      />
    );
  }

  render() {
    return (
      <Host>
        <div
          class="shell-gradient-picker"
          role="radiogroup"
          aria-label={this.groupLabel}
        >
          {this.renderSwatch('none')}
          <div class="shell-gradient-picker__divider" aria-hidden="true" />
          {SHELL_GRADIENT_WASH_PRESETS.map(preset => this.renderSwatch(preset))}
        </div>
      </Host>
    );
  }
}
