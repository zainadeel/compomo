import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-chip.js';

const STATES      = ['default', 'active', 'error', 'caution'] as const;
const SIZES       = ['md', 'sm', 'xs'] as const;

const meta: Meta = {
  title: 'Primitives/Chip',
  tags: ['autodocs'],
  argTypes: {
    label:      { control: 'text' },
    state:      { control: 'select', options: [...STATES] },
    size:       { control: 'select', options: [...SIZES] },
    rounded:    { control: 'boolean' },
    isInactive: { control: 'boolean' },
    maxWidth:   { control: 'text' },
  },
  args: {
    label:      'Chip',
    state:      'default',
    size:       'md',
    rounded:    false,
    isInactive: false,
    maxWidth:   '',
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <ds-chip
      label=${args['label']}
      state=${args['state']}
      size=${args['size']}
      max-width=${args['maxWidth'] || undefined}
      ?rounded=${args['rounded']}
      ?is-inactive=${args['isInactive']}
    ></ds-chip>
  `,
};

export const States: Story = {
  render: () => html`
    <div style="display: flex; gap: var(--dimension-space-100); flex-wrap: wrap; align-items: center">
      ${STATES.map(state => html`
        <ds-chip label=${state} state=${state}></ds-chip>
      `)}
    </div>
  `,
};

export const Sizes: Story = {
  render: () => html`
    <div style="display: flex; gap: var(--dimension-space-150); align-items: center">
      ${SIZES.map(size => html`
        <div style="display: flex; flex-direction: column; align-items: center; gap: var(--dimension-space-075)">
          <ds-chip label=${size} state="active" size=${size}></ds-chip>
          <span style="font-size: var(--typography-fontsize-xs); font-family: var(--typography-fontfamily-mono); color: var(--color-foreground-tertiary)">${size}</span>
        </div>
      `)}
    </div>
  `,
};

export const Rounded: Story = {
  render: () => html`
    <div style="display: flex; gap: var(--dimension-space-100); flex-wrap: wrap; align-items: center">
      <ds-chip label="Default" state="default"></ds-chip>
      <ds-chip label="Rounded" state="active" rounded></ds-chip>
    </div>
  `,
};

export const Inactive: Story = {
  render: () => html`
    <div style="display: flex; gap: var(--dimension-space-100); flex-wrap: wrap; align-items: center">
      <ds-chip label="Default" state="default"></ds-chip>
      <ds-chip label="Inactive" state="default" is-inactive></ds-chip>
    </div>
  `,
};
