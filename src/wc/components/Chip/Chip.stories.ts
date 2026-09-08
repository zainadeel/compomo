import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-chip.js';

const STATES = ['default', 'active', 'error', 'caution'] as const;
const SIZES = ['md', 'sm', 'xs'] as const;

const meta: Meta = {
  title: 'Primitives/Chip',
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    state: { control: 'select', options: [...STATES] },
    size: { control: 'select', options: [...SIZES] },
    isInset: { control: 'boolean' },
    insetDepth: { control: 'select', options: ['single', 'double'] },
    rounded: { control: 'boolean' },
    isInactive: { control: 'boolean' },
    maxWidth: { control: 'text' },
  },
  args: {
    label: 'Chip',
    state: 'default',
    size: 'md',
    isInset: false,
    insetDepth: 'single',
    rounded: false,
    isInactive: false,
    maxWidth: '',
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
      ?is-inset=${args['isInset']}
      inset-depth=${args['insetDepth']}
      max-width=${args['maxWidth'] || undefined}
      ?rounded=${args['rounded']}
      ?is-inactive=${args['isInactive']}
    ></ds-chip>
  `,
};

export const States: Story = {
  render: () => html`
    <div
      style="display: flex; gap: var(--dimension-space-100); flex-wrap: wrap; align-items: center"
    >
      ${STATES.map(state => html` <ds-chip label=${state} state=${state}></ds-chip> `)}
    </div>
  `,
};

export const Sizes: Story = {
  render: () => html`
    <div style="display: flex; gap: var(--dimension-space-150); align-items: center">
      ${SIZES.map(
        size => html`
          <div
            style="display: flex; flex-direction: column; align-items: center; gap: var(--dimension-space-075)"
          >
            <ds-chip label=${size} state="active" size=${size}></ds-chip>
            <span
              style="font-size: var(--typography-fontsize-xs); color: var(--color-foreground-tertiary)"
              >${size}</span
            >
          </div>
        `
      )}
    </div>
  `,
};

const SIZE_HEIGHT = {
  md: 'var(--dimension-size-400)',
  sm: 'var(--dimension-size-300)',
  xs: 'var(--dimension-size-200)',
} as const;

export const Inset: Story = {
  name: 'Inset density',
  parameters: {
    docs: {
      description: {
        story:
          'Chip always includes the dismiss control. Single and double inset nest inside a same-density parent so the X can be reviewed at the reduced height.',
      },
    },
  },
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: var(--dimension-space-150)">
      ${SIZES.map(size => {
        const parentHeight = SIZE_HEIGHT[size];
        return html`
          <div
            style="display: grid; grid-template-columns: minmax(var(--dimension-size-600), auto) auto auto; gap: var(--dimension-space-100); align-items: center"
          >
            <span
              style="font-size: var(--typography-fontsize-xs); color: var(--color-foreground-tertiary)"
              >${size}</span
            >
            <ds-chip label="Default" state="active" size=${size}></ds-chip>
            <div
              style="display: inline-flex; align-items: center; box-sizing: border-box; width: fit-content; height: ${parentHeight}; padding: var(--dimension-space-025); border-radius: var(--dimension-radius-050); background: var(--color-background-secondary)"
            >
              <ds-chip label="Inset" state="active" size=${size} is-inset></ds-chip>
              <ds-chip
                label="Double"
                state="active"
                size=${size}
                is-inset
                inset-depth="double"
              ></ds-chip>
            </div>
          </div>
        `;
      })}
    </div>
  `,
};

export const Rounded: Story = {
  render: () => html`
    <div
      style="display: flex; gap: var(--dimension-space-100); flex-wrap: wrap; align-items: center"
    >
      <ds-chip label="Default" state="default"></ds-chip>
      <ds-chip label="Rounded" state="active" rounded></ds-chip>
    </div>
  `,
};

export const Inactive: Story = {
  render: () => html`
    <div
      style="display: flex; gap: var(--dimension-space-100); flex-wrap: wrap; align-items: center"
    >
      <ds-chip label="Default" state="default"></ds-chip>
      <ds-chip label="Inactive" state="default" is-inactive></ds-chip>
    </div>
  `,
};

export const FullWidth: Story = {
  name: 'Full width',
  render: () => html`
    <div
      style="display: flex; flex-direction: column; gap: var(--dimension-space-100); width: var(--dimension-form-width-sm)"
    >
      <ds-chip label="Short" state="active" style="width: 100%"></ds-chip>
      <ds-chip
        label="A long assigned value that must truncate"
        state="default"
        style="width: 100%"
      ></ds-chip>
    </div>
  `,
};
