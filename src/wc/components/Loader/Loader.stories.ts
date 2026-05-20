import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-loader.js';

const meta: Meta = {
  title: 'Primitives/Loader',
  tags: ['autodocs'],
  argTypes: {
    size:  { control: 'number' },
    label: { control: 'text' },
  },
  args: { size: 20 },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: args => html`<ds-loader size=${args['size']}></ds-loader>`,
};

export const WithLabel: Story = {
  args: { label: 'Loading' },
  render: args => html`<ds-loader size=${args['size']} label=${args['label']}></ds-loader>`,
};

export const Sizes: Story = {
  render: () => html`
    <div style="display: flex; gap: 16px; align-items: center">
      ${[12, 16, 20, 24, 32, 48].map(s => html`
        <div style="display: flex; flex-direction: column; align-items: center; gap: 6px">
          <ds-loader size=${s}></ds-loader>
          <span style="font-size: 10px; font-family: monospace; color: #888">${s}px</span>
        </div>
      `)}
    </div>
  `,
};

export const Colors: Story = {
  render: () => html`
    <div style="display: flex; gap: 12px; align-items: center">
      <ds-loader size="20"></ds-loader>
      <span style="color: #2563eb"><ds-loader size="20"></ds-loader></span>
      <span style="color: #16a34a"><ds-loader size="20"></ds-loader></span>
      <span style="color: #dc2626"><ds-loader size="20"></ds-loader></span>
      <span style="padding: 6px; background: #1e293b; border-radius: 6px; display: flex">
        <span style="color: #fff"><ds-loader size="20"></ds-loader></span>
      </span>
    </div>
  `,
};
