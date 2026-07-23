import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-typing-indicator.js';

const meta = {
  title: 'Conversation/Typing indicator',
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
  },
  args: {
    label: 'Typing...',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: args => html`
    <ds-typing-indicator label=${args['label'] ?? 'Typing...'}></ds-typing-indicator>
  `,
};
