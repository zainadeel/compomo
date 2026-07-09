import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../../../../dist/components/ds-select.js';
import '../../../../dist/components/ds-menu.js';

const FRUIT_OPTIONS = [
  { label: 'Apple',  value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
  { label: 'Date',   value: 'date' },
  { label: 'Elderberry', value: 'elderberry' },
];

const STATUS_OPTIONS = [
  { label: 'Active',    value: 'active' },
  { label: 'Inactive',  value: 'inactive' },
  { label: 'Pending',   value: 'pending' },
  { label: 'Suspended', value: 'suspended' },
];

const meta: Meta = {
  title: 'Forms/Select',
  tags: ['autodocs'],
  argTypes: {
    value:       { control: 'text' },
    placeholder: { control: 'text' },
    isInactive:    { control: 'boolean' },
  },
  args: {
    value: '',
    placeholder: 'Select option',
    isInactive: false,
  },
};

export default meta;
type Story = StoryObj;

const COL = 'display: flex; flex-direction: column; gap: 12px; align-items: flex-start; width: 240px;';
const LBL = 'font-size: 10px; font-family: monospace; color: var(--color-foreground-tertiary, #888);';

export const Playground: Story = {
  render: args => html`
    <div style="width: 240px;">
      <ds-select
        value=${args['value'] ?? ''}
        placeholder=${args['placeholder'] ?? 'Select option'}
        ?is-inactive=${args['isInactive']}
        ${ref(el => {
          if (!el) return;
          (el as any).options = FRUIT_OPTIONS;
        })}
      ></ds-select>
    </div>
  `,
};

export const WithPlaceholder: Story = {
  render: () => html`
    <div style="${COL}">
      <span style="${LBL}">No value selected — shows placeholder</span>
      <ds-select
        placeholder="Choose a fruit"
        ${ref(el => {
          if (!el) return;
          (el as any).options = FRUIT_OPTIONS;
          (el as any).value = '';
        })}
      ></ds-select>

      <span style="${LBL}">Value selected — shows label</span>
      <ds-select
        ${ref(el => {
          if (!el) return;
          (el as any).options = FRUIT_OPTIONS;
          (el as any).value = 'cherry';
        })}
      ></ds-select>
    </div>
  `,
};

export const Inactive: Story = {
  render: () => html`
    <div style="${COL}">
      <span style="${LBL}">Inactive with no selection</span>
      <ds-select
        is-inactive
        placeholder="Disabled select"
        ${ref(el => {
          if (!el) return;
          (el as any).options = FRUIT_OPTIONS;
        })}
      ></ds-select>

      <span style="${LBL}">Inactive with selection</span>
      <ds-select
        is-inactive
        ${ref(el => {
          if (!el) return;
          (el as any).options = STATUS_OPTIONS;
          (el as any).value = 'active';
        })}
      ></ds-select>
    </div>
  `,
};

export const StatusSelect: Story = {
  name: 'Status Select',
  render: () => html`
    <div style="width: 200px;">
      <ds-select
        placeholder="Select status"
        ${ref(el => {
          if (!el) return;
          (el as any).options = STATUS_OPTIONS;
        })}
      ></ds-select>
    </div>
  `,
};
