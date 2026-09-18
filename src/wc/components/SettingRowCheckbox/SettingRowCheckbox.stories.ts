import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-card-setting.js';
import '../../../../dist/components/ds-inline-banner-settings.js';
import '../../../../dist/components/ds-checkbox-group.js';
import '../../../../dist/components/ds-checkbox.js';
import '../../../../dist/components/ds-setting-row-checkbox.js';

const SETTINGS_INFO =
  'Select every channel that should receive in-cab and fleet alerts for this company.';

const alertChannels = () => html`
  <ds-checkbox-group>
    <ds-checkbox
      label="Email"
      description="Send a summary to the fleet email list."
      value="email"
      checked
    ></ds-checkbox>
    <ds-checkbox
      label="Mobile push"
      description="Notify drivers and managers in the Motive app."
      value="push"
      checked
    ></ds-checkbox>
    <ds-checkbox
      label="SMS"
      description="Send a text to on-call phone numbers."
      value="sms"
    ></ds-checkbox>
  </ds-checkbox-group>
`;

const alertChannelsNoSubtext = () => html`
  <ds-checkbox-group>
    <ds-checkbox label="Email" value="email" checked></ds-checkbox>
    <ds-checkbox label="Mobile push" value="push" checked></ds-checkbox>
    <ds-checkbox label="SMS" value="sms"></ds-checkbox>
  </ds-checkbox-group>
`;

const meta: Meta = {
  title: 'Settings/SettingRowCheckbox',
  component: 'ds-setting-row-checkbox',
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => html`
    <div
      role="list"
      aria-label="Notification settings"
      style="max-width:var(--dimension-card-width-md);"
    >
      <ds-setting-row-checkbox role="listitem" label="Alert channels">
        ${alertChannels()}
      </ds-setting-row-checkbox>
    </div>
  `,
};

export const SettingsCardMock: Story = {
  render: () => html`
    <ds-card-setting heading="Notification settings" card-width="md" editing>
      <ds-inline-banner-settings
        slot="banner"
        description=${SETTINGS_INFO}
      ></ds-inline-banner-settings>
      <ds-setting-row-checkbox label="Alert channels"> ${alertChannels()} </ds-setting-row-checkbox>
    </ds-card-setting>
  `,
};

export const View: Story = {
  render: () => html`
    <div
      role="list"
      aria-label="Notification settings"
      style="max-width:var(--dimension-card-width-md);"
    >
      <ds-setting-row-checkbox
        role="listitem"
        presentation="view"
        label="Alert channels"
        value-label="Email, Mobile push"
        description="Selected channels receive in-cab and fleet alerts."
      >
        ${alertChannels()}
      </ds-setting-row-checkbox>
    </div>
  `,
};

export const NoSubtext: Story = {
  render: () => html`
    <div
      role="list"
      aria-label="Notification settings"
      style="max-width:var(--dimension-card-width-md);"
    >
      <ds-setting-row-checkbox role="listitem" label="Alert channels">
        ${alertChannelsNoSubtext()}
      </ds-setting-row-checkbox>
    </div>
  `,
};

export const ViewNoSubtext: Story = {
  render: () => html`
    <div
      role="list"
      aria-label="Notification settings"
      style="max-width:var(--dimension-card-width-md);"
    >
      <ds-setting-row-checkbox
        role="listitem"
        presentation="view"
        label="Alert channels"
        value-label="Email, Mobile push"
      >
        ${alertChannelsNoSubtext()}
      </ds-setting-row-checkbox>
    </div>
  `,
};

export const Inactive: Story = {
  render: () => html`
    <ds-setting-row-checkbox label="Alert channels">
      <ds-checkbox-group>
        <ds-checkbox
          label="Email"
          description="Send a summary to the fleet email list."
          value="email"
          checked
        ></ds-checkbox>
        <ds-checkbox
          label="Mobile push"
          description="Notify drivers and managers in the Motive app."
          value="push"
          is-inactive
        ></ds-checkbox>
      </ds-checkbox-group>
    </ds-setting-row-checkbox>
  `,
};
