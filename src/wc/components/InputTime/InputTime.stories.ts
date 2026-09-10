import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-input-time.js';

const meta: Meta = {
  title: 'Form/Input Time',
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text' },
    min: { control: 'text' },
    max: { control: 'text' },
    step: { control: 'text' },
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
    value: '09:00',
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
      <ds-input-time
        value=${args['value'] ?? ''}
        min=${args['min'] ?? ''}
        max=${args['max'] ?? ''}
        step=${args['step'] ?? '60'}
        size=${args['size'] ?? 'md'}
        width=${args['width'] ?? 'fill'}
        .hasBorder=${args['hasBorder']}
        .hasInteractionFill=${args['hasInteractionFill']}
        ?is-inactive=${args['isInactive']}
        ?read-only=${args['readOnly']}
        ?error=${args['error']}
        error-message=${args['errorMessage'] ?? ''}
        aria-label="Playground time"
      ></ds-input-time>
    </div>
  `,
};

export const SizesAndStates: Story = {
  render: () => html`
    <div
      style="display:grid;grid-template-columns:max-content 320px;align-items:center;gap:var(--dimension-space-100) var(--dimension-space-200);"
    >
      <ds-text variant="text-body-small" color="secondary">Large</ds-text>
      <ds-input-time size="lg" value="09:00" aria-label="Large time"></ds-input-time>
      <ds-text variant="text-body-small" color="secondary">Medium</ds-text>
      <ds-input-time size="md" value="09:00" aria-label="Medium time"></ds-input-time>
      <ds-text variant="text-body-small" color="secondary">Small</ds-text>
      <ds-input-time size="sm" value="09:00" aria-label="Small time"></ds-input-time>
      <ds-text variant="text-body-small" color="secondary">Extra small</ds-text>
      <ds-input-time size="xs" value="09:00" aria-label="Extra-small time"></ds-input-time>
      <ds-text variant="text-body-small" color="secondary">Empty</ds-text>
      <ds-input-time aria-label="Empty time"></ds-input-time>
      <ds-text variant="text-body-small" color="secondary">Error</ds-text>
      <ds-input-time
        error
        error-message="This field is required"
        aria-label="Error time"
      ></ds-input-time>
      <ds-text variant="text-body-small" color="secondary">Inactive</ds-text>
      <ds-input-time value="09:00" is-inactive aria-label="Inactive time"></ds-input-time>
    </div>
  `,
};
