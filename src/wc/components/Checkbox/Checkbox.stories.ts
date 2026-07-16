import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-checkbox.js';

const meta: Meta = {
  title: 'Form/Checkbox',
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    size: { control: 'select', options: ['md', 'sm', 'xs'] },
    checked: { control: 'boolean' },
    indeterminate: { control: 'boolean' },
    isInactive: { control: 'boolean' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
  },
  args: {
    label: 'Checkbox label',
    size: 'md',
    checked: false,
    indeterminate: false,
    isInactive: false,
    disabled: false,
    required: false,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <ds-checkbox
      label=${args['label']}
      size=${args['size']}
      ?checked=${args['checked']}
      ?indeterminate=${args['indeterminate']}
      ?is-inactive=${args['isInactive']}
      ?disabled=${args['disabled']}
      ?required=${args['required']}
    ></ds-checkbox>
  `,
};

export const Sizes: Story = {
  render: () => html`
    <div style="display:flex;flex-direction:column;align-items:flex-start;gap:var(--dimension-space-100);">
      <ds-checkbox size="md" label="Medium — 16px box in a 20px placement" checked></ds-checkbox>
      <ds-checkbox size="sm" label="Small — 12px box in a 16px placement" checked></ds-checkbox>
      <ds-checkbox size="xs" label="Extra small — 8px box in a 12px placement" checked></ds-checkbox>
    </div>
  `,
};

export const States: Story = {
  render: () => html`
    <div style="display:flex;flex-direction:column;align-items:flex-start;gap:var(--dimension-space-050);max-width:240px;">
      <ds-checkbox label="Unchecked"></ds-checkbox>
      <ds-checkbox label="Checked" checked></ds-checkbox>
      <ds-checkbox label="Indeterminate" indeterminate></ds-checkbox>
      <ds-checkbox label="Disabled checked" checked disabled></ds-checkbox>
      <ds-checkbox label="Inactive unchecked" is-inactive></ds-checkbox>
      <ds-checkbox label="Inactive checked" checked is-inactive></ds-checkbox>
    </div>
  `,
};

export const PresentationIndicators: Story = {
  render: () => html`
    <div style="display:flex;align-items:center;gap:var(--dimension-space-200);">
      ${(['md', 'sm', 'xs'] as const).map(size => html`
        <div
          style="
            display:flex;
            align-items:center;
            justify-content:center;
            width:var(--dimension-iconography-md);
            height:var(--dimension-iconography-md);
            background:var(--color-background-faint-neutral);
          "
        >
          <ds-checkbox label="" size=${size} checked presentation></ds-checkbox>
        </div>
      `)}
    </div>
  `,
};
