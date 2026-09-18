import { Component, h, Host, Prop } from '@stencil/core';

export type SettingRowRadioPresentation = 'edit' | 'view';

/** Padded settings-row composition for a Radio group. */
@Component({
  tag: 'ds-setting-row-radio',
  styleUrl: 'SettingRowRadio.css',
  scoped: true,
})
export class SettingRowRadio {
  /** Interactive Radio group or non-interactive saved-value readout. */
  @Prop() presentation: SettingRowRadioPresentation = 'edit';
  /** Label shown above the saved value in view presentation. */
  @Prop() label?: string;
  /** Saved option label shown in view presentation. */
  @Prop() valueLabel?: string;
  /** Optional consequence or supporting copy for the saved option. */
  @Prop() description?: string;

  render() {
    return (
      <Host>
        {this.presentation === 'view' ? (
          <div class="setting-row-radio__view">
            {this.label ? (
              <ds-text as="span" variant="text-body-small" emphasis>
                {this.label}
              </ds-text>
            ) : null}
            {this.valueLabel ? (
              <ds-text as="span" variant="text-body-medium">
                {this.valueLabel}
              </ds-text>
            ) : null}
            {this.description ? (
              <ds-text as="span" variant="text-body-small" color="secondary">
                {this.description}
              </ds-text>
            ) : null}
          </div>
        ) : (
          <slot />
        )}
      </Host>
    );
  }
}
