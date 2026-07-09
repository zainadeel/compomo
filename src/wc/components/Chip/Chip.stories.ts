import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-chip.js';
import '../../../../dist/components/ds-icon.js';

const STATES      = ['default', 'active', 'error', 'caution'] as const;
const SIZES       = ['md', 'sm', 'xs'] as const;
const BACKGROUNDS = ['', 'faint', 'medium', 'bold', 'strong', 'always-dark'];

const meta: Meta = {
  title: 'Primitives/Chip',
  tags: ['autodocs'],
  argTypes: {
    label:      { control: 'text' },
    state:      { control: 'select', options: [...STATES] },
    size:       { control: 'select', options: [...SIZES] },
    rounded:    { control: 'boolean' },
    removable:  { control: 'boolean' },
    isInactive: { control: 'boolean' },
    background: { control: 'select', options: BACKGROUNDS },
    maxWidth:   { control: 'text' },
  },
  args: {
    label:      'Chip',
    state:      'default',
    size:       'md',
    rounded:    false,
    removable:  true,
    isInactive: false,
    background: '',
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
      background=${args['background'] || undefined}
      max-width=${args['maxWidth'] || undefined}
      ?rounded=${args['rounded']}
      ?removable=${args['removable']}
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

/** Trailing dismiss control sized to control-density icon metrics (md/sm/xs). */
export const Removable: Story = {
  render: () => html`
    <div style="display: flex; gap: var(--dimension-space-100); flex-wrap: wrap; align-items: center">
      ${SIZES.map(size => html`
        <ds-chip label="Removable" state="default" size=${size} removable ?rounded=${size === 'md'}></ds-chip>
      `)}
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
