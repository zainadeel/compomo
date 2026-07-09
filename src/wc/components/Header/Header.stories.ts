import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-header.js';
import '../../../../dist/components/ds-button-filled.js';
import '../../../../dist/components/ds-button-unfilled.js';

const meta: Meta = {
  title: 'Layout/Header',
  tags: ['autodocs'],
  argTypes: {
    heading:    { control: 'text' },
    background: { control: 'select', options: ['primary', 'secondary', 'transparent', 'translucent'] },
  },
  args: { heading: 'Page Title', background: 'secondary' },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <ds-header heading=${args['heading'] ?? 'Page Title'} background=${args['background'] ?? 'secondary'}>
    </ds-header>
  `,
};

export const WithSlots: Story = {
  render: () => html`
    <ds-header heading="Dashboard">
      <ds-button-unfilled variant="icon" slot="left" icon="Menu" aria-label="Menu"></ds-button-unfilled>
      <ds-button-filled variant="icon" slot="right" icon="Plus" intent="brand" aria-label="New"></ds-button-filled>
    </ds-header>
  `,
};

export const WithCenterSlot: Story = {
  render: () => html`
    <ds-header>
      <ds-button-unfilled variant="icon" slot="left" icon="ArrowLeft" aria-label="Back"></ds-button-unfilled>
      <span slot="center" style="font-weight: 600; font-size: 14px">Centered Title</span>
      <ds-button-unfilled variant="icon" slot="right" icon="Cross" aria-label="Cancel"></ds-button-unfilled>
    </ds-header>
  `,
};
