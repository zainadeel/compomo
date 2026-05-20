import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-card.js';

const meta: Meta = {
  title: 'Layout/Card',
  tags: ['autodocs'],
  argTypes: {
    elevation: { control: 'select', options: ['flat', 'elevated', 'floating'] },
    radius:    { control: 'select', options: ['sm', 'md', 'lg', 'xl'] },
  },
  args: { elevation: 'elevated', radius: 'lg' },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <div style="width: 320px">
      <ds-card elevation=${args['elevation'] ?? 'elevated'} radius=${args['radius'] ?? 'lg'}>
        <div slot="header" style="font-weight: 600">Card Header</div>
        Card body content goes here.
        <div slot="footer" style="color: var(--color-foreground-secondary); font-size: 12px">Card Footer</div>
      </ds-card>
    </div>
  `,
};

export const Variants: Story = {
  render: () => html`
    <div style="display: flex; gap: 24px; flex-wrap: wrap">
      <ds-card elevation="flat" style="width: 200px">
        <div slot="header" style="font-weight: 600">Flat</div>
        Body content
      </ds-card>
      <ds-card elevation="elevated" style="width: 200px">
        <div slot="header" style="font-weight: 600">Elevated</div>
        Body content
      </ds-card>
      <ds-card elevation="floating" style="width: 200px">
        <div slot="header" style="font-weight: 600">Floating</div>
        Body content
      </ds-card>
    </div>
  `,
};

export const Simple: Story = {
  render: () => html`
    <ds-card style="width: 280px">
      Simple card with no header or footer
    </ds-card>
  `,
};
