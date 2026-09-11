import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-calendar.js';

const meta: Meta = {
  title: 'Form/Calendar',
  tags: ['autodocs'],
  argTypes: {
    selectionMode: { control: 'select', options: ['single', 'range'] },
    value: { control: 'text' },
    min: { control: 'text' },
    max: { control: 'text' },
    isInactive: { control: 'boolean' },
  },
  args: {
    selectionMode: 'single',
    value: '2026-09-10',
    isInactive: false,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <div style="width:320px;background:var(--color-background-primary);">
      <ds-calendar
        selection-mode=${args['selectionMode'] ?? 'single'}
        value=${args['value'] ?? ''}
        min=${args['min'] ?? ''}
        max=${args['max'] ?? ''}
        ?is-inactive=${args['isInactive']}
      ></ds-calendar>
    </div>
  `,
};

export const SelectionModes: Story = {
  render: () => html`
    <div style="display:grid;grid-template-columns:320px 320px;gap:var(--dimension-space-300);">
      <div>
        <ds-text variant="text-body-small" color="secondary">Single date</ds-text>
        <ds-calendar selection-mode="single" value="2026-09-10"></ds-calendar>
      </div>
      <div>
        <ds-text variant="text-body-small" color="secondary">Date range</ds-text>
        <ds-calendar selection-mode="range" value="range:2026-09-08/2026-09-16"></ds-calendar>
      </div>
    </div>
  `,
};
