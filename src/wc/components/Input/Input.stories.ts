import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-input.js';

const meta: Meta = {
  title: 'Form/Input',
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text' },
    placeholder: { control: 'text' },
    type: { control: 'select', options: ['text', 'email', 'tel', 'url', 'search', 'password'] },
    size: { control: 'select', options: ['md', 'sm', 'xs'] },
    width: { control: 'select', options: ['fill', 'hug'] },
    icon: { control: 'text' },
    hasBorder: { control: 'boolean' },
    isInactive: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    error: { control: 'boolean' },
    errorMessage: { control: 'text' },
  },
  args: {
    value: '',
    placeholder: 'Placeholder text',
    type: 'text',
    size: 'md',
    width: 'fill',
    icon: 'MagnifyingGlass',
    hasBorder: true,
    isInactive: false,
    readOnly: false,
    error: false,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <div style="width:320px;">
      <ds-input
        value=${args['value'] ?? ''}
        placeholder=${args['placeholder'] ?? ''}
        type=${args['type'] ?? 'text'}
        size=${args['size'] ?? 'md'}
        width=${args['width'] ?? 'fill'}
        icon=${args['icon'] ?? ''}
        .hasBorder=${args['hasBorder']}
        ?is-inactive=${args['isInactive']}
        ?read-only=${args['readOnly']}
        ?error=${args['error']}
        errorMessage=${args['errorMessage'] ?? ''}
        aria-label="Playground input"
      ></ds-input>
    </div>
  `,
};

export const SizesAndStates: Story = {
  render: () => html`
    <div style="display:grid;grid-template-columns:max-content 320px;align-items:center;gap:var(--dimension-space-100) var(--dimension-space-200);">
      <ds-text variant="text-body-small" color="secondary">Medium</ds-text>
      <ds-input size="md" placeholder="Medium input" aria-label="Medium input"></ds-input>
      <ds-text variant="text-body-small" color="secondary">Small</ds-text>
      <ds-input size="sm" placeholder="Small input" aria-label="Small input"></ds-input>
      <ds-text variant="text-body-small" color="secondary">Extra small</ds-text>
      <ds-input size="xs" placeholder="Extra-small input" aria-label="Extra-small input"></ds-input>
      <ds-text variant="text-body-small" color="secondary">Value</ds-text>
      <ds-input value="Entered value" icon="MagnifyingGlass" aria-label="Input with value"></ds-input>
      <ds-text variant="text-body-small" color="secondary">Search</ds-text>
      <ds-input type="search" value="Search query" icon="MagnifyingGlass" aria-label="Search input"></ds-input>
      <ds-text variant="text-body-small" color="secondary">Suffix</ds-text>
      <ds-input value="48" aria-label="Input with suffix">
        <ds-text slot="suffix" as="span" variant="text-body-medium" color="inherit">%</ds-text>
      </ds-input>
      <ds-text variant="text-body-small" color="secondary">Error</ds-text>
      <ds-input error error-message="This field is required" placeholder="Required field" aria-label="Error input"></ds-input>
      <ds-text variant="text-body-small" color="secondary">Inactive</ds-text>
      <ds-input value="Inactive value" is-inactive aria-label="Inactive input"></ds-input>
      <ds-text variant="text-body-small" color="secondary">Read-only</ds-text>
      <ds-input value="Read-only value" read-only aria-label="Read-only input"></ds-input>
      <ds-text variant="text-body-small" color="secondary">Borderless</ds-text>
      <ds-input value="Borderless value" .hasBorder=${false} aria-label="Borderless input"></ds-input>
    </div>
  `,
};
