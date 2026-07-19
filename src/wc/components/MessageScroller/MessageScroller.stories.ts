import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-message-scroller.js';
import '../../../../dist/components/ds-message.js';
import '../../../../dist/components/ds-message-bubble.js';
import '../../../../dist/components/ds-message-composer.js';

const meta: Meta = {
  title: 'Conversation/Transcript',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;
type Story = StoryObj;

export const GenericConversation: Story = {
  render: () => html`
    <div style="display:grid; grid-template-rows:minmax(0,1fr) auto; height:720px; width:min(880px, 90vw); background:var(--color-background-primary);">
      <ds-message-scroller messages-label="Support conversation" default-position="end">
        <ds-message message-id="u1" direction="outgoing" author="You" timestamp="2:14 PM" group-position="single">
          <ds-message-bubble variant="primary">Could you summarize the recent service issues?</ds-message-bubble>
        </ds-message>
        <ds-message message-id="s1" direction="incoming" author="Support" timestamp="2:15 PM" group-position="single">
          <ds-message-bubble variant="secondary">Yes. I found three repeat battery issues and two overdue tire inspections.</ds-message-bubble>
        </ds-message>
      </ds-message-scroller>
      <ds-message-composer label="Message support" placeholder="Write a follow-up"></ds-message-composer>
    </div>
  `,
};

export const PersonToPersonReuse: Story = {
  render: () => html`
    <div style="display:grid; grid-template-rows:minmax(0,1fr) auto; height:640px; width:min(720px, 90vw); background:var(--color-background-primary);">
      <ds-message-scroller messages-label="Conversation with Avery" default-position="end">
        <ds-message message-id="p1" direction="incoming" author="Avery" timestamp="9:41 AM" group-position="first">
          <ds-icon slot="avatar" name="Person" size="md"></ds-icon>
          <ds-message-bubble variant="secondary">Could you send the revised arrival window?</ds-message-bubble>
        </ds-message>
        <ds-message message-id="p2" direction="incoming" author="Avery" timestamp="9:42 AM" group-position="last">
          <ds-message-bubble variant="secondary">The customer is available after noon.</ds-message-bubble>
        </ds-message>
        <ds-message message-id="p3" direction="outgoing" author="You" timestamp="9:45 AM" delivery-state="read">
          <ds-message-bubble variant="primary">Yes — I’ll confirm it now.</ds-message-bubble>
        </ds-message>
        <ds-message message-id="typing" direction="incoming" author="Avery" streaming>
          <ds-message-bubble variant="ghost"><ds-text variant="text-body-small" shimmer>Typing…</ds-text></ds-message-bubble>
        </ds-message>
      </ds-message-scroller>
      <ds-message-composer label="Message Avery" placeholder="Write a message"></ds-message-composer>
    </div>
  `,
};
