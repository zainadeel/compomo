import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-conversation-list-section.js';
import '../../../../dist/components/ds-conversation-list-item.js';

export default { title: 'Conversation/List section', tags: ['autodocs'] } satisfies Meta;
type Story = StoryObj;
export const Playground: Story = {
  render: () => html`
    <ds-conversation-list-section heading="Today">
      <ds-conversation-list-item
        conversation-id="one"
        conversation-title="Service summary"
        preview="The summary is ready."
      ></ds-conversation-list-item>
      <ds-conversation-list-item
        conversation-id="two"
        conversation-title="Driver check-in"
        preview="The driver has checked in."
      ></ds-conversation-list-item>
    </ds-conversation-list-section>
  `,
};
