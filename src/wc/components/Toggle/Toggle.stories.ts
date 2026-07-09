import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-toggle.js';

const meta: Meta = {
  title: 'Form/Toggle',
  tags: ['autodocs'],
  argTypes: {
    checked:  { control: 'boolean' },
    isInactive: { control: 'boolean' },
  },
  args: { checked: false, isInactive: false },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <ds-toggle
      ?checked=${args['checked']}
      ?is-inactive=${args['isInactive']}
      aria-label="Playground toggle"
    ></ds-toggle>
  `,
};

export const States: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 16px">
      <div style="display: flex; align-items: center; gap: 16px">
        <ds-toggle aria-label="Off"></ds-toggle>
        <span style="font-size: 13px; color: #555">Off (default)</span>
      </div>
      <div style="display: flex; align-items: center; gap: 16px">
        <ds-toggle checked aria-label="On"></ds-toggle>
        <span style="font-size: 13px; color: #555">On</span>
      </div>
      <div style="display: flex; align-items: center; gap: 16px">
        <ds-toggle is-inactive aria-label="Inactive off"></ds-toggle>
        <span style="font-size: 13px; color: #555">Inactive off</span>
      </div>
      <div style="display: flex; align-items: center; gap: 16px">
        <ds-toggle checked is-inactive aria-label="Inactive on"></ds-toggle>
        <span style="font-size: 13px; color: #555">Inactive on</span>
      </div>
    </div>
  `,
};
