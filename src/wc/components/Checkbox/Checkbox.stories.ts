import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-checkbox.js';

const meta: Meta = {
  title: 'Form/Checkbox',
  tags: ['autodocs'],
  argTypes: {
    label:         { control: 'text' },
    checked:       { control: 'boolean' },
    indeterminate: { control: 'boolean' },
    inactive:      { control: 'boolean' },
  },
  args: { label: 'Checkbox label', checked: false, indeterminate: false, inactive: false },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <ds-checkbox
      label=${args['label']}
      ?checked=${args['checked']}
      ?indeterminate=${args['indeterminate']}
      ?inactive=${args['inactive']}
    ></ds-checkbox>
  `,
};

export const States: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 4px; max-width: 240px">
      <ds-checkbox label="Unchecked"></ds-checkbox>
      <ds-checkbox label="Checked" checked></ds-checkbox>
      <ds-checkbox label="Indeterminate" indeterminate></ds-checkbox>
      <ds-checkbox label="Inactive unchecked" inactive></ds-checkbox>
      <ds-checkbox label="Inactive checked" checked inactive></ds-checkbox>
    </div>
  `,
};
