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
  @Prop({ reflect: true }) presentation: SettingRowRadioPresentation = 'edit';
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

  render() {
    return (
      <Host>
        <ds-text
          key="setting-row-radio-heading"
          class="setting-row-radio__heading"
          as="span"
          variant={CONTROL_TEXT_VARIANT.md}
          emphasis
          textId={this.label ? this.headingId : undefined}
        >
          {this.label}
        </ds-text>
        <div key="setting-row-radio-choice" class="setting-row-radio__choice">
          {this.valueLabel ? (
            <ds-text key="setting-row-radio-value" as="span" variant={CONTROL_TEXT_VARIANT.md}>
              {this.valueLabel}
            </ds-text>
          ) : null}
          {this.description ? (
            <ds-text
              key="setting-row-radio-description"
              as="span"
              variant={CONTROL_SUPPORTING_TEXT_VARIANT.md}
              color="secondary"
            >
              {this.description}
            </ds-text>
          ) : null}
        </div>
        <slot onSlotchange={this.syncSlottedRadio} />
      </Host>
    );
  }
}
