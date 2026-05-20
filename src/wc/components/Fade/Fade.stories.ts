import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-fade.js';

const meta: Meta = {
  title: 'Primitives/Fade',
  tags: ['autodocs'],
  argTypes: {
    side:       { control: 'select', options: ['top', 'bottom', 'left', 'right'] },
    height:     { control: 'text' },
    background: { control: 'text' },
  },
  args: {
    side: 'bottom',
    height: '48px',
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <div style="position: relative; height: 120px; overflow: hidden; background: var(--color-background-secondary); border-radius: 8px; padding: 12px">
      <p style="margin: 0; line-height: 1.6">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        Ut enim ad minim veniam, quis nostrud exercitation ullamco.
      </p>
      <ds-fade side=${args['side']} height=${args['height']}></ds-fade>
    </div>
  `,
};

export const AllSides: Story = {
  render: () => html`
    <div style="display: flex; gap: 16px; flex-wrap: wrap">
      ${['bottom', 'top', 'left', 'right'].map(side => html`
        <div>
          <div style="font-size: 11px; font-family: monospace; color: var(--color-foreground-tertiary); margin-bottom: 6px">${side}</div>
          <div style="position: relative; width: 160px; height: 80px; overflow: hidden; background: var(--color-background-secondary); border-radius: 8px">
            <ds-fade side=${side} height="40px"></ds-fade>
          </div>
        </div>
      `)}
    </div>
  `,
};
