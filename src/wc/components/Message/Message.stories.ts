import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import '../../../../dist/components/ds-message.js';
import '../../../../dist/components/ds-message-actions.js';
import '../../../../dist/components/ds-message-bubble.js';

export default { title: 'Conversation/Message row', tags: ['autodocs'] } satisfies Meta;
type Story = StoryObj;

export const Incoming: Story = {
  render: () => html`
    <ds-message message-id="one" direction="incoming" author="Avery" timestamp="9:41 AM">
      <ds-message-bubble variant="received"
        >Can you send the revised arrival window?</ds-message-bubble
      >
    </ds-message>
  `,
};

export const Outgoing: Story = {
  render: () => html`
    <ds-message
      message-id="two"
      direction="outgoing"
      author="You"
      .showAuthor=${false}
      timestamp="9:45 AM"
      delivery-state="read"
    >
      <ds-message-bubble variant="user">I’ll confirm it now.</ds-message-bubble>
    </ds-message>
  `,
};

export const FailedOutgoing: Story = {
  name: 'Failed outgoing delivery',
  render: () => html`
    <ds-message
      message-id="failed"
      direction="outgoing"
      author="You"
      .showAuthor=${false}
      timestamp="9:45 AM"
      delivery-state="failed"
    >
      <ds-message-bubble variant="user">I’ll confirm it now.</ds-message-bubble>
    </ds-message>
  `,
};

export const MetadataActions: Story = {
  render: () => html`
    <div style="display:grid; gap:var(--dimension-space-300); width:min(600px, 90vw);">
      <ds-message
        message-id="action-incoming"
        direction="incoming"
        author="Agent"
        .showAuthor=${false}
        timestamp="9:41 AM"
        metadata-visibility="hover"
      >
        <p style="margin:0;">The requested summary is ready.</p>
        <ds-message-actions
          slot="metadata-actions"
          copy-text="The requested summary is ready."
          .feedbackEnabled=${true}
        ></ds-message-actions>
      </ds-message>
      <ds-message
        message-id="action-outgoing"
        direction="outgoing"
        author="You"
        .showAuthor=${false}
        timestamp="9:45 AM"
        delivery-state="read"
        metadata-visibility="hover"
      >
        <ds-message-bubble variant="user">Share it with dispatch.</ds-message-bubble>
        <ds-message-actions
          slot="metadata-actions"
          copy-text="Share it with dispatch."
        ></ds-message-actions>
      </ds-message>
    </div>
  `,
};

export const Grouped: Story = {
  render: () => html`
    <div style="display:grid; gap:var(--dimension-space-300); width:min(600px, 90vw);">
      <ds-message
        message-id="group-one"
        direction="incoming"
        author="Avery"
        group-position="first"
      >
        <ds-message-bubble variant="received">The route is updated.</ds-message-bubble>
      </ds-message>
      <ds-message
        message-id="group-two"
        direction="incoming"
        author="Avery"
        group-position="last"
        timestamp="9:42 AM"
      >
        <ds-message-bubble variant="received"
          >The customer confirmed the new window.</ds-message-bubble
        >
      </ds-message>
      <ds-message
        message-id="group-three"
        direction="outgoing"
        author="You"
        .showAuthor=${false}
        timestamp="9:45 AM"
        delivery-state="delivered"
      >
        <ds-message-bubble variant="user">Thanks—I’ll notify the driver.</ds-message-bubble>
      </ds-message>
    </div>
  `,
};
