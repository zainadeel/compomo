import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-input-date.js';

const meta: Meta = {
  title: 'Form/Input Date',
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text' },
    min: { control: 'text' },
    max: { control: 'text' },
    size: { control: 'select', options: ['lg', 'md', 'sm', 'xs'] },
    width: { control: 'select', options: ['fill', 'hug'] },
    hasBorder: { control: 'boolean' },
    hasInteractionFill: { control: 'boolean' },
    isInactive: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    error: { control: 'boolean' },
    errorMessage: { control: 'text' },
  },
  args: {
    value: '2026-09-10',
    size: 'md',
    width: 'fill',
    hasBorder: true,
    hasInteractionFill: true,
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
      <ds-input-date
        value=${args['value'] ?? ''}
        min=${args['min'] ?? ''}
        max=${args['max'] ?? ''}
        size=${args['size'] ?? 'md'}
        width=${args['width'] ?? 'fill'}
        .hasBorder=${args['hasBorder']}
        .hasInteractionFill=${args['hasInteractionFill']}
        ?is-inactive=${args['isInactive']}
        ?read-only=${args['readOnly']}
        ?error=${args['error']}
        error-message=${args['errorMessage'] ?? ''}
        aria-label="Playground date"
      ></ds-input-date>
    </div>
  `,
};

export const SizesAndStates: Story = {
  render: () => html`
    <div
      style="display:grid;grid-template-columns:max-content 320px;align-items:center;gap:var(--dimension-space-100) var(--dimension-space-200);"
    >
      <ds-text variant="text-body-small" color="secondary">Large</ds-text>
      <ds-input-date size="lg" value="2026-09-10" aria-label="Large date"></ds-input-date>
      <ds-text variant="text-body-small" color="secondary">Medium</ds-text>
      <ds-input-date size="md" value="2026-09-10" aria-label="Medium date"></ds-input-date>
      <ds-text variant="text-body-small" color="secondary">Small</ds-text>
      <ds-input-date size="sm" value="2026-09-10" aria-label="Small date"></ds-input-date>
      <ds-text variant="text-body-small" color="secondary">Extra small</ds-text>
      <ds-input-date size="xs" value="2026-09-10" aria-label="Extra-small date"></ds-input-date>
      <ds-text variant="text-body-small" color="secondary">Empty</ds-text>
      <ds-input-date aria-label="Empty date"></ds-input-date>
      <ds-text variant="text-body-small" color="secondary">Error</ds-text>
      <ds-input-date
        error
        error-message="This field is required"
        aria-label="Error date"
      ></ds-input-date>
      <ds-text variant="text-body-small" color="secondary">Inactive</ds-text>
      <ds-input-date value="2026-09-10" is-inactive aria-label="Inactive date"></ds-input-date>
    </div>
  `,
};
