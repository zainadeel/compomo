import { Component, Element, h, Host, Prop } from '@stencil/core';
import { CONTROL_SUPPORTING_TEXT_VARIANT, CONTROL_TEXT_VARIANT } from '../../utils';

export type SettingRowCheckboxPresentation = 'edit' | 'view';

type SettingsCheckboxGroup = HTMLElement & {
  label: string;
  ariaLabel: string | null;
  ariaLabelledby?: string;
};

let settingRowCheckboxHeadingId = 0;

/** Padded settings-row composition for a Checkbox group. */
@Component({
  tag: 'ds-setting-row-checkbox',
  styleUrl: 'SettingRowCheckbox.css',
  scoped: true,
})
export class SettingRowCheckbox {
  @Element() el!: HTMLElement;

  /** Interactive Checkbox group or non-interactive saved-value readout. */
  @Prop({ reflect: true }) presentation: SettingRowCheckboxPresentation = 'edit';
  /** Settings heading shown in both presentations. Not CheckboxGroup's form label. */
  @Prop() label?: string;
  /** Saved selected-value labels shown in view presentation. */
  @Prop() valueLabel?: string;
  /** Optional consequence or supporting copy for the saved selection. */
  @Prop() description?: string;

  private readonly headingId = `ds-setting-row-checkbox-heading-${++settingRowCheckboxHeadingId}`;

  componentWillLoad() {
    this.syncSlottedCheckboxGroup();
  }

  componentDidLoad() {
    this.syncSlottedCheckboxGroup();
  }

  private syncSlottedCheckboxGroup = () => {
    for (const group of this.el.querySelectorAll<SettingsCheckboxGroup>('ds-checkbox-group')) {
      group.label = '';
      if (this.label) {
        group.ariaLabelledby = this.headingId;
        group.ariaLabel = null;
      }
    }
  };

  render() {
    return (
      <Host>
        <ds-text
          key="setting-row-checkbox-heading"
          class="setting-row-checkbox__heading"
          as="span"
          variant={CONTROL_TEXT_VARIANT.md}
          emphasis
          textId={this.label ? this.headingId : undefined}
        >
          {this.label}
        </ds-text>
        <div key="setting-row-checkbox-choice" class="setting-row-checkbox__choice">
          {this.valueLabel ? (
            <ds-text key="setting-row-checkbox-value" as="span" variant={CONTROL_TEXT_VARIANT.md}>
              {this.valueLabel}
            </ds-text>
          ) : null}
          {this.description?.trim() ? (
            <ds-text
              key="setting-row-checkbox-description"
              as="span"
              variant={CONTROL_SUPPORTING_TEXT_VARIANT.md}
              color="secondary"
            >
              {this.description}
            </ds-text>
          ) : null}
        </div>
        <slot onSlotchange={this.syncSlottedCheckboxGroup} />
      </Host>
    );
  }
}
