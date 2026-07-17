import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-field.js';
import '../../../../dist/components/ds-input.js';
import '../../../../dist/components/ds-select.js';

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Pending', value: 'pending' },
];

const meta: Meta = {
  title: 'Form/Field',
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'boolean' },
    errorMessage: { control: 'text' },
  },
  args: {
    label: 'Vehicle name',
    description: 'Use the name shown in your fleet.',
    error: false,
    errorMessage: 'Enter a vehicle name.',
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <div style="width:320px;">
      <ds-field
        label=${args['label'] ?? 'Vehicle name'}
        description=${args['description'] ?? ''}
        ?error=${args['error']}
        error-message=${args['errorMessage'] ?? ''}
      >
        <ds-input placeholder="Enter vehicle name"></ds-input>
      </ds-field>
    </div>
  `,
};

export const WithInput: Story = {
  render: () => html`
    <div style="width:320px;">
      <ds-field
        label="Email address"
        description="We will only use this for account notifications."
        field-id="account-email"
      >
        <ds-input name="email" type="email" autocomplete="email" placeholder="name@example.com" required></ds-input>
      </ds-field>
    </div>
  `,
};

export const WithSelect: Story = {
  render: () => html`
    <div style="width:320px;">
      <ds-field label="Status" description="Choose the vehicle's current operating status.">
        <ds-select .options=${STATUS_OPTIONS} width="fill" placeholder="Select status"></ds-select>
      </ds-field>
    </div>
  `,
};

export const Error: Story = {
  render: () => html`
    <div style="width:320px;">
      <ds-field
        label="Vehicle name"
        description="Use the name shown in your fleet."
        error
        error-message="Enter a vehicle name."
      >
        <ds-input value="" placeholder="Enter vehicle name" required></ds-input>
      </ds-field>
    </div>
  `,
};

export const ReadOnlyAndInactive: Story = {
  render: () => html`
    <div style="width:320px;display:flex;flex-direction:column;gap:var(--dimension-space-200);">
      <ds-field label="Vehicle ID" description="Read-only values remain focusable and are submitted with the form.">
        <ds-input value="VH-1042" read-only></ds-input>
      </ds-field>
      <ds-field label="Archived vehicle" description="Inactive fields are unavailable and omitted from submission.">
        <ds-input value="VH-0091" is-inactive></ds-input>
      </ds-field>
    </div>
  `,
};
