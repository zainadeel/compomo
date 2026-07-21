import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-message-bubble.js';

export default { title: 'Conversation/Message bubble', tags: ['autodocs'] } satisfies Meta;
type Story = StoryObj;

export const Variants: Story = {
  render: () => html`
    <div style="display:grid;gap:var(--dimension-space-100);">
      <ds-message-bubble variant="user">User message</ds-message-bubble>
      <ds-message-bubble variant="received">Received message</ds-message-bubble>
    </div>
  `,
};
