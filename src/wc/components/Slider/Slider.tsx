import { Component, Prop, Event, EventEmitter, h, Host } from '@stencil/core';

let idCounter = 0;

@Component({
  tag: 'ds-slider',
  styleUrl: 'Slider.css',
  scoped: true,
})
export class Slider {
  private generatedId = `ds-slider-${++idCounter}`;

  @Prop() value: number = 0;
  @Prop() min: number = 0;
  @Prop() max: number = 100;
  @Prop() step: number = 1;
  @Prop() label!: string;
  @Prop() inactive: boolean = false;
  @Prop() valueText: string | undefined;
  /** Associates with an external <label>. Defaults to an auto-generated ID. */
  @Prop() inputId: string | undefined;

  @Event() dsChange!: EventEmitter<number>;

  private handleInput = (e: Event) => {
    this.dsChange.emit(Number((e.target as HTMLInputElement).value));
  };

  private get pct() {
    const range = this.max - this.min;
    return range === 0 ? 0 : Math.round(((this.value - this.min) / range) * 100);
  }

  render() {
    const finalId = this.inputId ?? this.generatedId;
    const pct = this.pct;

    return (
      <Host class="field">
        <div class="label-row">
          <label class="text-body-small-emphasis" htmlFor={finalId}>{this.label}</label>
          <span class="text-body-small-emphasis">{this.value}</span>
        </div>
        <div
          class={{ track: true, 'track--inactive': this.inactive, 'track--at-min': pct === 0 }}
          style={{ '--slider-pct': String(pct) } as Record<string, string>}
        >
          <div class="track-inner">
            <div class="fill-track"><div class="fill" /></div>
            <div class="thumb" />
          </div>
          <input
            type="range"
            id={finalId}
            min={this.min}
            max={this.max}
            step={this.step}
            value={this.value}
            disabled={this.inactive}
            class="range-input"
            aria-valuetext={this.valueText}
            onInput={this.handleInput}
          />
        </div>
      </Host>
    );
  }
}
