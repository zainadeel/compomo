import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';

// Side-effect import: self-registers <ds-divider> via customElements.define().
// Requires `npm run build` (stencil build) to have run first.
import '../../../../dist/components/ds-divider.js';

const meta: Meta = {
  title: 'Components/Divider',
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Direction of the divider line.',
    },
  },
  args: {
    orientation: 'horizontal',
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`<ds-divider orientation=${args['orientation']}></ds-divider>`,
};

export const Horizontal: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 16px; width: 300px">
      <p style="margin: 0">Section one content above the divider.</p>
      <ds-divider></ds-divider>
      <p style="margin: 0">Section two content below the divider.</p>
    </div>
  `,
};

export const Vertical: Story = {
  render: () => html`
    <div style="display: flex; align-items: center; gap: 16px; height: 40px">
      <span>Left</span>
      <ds-divider orientation="vertical"></ds-divider>
      <span>Right</span>
    </div>
  `,
};

export const InList: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; width: 280px">
      <div style="padding: 12px 0">Item 1</div>
      <ds-divider></ds-divider>
      <div style="padding: 12px 0">Item 2</div>
      <ds-divider></ds-divider>
      <div style="padding: 12px 0">Item 3</div>
      <ds-divider></ds-divider>
      <div style="padding: 12px 0">Item 4</div>
    </div>
  `,
};
