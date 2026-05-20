import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-field.js';

const meta: Meta = {
  title: 'Form/Field',
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
  },
  args: { label: 'Vehicle name' },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <div style="padding: 16px; max-width: 320px">
      <ds-field label=${args['label'] ?? 'Vehicle name'}>
        <input
          id="vehicle-name"
          type="text"
          placeholder="Enter vehicle name"
          style="width: 100%; padding: 8px; border: 1px solid var(--color-border-primary); border-radius: var(--dimension-radius-075); background: var(--color-background-primary); color: var(--color-foreground-primary); font-size: 14px; box-sizing: border-box"
        />
      </ds-field>
    </div>
  `,
};

export const WithSelect: Story = {
  render: () => html`
    <div style="padding: 16px; max-width: 320px">
      <ds-field label="Status">
        <select
          id="status"
          style="width: 100%; padding: 8px; border: 1px solid var(--color-border-primary); border-radius: var(--dimension-radius-075); background: var(--color-background-primary); color: var(--color-foreground-primary); font-size: 14px"
        >
          <option>Active</option>
          <option>Inactive</option>
          <option>Pending</option>
        </select>
      </ds-field>
    </div>
  `,
};

export const Multiple: Story = {
  render: () => html`
    <div style="padding: 16px; max-width: 320px; display: flex; flex-direction: column; gap: 16px">
      <ds-field label="First name">
        <input id="first" type="text" placeholder="John"
          style="width: 100%; padding: 8px; border: 1px solid var(--color-border-primary); border-radius: var(--dimension-radius-075); background: var(--color-background-primary); color: var(--color-foreground-primary); font-size: 14px; box-sizing: border-box" />
      </ds-field>
      <ds-field label="Last name">
        <input id="last" type="text" placeholder="Doe"
          style="width: 100%; padding: 8px; border: 1px solid var(--color-border-primary); border-radius: var(--dimension-radius-075); background: var(--color-background-primary); color: var(--color-foreground-primary); font-size: 14px; box-sizing: border-box" />
      </ds-field>
    </div>
  `,
};
