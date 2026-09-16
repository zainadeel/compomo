import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-radio-tile.js';
import '../../../../dist/components/ds-field.js';
const options = [
  {
    value: 'standard',
    label: 'Standard',
    description: 'Use the default settings for this workspace.',
  },
  {
    value: 'custom',
    label: 'Custom',
    description: 'Choose settings for your team.',
  },
  {
    value: 'managed',
    label: 'Managed',
    description: 'Configured by an administrator.',
    isInactive: true,
  },
];
export default {
  title: 'Form/Radio Tile',
  tags: ['autodocs'],
  argTypes: {
    direction: { control: 'select', options: ['vertical', 'horizontal'] },
    disabled: { control: 'boolean' },
    value: { control: 'text' },
  },
  args: { direction: 'vertical', value: 'standard', disabled: false },
} satisfies Meta;
type Story = StoryObj;
export const Playground: Story = {
  render: args =>
    html`<div style="width:min(720px,90vw)">
      <ds-field label="Configuration"
        ><ds-radio-tile
          .options=${options}
          .value=${args['value']}
          direction=${args['direction']}
          .disabled=${args['disabled']}
        ></ds-radio-tile
      ></ds-field>
    </div>`,
};
export const Horizontal: Story = {
  render: () =>
    html`<div style="width:min(720px,90vw)">
      <ds-radio-tile
        aria-label="Configuration"
        .options=${options}
        value="custom"
        direction="horizontal"
      ></ds-radio-tile>
    </div>`,
};
export const TextOnly: Story = {
  render: () =>
    html`<div style="width:320px">
      <ds-radio-tile
        aria-label="Notification frequency"
        .options=${[
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
        ]}
        value="daily"
      ></ds-radio-tile>
    </div>`,
};

export const Error: Story = {
  render: () =>
    html`<div style="width:min(480px,90vw)">
      <ds-field label="Configuration" error error-message="Choose an available configuration."
        ><ds-radio-tile .options=${options}></ds-radio-tile
      ></ds-field>
    </div>`,
};
