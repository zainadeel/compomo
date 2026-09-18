import { Component, Element, h, Host, Prop } from '@stencil/core';
import { CONTROL_SUPPORTING_TEXT_VARIANT, CONTROL_TEXT_VARIANT } from '../../utils';

export type SettingRowRadioPresentation = 'edit' | 'view';

type SettingsRadio = HTMLElement & {
  groupLabel: string;
  ariaLabel: string | null;
  ariaLabelledby?: string;
};

let settingRowRadioHeadingId = 0;

/** Padded settings-row composition for a Radio group. */
@Component({
  tag: 'ds-setting-row-radio',
  styleUrl: 'SettingRowRadio.css',
  scoped: true,
})
export class SettingRowRadio {
  @Element() el!: HTMLElement;

  /** Interactive Radio group or non-interactive saved-value readout. */
  @Prop() presentation: SettingRowRadioPresentation = 'edit';
  /** Settings heading shown in both presentations. Not Radio's form groupLabel. */
  @Prop() label?: string;
  /** Saved option label shown in view presentation. */
  @Prop() valueLabel?: string;
  /** Optional consequence or supporting copy for the saved option. */
  @Prop() description?: string;

  private readonly headingId = `ds-setting-row-radio-heading-${++settingRowRadioHeadingId}`;

  componentWillLoad() {
    this.syncSlottedRadio();
  }

  componentDidLoad() {
    this.syncSlottedRadio();
  }

  private syncSlottedRadio = () => {
    for (const radio of this.el.querySelectorAll<SettingsRadio>('ds-radio')) {
      radio.groupLabel = '';
      if (this.label) {
        radio.ariaLabelledby = this.headingId;
        radio.ariaLabel = null;
      }
    }
  };

  private renderHeading() {
    if (!this.label) return null;
    return (
      <ds-text
        class="setting-row-radio__heading"
        as="span"
        variant={CONTROL_TEXT_VARIANT.md}
        emphasis
        textId={this.headingId}
      >
        {this.label}
      </ds-text>
    );
  }

  render() {
    return (
      <Host>
        {this.renderHeading()}
        {this.presentation === 'view' ? (
          this.valueLabel || this.description ? (
            <div class="setting-row-radio__choice">
              {this.valueLabel ? (
                <ds-text as="span" variant={CONTROL_TEXT_VARIANT.md}>
                  {this.valueLabel}
                </ds-text>
              ) : null}
              {this.description ? (
                <ds-text as="span" variant={CONTROL_SUPPORTING_TEXT_VARIANT.md} color="secondary">
                  {this.description}
                </ds-text>
              ) : null}
            </div>
          ) : null
        ) : (
          <slot onSlotchange={this.syncSlottedRadio} />
        )}
      </Host>
    );
  }
}
