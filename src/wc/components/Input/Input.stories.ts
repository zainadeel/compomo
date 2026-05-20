import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-input.js';

const meta: Meta = {
  title: 'Form/Input',
  tags: ['autodocs'],
  argTypes: {
    value:        { control: 'text' },
    placeholder:  { control: 'text' },
    type:         { control: 'select', options: ['text', 'email', 'tel', 'url', 'search', 'password'] },
    inactive:     { control: 'boolean' },
    error:        { control: 'boolean' },
    errorMessage: { control: 'text' },
  },
  args: { value: '', placeholder: 'Placeholder text', type: 'text', inactive: false, error: false },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <div style="width: 320px">
      <ds-input
        value=${args['value'] ?? ''}
        placeholder=${args['placeholder'] ?? ''}
        type=${args['type'] ?? 'text'}
        ?inactive=${args['inactive']}
        ?error=${args['error']}
        errorMessage=${args['errorMessage'] ?? ''}
        aria-label="Playground input"
      ></ds-input>
    </div>
  `,
};

export const Variants: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 16px; width: 320px">
      <ds-input value="" placeholder="Text input" aria-label="Text"></ds-input>
      <ds-input value="user@example.com" type="email" aria-label="Email"></ds-input>
      <ds-input value="search query" type="search" aria-label="Search"></ds-input>
      <ds-input value="" placeholder="Password" type="password" aria-label="Password"></ds-input>
      <ds-input value="" placeholder="Error state" error errorMessage="This field is required" aria-label="Error input"></ds-input>
      <ds-input value="Inactive" inactive aria-label="Inactive input"></ds-input>
    </div>
  `,
};
