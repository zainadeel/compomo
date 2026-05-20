import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-header.js';
import '../../../../dist/components/ds-button.js';

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
      <ds-button slot="left" aria-label="Menu" size="sm" variant="secondary">
        <svg slot="icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </ds-button>
      <ds-button slot="right" label="New" intent="brand" size="sm"></ds-button>
    </ds-header>
  `,
};

export const WithCenterSlot: Story = {
  render: () => html`
    <ds-header>
      <ds-button slot="left" variant="secondary" size="sm" aria-label="Back">
        <svg slot="icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M12 4l-6 6 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </ds-button>
      <span slot="center" style="font-weight: 600; font-size: 14px">Centered Title</span>
      <ds-button slot="right" variant="secondary" size="sm" label="Cancel"></ds-button>
    </ds-header>
  `,
};
