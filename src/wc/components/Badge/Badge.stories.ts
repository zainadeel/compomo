import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-badge.js';

const COUNTS = [1, 5, 9, 10, 99];

const meta: Meta = {
  title: 'Primitives/Badge',
  tags: ['autodocs'],
  argTypes: {
    count:      { control: 'number' },
    isSelected: { control: 'boolean' },
    label:      { control: 'text' },
  },
  args: { count: 3, isSelected: false, label: '' },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <ds-badge
      count=${args['count']}
      ?is-selected=${args['isSelected']}
      label=${args['label'] || undefined}
    ></ds-badge>
  `,
};

export const Matrix: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 12px; font-family: sans-serif">
      <div style="display: flex; gap: 16px; align-items: center">
        <span style="font-size: 10px; font-family: monospace; color: #888; min-width: 72px"></span>
        ${COUNTS.map(c => html`<span style="font-size: 10px; font-family: monospace; color: #888; min-width: 72px; text-align: center">${c}</span>`)}
      </div>
      <div style="display: flex; gap: 16px; align-items: center">
        <span style="font-size: 10px; font-family: monospace; color: #888; min-width: 72px">normal</span>
        ${COUNTS.map(c => html`<div style="min-width: 72px; display: flex; justify-content: center"><ds-badge count=${c}></ds-badge></div>`)}
      </div>
      <div style="display: flex; gap: 16px; align-items: center">
        <span style="font-size: 10px; font-family: monospace; color: #888; min-width: 72px">selected</span>
        ${COUNTS.map(c => html`<div style="min-width: 72px; display: flex; justify-content: center"><ds-badge count=${c} is-selected></ds-badge></div>`)}
      </div>
      <div style="display: flex; gap: 16px; align-items: center">
        <span style="font-size: 10px; font-family: monospace; color: #888; min-width: 72px">zero (hidden)</span>
        <ds-badge count="0"></ds-badge>
        <span style="font-size: 11px; color: #aaa">— renders nothing</span>
      </div>
    </div>
  `,
};
