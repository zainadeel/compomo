import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-card-setting.js';
import '../../../../dist/components/ds-inline-banner-settings.js';
import '../../../../dist/components/ds-radio.js';
import '../../../../dist/components/ds-setting-row-radio.js';

const SETTINGS_INFO =
  'Automated checks and human review help validate results and reduce false positives.';

const VALIDATION_OPTIONS = [
  {
    label: 'Use automated validation',
    value: 'enabled',
    description: 'Apply automated checks and human review to validate results.',
  },
  {
    label: 'Skip automated validation',
    value: 'disabled',
    description: 'Keep results available without additional validation.',
  },
];

const selectValidationMode = (event: CustomEvent<string>) => {
  (event.currentTarget as HTMLDsRadioElement).value = event.detail;
};

const meta: Meta = {
  title: 'Settings/SettingRowRadio',
  component: 'ds-setting-row-radio',
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => html`
    <div
      role="list"
      aria-label="Validation settings"
      style="max-width:var(--dimension-card-width-md);"
    >
      <ds-setting-row-radio role="listitem">
        <ds-radio
          .groupLabel=${'Validation mode'}
          .options=${VALIDATION_OPTIONS}
          value="enabled"
          @dsChange=${selectValidationMode}
        ></ds-radio>
      </ds-setting-row-radio>
    </div>
  `,
};

export const SettingsCardMock: Story = {
  render: () => html`
    <ds-card-setting heading="Validation settings" card-width="md" editing>
      <ds-inline-banner-settings description=${SETTINGS_INFO}></ds-inline-banner-settings>
      <ds-setting-row-radio>
        <ds-radio
          .groupLabel=${'Validation mode'}
          .options=${VALIDATION_OPTIONS}
          value="enabled"
          @dsChange=${selectValidationMode}
        ></ds-radio>
      </ds-setting-row-radio>
    </ds-card-setting>
  `,
};

export const View: Story = {
  render: () => html`
    <ds-setting-row-radio
      presentation="view"
      label="Validation mode"
      value-label="Use automated validation"
      description="Apply automated checks and human review to validate results."
    ></ds-setting-row-radio>
  `,
};

export const Inactive: Story = {
  render: () => html`
    <ds-setting-row-radio>
      <ds-radio
        .groupLabel=${'Validation mode'}
        .options=${VALIDATION_OPTIONS}
        value="enabled"
        is-inactive
      ></ds-radio>
    </ds-setting-row-radio>
  `,
};
